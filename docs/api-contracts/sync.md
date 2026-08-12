# NiceOS Mobile Sync Contract (V1)

Status: **canonical** — implementation gate for the Flutter field app.
Last updated: 2026-08-12.

The mobile field app is **offline-first**. Reps capture visits, stock, photos,
orders and competitor intel in the field with no connectivity; the device
queues writes locally and flushes them to the server when online. The server
never blocks offline capture.

---

## 1. Entities in scope (V1)

| Entity | Direction | Notes |
|---|---|---|
| `routes` | pull | routes assigned to the rep |
| `route_stops` | pull | ordered stops for those routes |
| `retailers` | pull + push | assigned to the rep; reps may add new retailers offline |
| `visits` | push (pull) | check-ins; a visit is created on-device |
| `visit_items` | push | per-SKU order/stock line items attached to a visit |
| `competitor_observations` | push | logged during a visit |
| `order_intents` | push | order headers created on-device |
| `order_intent_items` | push | line items for order intents |
| `stock_observations` | push | shelf snapshots captured during a visit |
| `shelf_photos` | push | metadata only; binary → storage bucket |
| `health_scores` | pull-only | computed server-side, never sent up |

Client-generated UUIDs are used for **every** pushed row so offline-created
rows have stable identities and are safe to retry.

---

## 2. Auth

- Both endpoints sit behind `verify_jwt = true`.
- The client sends the user's access token as `Authorization: Bearer <jwt>`.
- The functions resolve the token to a `profiles` row, then to a `reps` row.
  Only an active `sales_rep` may sync. Everything is scoped to that rep.
- Token refresh is the client's job (Supabase `auth` session); on `401` the
  client must refresh and retry.

---

## 3. Push — `POST /functions/v1/sync-push`

### 3.1 Request

```jsonc
{
  "device_id": "samsung-a15-uuid",
  "push_token": "expo-or-fcm-token (optional)",
  "batch": [
    {
      "entity": "visits",
      "rows": [ /* visit objects, parent-first order */ ]
    },
    {
      "entity": "visit_items",
      "rows": [ /* child rows reference the parent visit id */ ]
    }
  ]
}
```

- `batch` is an **ordered list of entity groups**. Parents must precede
  children (`routes` → `route_stops`, `visits` → `visit_items`,
  `order_intents` → `order_intent_items`, `visits` → `stock_observations`,
  `visits` → `shelf_photos`).
- Maximum payload: **2000 rows / 4 MB per request**. Larger queues are split
  into multiple sequential requests by the client.
- Every row must include `id` and `updated_at`. All other columns are
  optional; server filters them against the real table columns.

### 3.2 Server behaviour

For each entity, `sync-push` calls the RPC `sync_apply(entity, rows)`:

```
INSERT ... ON CONFLICT (id) DO UPDATE SET <cols>
WHERE tbl.updated_at < excluded.updated_at
```

i.e. **last-write-wins on `updated_at`**. A row whose server copy is newer is
reported as a conflict and **not** written.

Row-level ownership is enforced by the edge function before `sync_apply`:
rows whose `rep_id`/`created_by` do not match the caller are dropped.

### 3.3 Response

```jsonc
{
  "applied": { "visits": 12, "visit_items": 24 },
  "conflicts": [
    {
      "entity": "visits",
      "id": "client-gen-uuid",
      "server_updated_at": "2026-08-06T12:00:00.000Z",
      "reason": "newer-server-row"
    }
  ],
  "cursor": "2026-08-06T12:00:00.000Z"
}
```

- `applied` — count of rows actually written per entity.
- `conflicts` — rows rejected (newer server copy, missing `id`, validation
  error). `reason` values: `newer-server-row`, `missing-id`, `empty-row`,
  `error: <sql message>`.
- `cursor` — the server-side watermark to use for the next pull. In V1 the
  client should keep its own pull cursor from `sync-pull`; `cursor` here is a
  convenience only.

### 3.4 Conflict rule (V1)

On `newer-server-row` the client **keeps the server row** (drops its local
copy), then surfaces a "your change was overwritten" badge in the UI with the
server timestamp. No merge, no three-way. Audit history is preserved in the
DB; UI badges satisfy the "don't silently lose data" requirement.

---

## 4. Pull — `GET /functions/v1/sync-pull`

### 4.1 Request

```
GET /functions/v1/sync-pull?since=2026-08-06T12:00:00.000Z&entities=retailers,routes,route_stops,health_scores
```

- `since` — RFC3339 cursor (UTC). Omit for an initial full pull (server
  caps at 10,000 rows per entity; repeat with the returned cursor).
- `entities` — comma-separated whitelist. If omitted, all entities are pulled.

### 4.2 Response

```jsonc
{
  "cursor": "2026-08-06T12:00:00.000Z",
  "data": {
    "retailers": [
      {
        "id": "...", "name": "Wanjiru Kiosk",
        "updated_at": "2026-08-06T11:59:00.000Z",
        "deleted_at": null,
        /* ... other columns */
      }
    ],
    "health_scores": [ /* ... */ ]
  }
}
```

- Each row is returned **fully** (all columns) — simplest contract, tiny
  tables.
- Rows with `deleted_at != null` are **tombstones**: the client deletes the
  local copy of that `id`.
- `cursor` = max `updated_at` seen across all returned rows (or the input
  `since` if nothing changed). The client persists it per entity and sends it
  back next time.

### 4.3 Scoping

- `retailers`: `rep_id = me OR created_by = me`
- `routes` / `route_stops`: routes where `rep_id = me`
- `visits` / `visit_items`: visits where `rep_id = me`
- `competitor_observations`: `rep_id = me`
- `order_intents` / `order_intent_items`: `rep_id = me OR created_by = me`
- `health_scores`: retailers assigned to me
- `stock_observations` / `shelf_photos`: `rep_id = me`

---

## 5. Photos

1. Upload the binary directly to the `shelf-photos` storage bucket
   (authenticated, private) at path `{rep_id}/{uuid}.jpg`.
2. Push the metadata row to `shelf_photos`: `{ id, visit_id, retailer_id,
   rep_id, file_path, captured_at }`.
3. Viewing on the dashboard goes through **signed URLs** generated
   server-side (the bucket is private; storage RLS restricts a rep to their
   own `{rep_id}/` prefix, migration 19).

Photo upload is fire-and-forget with retry: the metadata row may push before
the binary lands; the dashboard renders a placeholder until the object exists.

---

## 6. Offline queue (client behaviour)

- All pushed rows are staged in the local `pending_sync` box (Hive) keyed by
  `entity:row-id`, ordered by parent-first dependency, with a monotonically
  increasing local sequence.
- On `connectivity_plus` reconnect (or on app start when online): flush the
  queue in dependency order; apply the server response (`applied` clears
  entries; `conflicts` update their `updated_at`/badge state and stay queued
  if still local-newer).
- A visit is only committed to the local store when the check-out form is
  complete; nothing is discarded on failure.
- `device_id` is persisted; `push_token` is refreshed on each push so the
  server can notify later.

## 7. Idempotency & retries

`sync-push` is idempotent by design: identical rows replayed with the same
`id` + `updated_at` produce the same end state (upsert). Clients should retry
with exponential backoff on `5xx`/timeouts and treat `4xx` as permanent
(re-validate payload). Partial success (some entities applied, later ones
failed) is fine — the client resumes from the first failing entity.

## 8. Type alignment

The entity object shapes above mirror:

- `web/niceos-admin/lib/data/types.ts` (canonical dashboard types)
- `supabase/migrations/*` column sets (DB source of truth)
- Flutter models under `mobile/niceos_app/lib/models/` (to be generated from
  `shared/types`)

See `docs/api-contracts/openapi.yaml` (planned, next phase) for machine
readable schemas.
