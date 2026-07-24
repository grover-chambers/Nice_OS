# NiceOS — Remote Development Dependencies

## System Requirements

| Requirement | Details | Priority |
|---|---|---|
| **Flutter SDK** | 3.x stable — required for mobile app development | Critical |
| **Android Studio** | Latest stable with Android SDK (API 34+) | Critical |
| **Node.js** | v20 LTS or v24 (used v24.13.1 in development) | Critical |
| **npm** | Bundled with Node.js | Critical |
| **Git** | v2.x+ for version control | Critical |
| **Dart SDK** | Bundled with Flutter SDK | Critical (via Flutter) |
| **Physical Android device** | Mid-range or better — essential for offline/sync testing | Critical |
| **24–27" external monitor** | Recommended for split-screen dev workflow | Medium |

## Web Dashboard Dependencies

All Node.js dependencies are in `web/niceos-admin/package.json`. Install with:

```bash
cd web/niceos-admin
npm install
```

### Core Web Stack
- **Next.js** (App Router) — React framework with SSR/API routes
- **Tailwind CSS** — Utility-first styling
- **PostCSS + Autoprefixer** — CSS processing
- **Axios** — HTTP client for API calls to backend
- **React Hook Form + Zod** — Form handling and validation
- **React Query (TanStack Query)** — Server state management
- **MapLibre GL JS** — Interactive maps (coverage maps, heatmaps)
- **Recharts** — Charts and data visualization for dashboards
- **Lucide React** — Icons
- **date-fns** — Date utilities
- **clsx + tailwind-merge** — Conditional CSS class merging
- **NextAuth.js** — Authentication (Supabase adapter)
- **@supabase/supabase-js** — Supabase client SDK

## Mobile App Dependencies

All Dart dependencies are in `mobile/niceos_app/pubspec.yaml`. Install with:

```bash
cd mobile/niceos_app
dart pub get
```

### Core Mobile Stack
- **Flutter SDK** — Cross-platform mobile framework
- **provider** — State management
- **dio** — HTTP client for API calls
- **shared_preferences** — Lightweight local storage
- **hive** — Offline-first database for local caching
- **geolocator** — GPS location and background tracking
- **google_maps_flutter** — Map display (coverage maps, routing)
- **camera** — Photo capture for shelf/stock documentation
- **image_picker** — Image selection and capture
- **path_provider** — File system paths for local storage
- **flutter_local_notifications** — Local notifications for alerts
- **intl** — Date/time formatting and localization
- **uuid** — UUID generation for offline sync IDs
- **connectivity_plus** — Network connectivity detection
- **device_info_plus** — Device information

## Backend / Supabase Dependencies

### Supabase (hosted)
- **Supabase** — PostgreSQL with PostGIS
- **Supabase Auth** — Row-level security with JWT
- **Supabase Storage** — Photo/blob storage for shelf images
- **Supabase Edge Functions** — Serverless functions for forwarding, webhooks

### Edge Functions (Deno)
- **Deno** — Runtime for Supabase Edge Functions
- **postgres** — Deno Postgres client
- **std** — Standard Deno library

## Database Schema Dependencies

### PostGIS Extension
```sql
CREATE EXTENSION postgis;
```

### Required Tables (defined in migrations/)
- `users` — Auth users + role assignment
- `territories` — Territory hierarchy (Region → County → Subcounty → Ward → Sales Territory)
- `retailers` — Retailer registry with geo-point, status, owner info
- `visits` — GPS-verified check-in records with timestamps
- `stock_observations` — Shelf stock levels per SKU
- `shelf_photos` — Photo references stored in Supabase Storage
- `competitor_observations` — Rival brand pricing, promotions, shelf presence
- `order_intents` — Retailer reorder requests with SKU + quantity
- `routes` — System-generated daily routes
- `route_stops` — Ordered sequence of retailers in a route
- `health_scores` — Computed retailer health metrics
- `coverage_logs` — Which territories/wards have been covered

---

## Remote Dev Setup Checklist

1. Clone the repo
2. Install Flutter SDK + Android Studio (see flutter.dev/docs/get-started)
3. Install Node.js v20+
4. Set environment variables (`.env` files in web/ and mobile/)
5. Spin up Supabase project (supabase.com) or local with Docker
6. Run database migrations (`supabase db push` or `supabase migration up`)
7. `cd web/niceos-admin && npm install`
8. `cd mobile/niceos_app && dart pub get`
9. Run Next.js dev server: `npm run dev`
10. Run Flutter on device: `flutter run`
11. Test offline sync on Android device (emulator cannot validate this)