# ChainWork

A full-stack freelance marketplace with milestone-based escrow, built as a Turborepo monorepo with a **Next.js web app** and a **React Native mobile app** sharing one Firebase backend and one business-logic core.

> ⚠️ **Demo escrow:** all blockchain escrow activity is simulated (mock transaction hashes, no real funds). This is by design and applies to every payment flow.

## Monorepo layout

```
apps/
  web/        Next.js 16 app — marketplace UI, server actions, and the REST API (/api/v1)
  mobile/     React Native 0.76 app — same features, same database, bearer-token API auth
packages/
  shared/     Schema & types, Firestore collection names, fee constants, zod schemas,
              fraud engine, TF-IDF gig recommendations
  core/       Platform-agnostic data layer: Firestore reads/writes & live subscriptions,
              auth helpers, typed API client, platform ports (storage/audio/links)
  firebase-client/  Injected Firebase initialization (web auto-init / RN persistence)
```

## Features

**Marketplace** — gig publishing with tiered pricing, category/skill search, TF-IDF AI matching, proposals (freelancer pitches and client custom offers), contracts with milestones.

**Escrow lifecycle (simulated)** — client funds escrow → freelancer delivers → client approves/requests revision → payout released (with a 72-hour auto-release window) → disputes locked for admin arbitration.

**Payments** — wallet deposits, withdrawal requests with admin approval, merged transaction ledger (escrow + wallet), platform fees derived from shared constants (client 5%, freelancer 10%).

**Trust & safety** — KYC submission and admin review, rule-based fraud scoring with live alerts, account restrictions, contract-scoped chat with contact-info (PII) blocking.

**Admin suite** — dashboard, KYC review, fraud engine, dispute arbitration, user management (ban/unban, role management), payments console, analytics, reports, settings. Available on both web and mobile.

## Tech stack

| Layer | Technology |
|---|---|
| Web | Next.js 16 (App Router, server actions), Tailwind CSS v4, shadcn/radix UI |
| Mobile | React Native 0.76 (bare), React Navigation 7 |
| Backend | Firebase Auth + Firestore (shared project), Next.js route handlers as the mobile API |
| Auth | Session cookies (web) and Firebase ID-token Bearer headers (mobile) against the same endpoints |
| Media | Cloudinary unsigned uploads |
| Tooling | Turborepo, pnpm workspaces, TypeScript strict |

## Getting started

### Prerequisites

- Node ≥ 18, pnpm ≥ 9 (`corepack enable`)
- A Firebase project with **Email/Password auth enabled** and Firestore
- For mobile: Android SDK (and/or Xcode)

### 1. Install

```bash
pnpm install
```

### 2. Configure secrets (never committed)

| File | Purpose |
|---|---|
| `apps/web/.env.local` | Copy from `apps/web/.env.example`; Firebase web config + `FIREBASE_ADMIN_KEY_PATH` |
| Service account JSON | Download from Firebase Console → keep **outside the repo**, point `FIREBASE_ADMIN_KEY_PATH` at it |
| `apps/mobile/src/config/firebase-config.ts` | Copy from `firebase-config.example.ts` in the same folder |

### 3. Deploy Firestore rules & indexes

```bash
cd apps/web
npx firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Run

```bash
# Web (http://localhost:3000)
pnpm dev:web

# Mobile (Metro + Android)
pnpm dev:mobile
cd apps/mobile && npx react-native run-android
```

The mobile app talks to the web app's API. On the Android emulator it uses `http://10.0.2.2:3000` automatically; on a physical device set your machine's LAN IP in `apps/mobile/src/config/env.ts`.

### Useful scripts

```bash
pnpm build        # build all workspaces
pnpm type-check   # TypeScript across the monorepo
pnpm lint         # ESLint across the monorepo
cd apps/mobile/android && ./gradlew assembleDebug   # Android APK
```

## Architecture notes

- **One database, two clients.** Mobile reads/subscribes to Firestore directly through `@chainwork/core` (guarded by security rules) and performs privileged operations (escrow, approvals, admin actions) through the web app's `/api/v1` REST surface with Firebase ID-token auth.
- **Server actions and API routes share one implementation** — `getCurrentUser()` accepts either a session cookie or a Bearer token, so every action works for both platforms.
- **Fees are never hardcoded.** All fee math derives from `packages/shared/src/payment/platform-fees.ts`.
- **The escrow service is frozen as a demo** (`apps/web/src/lib/escrow/escrow-service.ts`). Production would replace it with real chain calls behind the same interface.



## License

Private — all rights reserved.
