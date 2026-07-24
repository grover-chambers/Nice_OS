# NiceOS — Market Activation & Intelligence Platform

Internal systems proposal and codebase for Market Link Ltd's field operations engagement with Nice Millers Ltd.

## Project Structure

```
NiceOS/
├── backend/
│   └── supabase/              # Supabase project (DB, Auth, Storage, Edge Functions)
│       └── functions/
│           └── webhook-order-intent/
│               └── index.ts
├── web/
│   └── niceos-admin/           # Next.js web dashboard (App Router + Tailwind)
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── package.json
├── mobile/
│   └── niceos_app/             # Flutter Android app
│       ├── lib/
│       │   ├── models/
│       │   ├── providers/
│       │   ├── screens/
│       │   ├── services/
│       │   └── widgets/
│       ├── assets/
│       └── pubspec.yaml
├── docs/
│   ├── supabase-migrations/    # SQL migration files
│   └── api-contracts/
├── .gitignore
├── .env.example
├── DEPS.md                     # Remote dev dependency list
└── README.md
```

## Quick Start (Web Dashboard)

```bash
cd web/niceos-admin
npm install
npm run dev
```

Open http://localhost:3000

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key

## Quick Start (Mobile App)

```bash
cd mobile/niceos_app
dart pub get
flutter run
```

### Prerequisites

- Flutter SDK 3.x
- Android Studio with Android SDK (API 34+)
- A physical Android device (emulator cannot validate offline sync)

## Tech Stack

| Layer | Technology |
|---|---|
| Web Dashboard | Next.js (App Router) + Tailwind CSS |
| Database | Supabase / PostgreSQL + PostGIS |
| Mobile App | Flutter (Android-first) |
| Auth | Supabase Auth (JWT-based RBAC) |
| Notifications | WhatsApp Business Cloud API |
| Mapping | MapLibre / PostGIS |
| Offline Sync | Hive (local) + background sync queue |

## License

INTERNAL — NOT FOR EXTERNAL DISTRIBUTION
