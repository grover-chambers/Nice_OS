# NiceOS — Backend & API Implementation Plan (v1)

Status: **Ready for execution by another agent.**
Owner decisions (2026-08-06): keep `ceo` role (drop `client`); local worktree is the source of current work; route optimization is **server-side**; all Supabase artifacts consolidate into a single root `supabase/` dir (web migrations left intact, non-canonical); build the mobile **sync scope for V1** before Flutter starts (imminent).

---

## 0. Confirmed decisions

| Decision | Resolution |
|---|---|
| Roles | Four roles everywhere: `admin`, `territory_manager`, `sales_rep`, `ceo`. Drop `client`/`client_viewer`. |
| Source of truth | Local working tree (demo-facade dashboard + root `supabase/migrations/`). |
| Route optimization | Server-side Edge Function (`optimize-route`), TSP/nearest-neighbor weighted by priority. |
| Supabase layout | Single canonical `supabase/` at repo root. Web migrations kept intact but non-canonical. |
| Mobile sync | V1 sync scope must be delivered before Flutter work starts. |

### ⚠️ Migration sets in the repo (do NOT confuse)

1. `supabase/migrations/` (13 files) — **CANONICAL** (decision). Apply these.
2. `web/niceos-admin/supabase/migrations/001_initial_schema.sql` — remote teammate schema, **kept intact, NOT canonical**. Do not apply; do not delete. Optionally add a README note.
3. `docs/supabase-migrations/` (8 files) — old docs archive. Read-only reference; do not apply.

---

## 1. Repo & schema reconciliation

**1.1 Single Supabase project layout**
- Create `supabase/config.toml` (project_id `niceos`, embedded Postgres settings, storage buckets, function configs).
- Create `supabase/seed.sql` pointing at the demo seed content (currently embedded as migration `20260806000013_seed_demo.sql` — keep the migration; `seed.sql` optional).
- Move the edge function `backend/supabase/functions/webhook-order-intent/index.ts` → `supabase/functions/forward-order-intent/index.ts`, **rewrite** to the `order_intent_items` shape (nested items table, not the old single-item shape).
- Delete the now-empty `backend/` directory.
- Add a short README inside `web/niceos-admin/supabase/migrations/` marking it non-canonical.

**1.2 `.gitignore`**
- Add `tsconfig.tsbuildinfo` (untracked build cache that currently blocks `git pull`).
- Ensure `node_modules/`, `.next/`, build artifacts are ignored.

**1.3 Git housekeeping**
- `git pull origin master` is currently blocked by the untracked `tsconfig.tsbuildinfo` — after gitignoring/removing it, pull the remote commit `4949011`.
- Then commit the local demo-facade work (web facade, `lib/geo/`, role-context, supabase libs) onto master. Local worktree remains the source of truth.
- Keep `git pull` before every file operation going forward (one shared master).

**1.4 Role alignment (DONE — do not redo)**
- `web/niceos-admin/lib/data/types.ts:3` → `export type Role = "admin" | "territory_manager" | "sales_rep" | "ceo";` ✅
- `web/niceos-admin/lib/data/index.ts` ROLE_CONFIG keys renamed `manager`→`territory_manager`, `rep`→`sales_rep`. ✅
- `web/niceos-admin/app/(dashboard)/users/page.tsx:32` literals updated. ✅
- Verified: `npx tsc --noEmit` clean; no stray `"manager"`/`"rep"` role literals.
- Remaining checks: any page logic branching on `role === "client"` or `client_viewer`; SQL enums already use `admin | territory_manager | sales_rep | ceo` — confirm all match.

**1.5 Schema gaps to add (new migrations under `supabase/migrations/`)**
- `sku_catalog` — SKU reference (id, sku, name, category, default_price_kes, active, unit).
- `competitor_brands` — brand reference for observation dropdowns (id, name, segment).
- `health_scores` — persisted per-retailer score history (id, retailer_id, score, churn_risk, computed_at, factors jsonb).
- `coverage_logs` — coverage events (id, territory_id, ward, rep_id, event_type, at).
- `opportunities` — opportunity-engine output (id, retailer_id, type, potential_monthly_kes, priority, reason, status, created_at).
- Storage bucket config for `shelf-photos` (public? private authenticated — decide: **private**, served via signed URLs) and `route-export`.

---

## 2. Backend architecture — three layers

```
Web Admin (Next.js server components)         Mobile (Flutter, offline-first)
      │ lib/data facade → lib/queries/*                 │ sync-push / sync-pull
      ▼                                                 ▼
Layer 1: PostgREST + RLS   (CRUD + role-scoped reads, ~90% of traffic)
      ▼
Layer 2: Supabase Edge Functions (service-role logic, webhooks, cron, sync)
      ▼
Layer 3: WhatsApp Cloud API + SMTP (external egress — ONLY from Layer 2)
```

- **RLS anchor:** use `app_scope()` / `current_profile_id()` already defined in `20260806000011_app_scope_and_rls.sql` for every policy.
- Web reads via `lib/supabase/server.ts` (createServerSupabaseClient); mobile via `supabase_service.dart`.
- Edge Functions are the only place with `service_role` access.

---

## 3. Data model — canonical tables (root `supabase/migrations/`)

Existing (13 migrations): `profiles`, `reps`, `territories`, `retailers`, `routes`, `route_stops`, `visits`, `visit_items`, `order_intents`, `order_intent_items`, `competitor_observations`, `alerts`, storage bucket, RLS helpers, demo seed.

New (section 1.5): `sku_catalog`, `competitor_brands`, `health_scores`, `coverage_logs`, `opportunities`.

**Key conventions to maintain:**
- All PKs UUID; mobile-created rows use **client-generated UUIDs**.
- Audit columns: `created_by`, `created_at`, `updated_at` on every table.
- Soft-delete column `deleted_at` where appropriate (mobile needs tombstones for sync).
- `updated_at` is the sync cursor column — every synced table MUST have it indexed.

---

## 4. SQL views + RPCs (identical numbers everywhere)

Views (back the facade functions so page code stays unchanged):
- `v_dashboard_summary` — totals, active/at-risk/churned/prospect counts, coverage %, today's visits/orders, order value, health distribution, weekly trend.
- `v_retailer_health` — health score + churn risk derived from visit cadence vs `target_visit_frequency_days`.
- `v_zone_coverage` / `v_ward_coverage` — visited / under-visited / untouched by zone/ward (85 Nairobi wards reference; ward list in `web/niceos-admin/lib/geo/nairobi-wards.ts`).
- `v_competitor_heatmap` — brand presence aggregated by geography.
- `v_rep_kpi` — visits, strike rate (orders/visits), distance, new outlets, health of book.

RPCs:
- `optimize_route(route_id uuid)` — server-side sequencing (Section 5.3).
- `recompute_health_scores()` — batch refresh of `health_scores`.
- `generate_alerts()` — runs churn/competitive/stock/expiry/visit rule checks → inserts into `alerts`.

**Facade swap:** `web/niceos-admin/lib/data/index.ts` functions (`getDashboardSummary`, `getZoneCoverage`, `getWardCoverage`, `getRetailersByZone`, `getRepManagement`, …) are the seam. Keep signatures; change internals from seed → view/RPC queries via `lib/queries/*.ts`.

---

## 5. Edge Function catalog

### 5.1 `forward-order-intent`
- Trigger: pg_net webhook on INSERT to `order_intents` (line items from `order_intent_items`).
- Behavior: compose WhatsApp message (via WhatsApp Cloud API) to the rep's territory order desk + email fallback; update `forward_status` (`pending→sent|failed`).
- Reuses the old `webhook-order-intent` logic but rewritten for the items-table shape.

### 5.2 `sync-push` (see Section 6 for full contract)
- `POST /sync-push`, authenticated rep. Ordered batch of entity rows. Applies with `INSERT ... ON CONFLICT (id) DO UPDATE`. Returns per-row conflicts.

### 5.3 `sync-pull`
- `GET /sync-pull?since=<cursor>&entities=routes,retailers,...`. Returns per-entity `updated_at` deltas + current cursor.

### 5.4 `optimize-route` — SERVER-SIDE ROUTE OPTIMIZATION
- Input: `{ route_id }` (or stop list with lat/lng + priority).
- Approach v1: **TSP with nearest-neighbor heuristic** weighted by stop priority, using a routing/matrix source:
  - Preferred: OSRM public API (or self-hosted) table service for travel times over `route_stops` coords; fallback to haversine when network unavailable.
  - Sequencer: start at rep home base → repeatedly pick highest-priority stop within acceptable detour → returns ordered `route_stops` with new `order`, `km_from_prev`, `minutes_from_prev`.
- Updates `route_stops.order`; records optimizer meta (optimizer, at, seconds, method) on the route.
- Auth: `territory_manager` or `admin` only (RLS/service-role).

### 5.5 `health-score-engine`
- Cron (daily) + on-visit trigger. Runs `recompute_health_scores()` then `generate_alerts()`.
- Stores to `health_scores`; alerts to `alerts`.

### 5.6 `whatsapp-webhook`
- Inbound WhatsApp (delivery confirmations, rep replies). Parses + updates order/alert status.

### 5.7 `generate-report`
- On-demand/cron: CEO report aggregation (market share, coverage, rep KPIs) → CSV/PDF, stored to `route-export` bucket, link returned.

All functions under `supabase/functions/<name>/index.ts` with `deno.json` deps + entries in `supabase/config.toml`. Shared helper `supabase/functions/_shared/` for auth, CORS, WhatsApp client.

---

## 6. Mobile sync contract (V1) — deliver BEFORE Flutter kickoff

### 6.1 Entities in scope
`routes`, `route_stops`, `retailers` (assigned to rep), `visits`, `visit_items`, `competitor_observations`, `order_intents`, `order_intent_items`, `health_scores` (pull-only), `shelf_photos` (metadata row only; binary → storage).

### 6.2 Push payload (`POST /sync-push`)
```jsonc
{
  "device_id": "samsung-a15-uuid",
  "push_token": "expo/fcm token (optional)",
  "batch": [
    {
      "entity": "visits",
      "rows": [
        {
          "id": "client-gen-uuid",
          "retailer_id": "...", "rep_id": "...",
          "at": "2026-08-06T09:30:00Z",
          "gps_verified": true, "radius_m": 12,
          "status": "completed", "duration_min": 18,
          "stock_captured": true, "photo_count": 2,
          "order_placed": false, "notes": "...",
          "items": [ { "id": "uuid", "sku": "...", "name": "...", "qty": 3, "shelf": "low" } ],
          "created_at": "...", "updated_at": "..."
        }
      ]
    }
  ]
}
```
- Rows are ordered (parent before child). Server applies each with `INSERT ... ON CONFLICT (id) DO UPDATE SET ... WHERE excluded.updated_at > table.updated_at` (LWW).
- Response:
```jsonc
{
  "applied": { "visits": 12, "visit_items": 24 },
  "conflicts": [
    { "entity": "visits", "id": "...", "server_updated_at": "...", "reason": "newer-server-row" }
  ],
  "cursor": "2026-08-06T12:00:00.000Z"
}
```
- Client on conflict: keeps server row, discards local (v1 LWW), surfaces to UI.

### 6.3 Pull (`GET /sync-pull?since=<cursor>&entities=retailers,routes,route_stops,health_scores`)
- Response: `{ cursor, data: { entity: [rows with tombstone deleted_at] } }`.
- Client stores into Hive boxes per entity; `deleted_at != null` → tombstone delete locally.

### 6.4 Photos
- Upload binary directly to storage bucket `shelf-photos` (authenticated, private) as `{rep_id}/{uuid}.jpg`; push only the metadata row `{ id, retailer_id, visit_id, file_path, captured_at }`.

### 6.5 Conflict rule (v1)
- Last-write-wins on `updated_at`; full audit trail; UI badge when a local write was overridden.
- Doc the whole contract in `docs/api-contracts/sync.md`.

### 6.6 Flutter side (V1 build after this contract)
- Already scaffolded: `sync_service.dart` (Hive `pending_sync` box), `supabase_service.dart`, `retailer_model.dart`, `visit_model.dart`.
- Add models: `route_model`, `order_intent_model`, `competitor_observation_model`, `stock_item_model`, `shelf_photo_model`.
- `SyncService` gains: push sequencing (entity order), pull delta application, tombstone handling, retry on `connectivity_plus` reconnect, offline queue flush.

---

## 7. Shared contracts & types

- `shared/types/` — single source of truth: `Role`, `Retailer`, `Visit`, `Route`, `OrderIntent`, `CompetitorObservation`, `HealthScore`, `Opportunity`, `Alert`, `SyncPayload`, `SyncBatch`, `SyncResult`.
- `docs/api-contracts/` — OpenAPI spec for: `forward-order-intent`, `optimize-route`, `sync-push`, `sync-pull`, `health-score-engine`, `whatsapp-webhook`, `generate-report` + the sync contract markdown.
- One-time alignment pass so `lib/data/types.ts`, `database.types.ts` (supabase generated), and Flutter `models/` all derive from `shared/types`.

---

## 8. Target layout

```
Nice_Enterprise_OS/
├── supabase/                         # SINGLE canonical Supabase project
│   ├── config.toml
│   ├── migrations/                   # 13 existing + new gap migrations
│   ├── seed.sql
│   └── functions/
│       ├── _shared/                  # auth, cors, whatsapp client
│       ├── forward-order-intent/
│       ├── sync-push/
│       ├── sync-pull/
│       ├── optimize-route/
│       ├── health-score-engine/
│       ├── whatsapp-webhook/
│       └── generate-report/
├── web/niceos-admin/
│   ├── app/(dashboard)/...
│   ├── lib/data/                     # facade (seed → views/RPC swap points)
│   ├── lib/queries/                  # server query modules (views + RPCs)
│   ├── lib/geo/                      # nairobi-wards.ts etc.
│   └── lib/supabase/{config,client,server}.ts
├── mobile/niceos_app/                # Flutter (sync V1 imminent)
├── shared/types/                     # canonical domain + sync types
└── docs/
    ├── api-contracts/                # OpenAPI + sync.md
    ├── supabase-migrations/          # OLD archive — read-only
    └── nairobi_ward_map_interactive.html   # moved here 2026-08-06
```

---

## 9. Execution order

1. **Repo reconciliation** (1.1–1.3): single `supabase/`, move/rewrite function, delete `backend/`, `.gitignore`, unblock pull, commit local work.
2. **Schema gaps** (1.5): new migrations `sku_catalog`, `competitor_brands`, `health_scores`, `coverage_logs`, `opportunities`.
3. **Sync contract + functions** (6 + 5.2/5.3): `docs/api-contracts/sync.md`, `sync-push`, `sync-pull` — **must land before Flutter starts.**
4. **SQL intelligence layer** (4): views + RPCs + `lib/queries/*` facade swap.
5. **Remaining edge functions** (5.1, 5.4–5.7).
6. **shared/types + OpenAPI** (7).

## 10. Verification

- `supabase db push` / `supabase db reset` applies the canonical set cleanly (do NOT apply the web or docs sets).
- `npx tsc --noEmit` in `web/niceos-admin` passes.
- Facade functions return identical shape pre/post swap.
- Edge functions tested via `supabase functions serve` locally with a service-role JWT.
- Sync round-trip test: Flutter offline → reconnect → push → pull → verify LWW + tombstones.

## 11. Open items
- Storage bucket `shelf-photos` visibility: default **private** + signed URLs (confirm).
- `optimize-route`: self-hosted OSRM vs public OSRM vs PostgreSQL `pgrouting` (default: public OSRM table service with haversine fallback).
- Whether `supabase/seed.sql` should be a separate file or stay fully inside migration 13 (default: keep in migration).
