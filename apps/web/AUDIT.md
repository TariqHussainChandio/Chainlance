# ChainWork Days 1–2 Audit

> Read-only audit performed before starting Day 3. No project files modified.
> Date: 2026-05-23

## Legend

- ✅ PRESENT AND CORRECT (file exists, looks right)
- ⚠️ PRESENT BUT QUESTIONABLE (exists but has issues — explained)
- ❌ MISSING (file doesn't exist)
- 🤷 CAN'T VERIFY (needs runtime check or external info)

---

## 1. Project scaffold

- ✅ **package.json present.** Next.js **16.2.6** (migrated off the originally specified 14). Scripts: `dev` and `build` both pinned to `--turbopack`, plus `seed`, `rules:deploy`, `start`, `lint`.
- ✅ **Dependencies grouped:**
  - **Firebase:** `firebase ^12.13.0`, `firebase-admin ^13.10.0`, `react-firebase-hooks ^5.1.1`
  - **UI primitives:** `radix-ui ^1.4.3`, `lucide-react ^1.16.0`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `sonner ^2.0.7`, `shadcn ^4.8.0` (CLI; harmless as runtime dep)
  - **Forms:** `react-hook-form ^7.76.0`, `@hookform/resolvers ^5.4.0`, `zod ^4.4.3`
  - **Theme / utilities:** `next-themes ^0.4.6`, `server-only ^0.0.1`
  - **Dev:** `tailwindcss ^4`, `@tailwindcss/postcss`, `tsx ^4.22.3`, `firebase-tools ^15.18.0`, `eslint ^9`, `eslint-config-next 16.2.6`, `typescript ^5`, `@types/{node,react,react-dom}`
- ✅ **tsconfig.json strict mode ON** (`"strict": true`). Alias `@/*` → `./src/*`.
- ⚠️ **tailwind.config.* DOES NOT exist as a separate file.** This is correct for **Tailwind v4**, which moved theme config into CSS via `@theme inline { ... }` blocks. Azure palette and `cyan-accent` are declared there in `globals.css` (lines 42–52). If anyone audits expecting `tailwind.config.ts`, point them at `globals.css`.
- ✅ **next.config.ts:** `turbopack: {}` present (silences the conflict warning); `images.remotePatterns` whitelists Firebase Storage; a `webpack()` callback exists as a fallback (irrelevant under Turbopack, doesn't hurt).
- ✅ **src/ layout:** `app/`, `components/`, `hooks/`, `lib/`. (No `types/`.)

## 2. Firebase wiring

- ✅ **`src/lib/firebase/client.ts`** initializes once via `getApps().length ? getApp() : initializeApp(...)`, exports `app, auth, db, storage`. Pulls config from `NEXT_PUBLIC_FIREBASE_*` env vars.
- ✅ **`src/lib/firebase/admin.ts`** has `import "server-only"` at line 1, loads cert from `FIREBASE_ADMIN_KEY_PATH` (defaulting to `./firebase-admin.json`), guards init with `getApps().length`, exports `adminAuth, adminDb, adminStorage`.
- ✅ **`.env.local` keys** (values not printed): `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID`, `FIREBASE_ADMIN_KEY_PATH`.
- ✅ **`.env.example`** mirrors the same 7 keys.
- ✅ **`.gitignore`** ignores `.env*` (with `!.env.example` un-ignore) AND explicitly `firebase-admin.json`. Solid.
- ✅ **`firebase-admin.json`** file present at project root.
- ✅ **CLI deploy config:** `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json` all present.

## 3. Data model

- ✅ **All 9 interfaces present and exported** from `src/lib/firebase/schema.ts`: `User`, `Gig`, `Contract`, `Milestone`, `ContractTransaction`, `Message`, `Review`, `FraudAlert`, `KycSubmission`.
- ✅ **`COLLECTIONS` const** has all 6 expected names: `users, gigs, contracts, reviews, fraudAlerts, kycSubmissions`. (Subcollections — milestones, transactions, messages — live under `contracts/{id}/` as designed and aren't top-level entries; correct.)
- ✅ **Denormalized snapshots present on Gig:** `freelancerName`, `freelancerAvatar`, `freelancerRating`.
- ✅ **Denormalized snapshots present on Contract:** `clientName`, `clientAvatar`, `freelancerName`, `freelancerAvatar`, `gigTitle`.
- ✅ **Denormalized snapshots present on Message:** `senderName`, `senderAvatar`. On Review: `reviewerName`. On FraudAlert/KycSubmission: `userName`.
- ✅ Field shapes match spec (e.g. `pricingBasic/Standard/Premium`, `mockTxHash`, `escrowFunded`; subcollections referenced as comments not nested types — by design).

## 4. Security rules

### `firestore.rules`

- ✅ **users:** read by any signed-in user; create only by self + role ∈ `{freelancer, client}` (admin signup blocked at the rule level); update by self (role/uid immutable) or admin; delete admin-only.
- ✅ **gigs:** published readable by anyone (incl. logged-out); drafts by owner/admin; create requires `freelancerId == auth.uid`; update keeps freelancerId immutable; delete owner-only.
- ✅ **contracts:** read/update by participants or admin; create by client; clientId+freelancerId immutable on update; delete admin-only.
- ✅ **milestones** (subcollection) — same access as parent contract via `parentContract()` helper.
- ✅ **transactions** (subcollection) — read by participants/admin; **client writes denied** (`allow write: if false`) so only server can mint these. Good.
- ✅ **messages** (subcollection) — read/write by participants; `senderId == auth.uid` on create. Update allowed for participants (so the recipient can set `readAt`).
- ✅ **reviews:** public read; create by self (`reviewerId == auth.uid`); update/delete admin-only.
- ✅ **fraudAlerts:** admin-only read AND write.
- ✅ **kycSubmissions:** read by owner+admin; create by owner; update admin-only.
- ⚠️ **`isCreatingParticipant()` helper in contracts is defined but never called.** Dead code in the rules — not a bug, just stale.
- ⚠️ **Cross-document Firestore reads in rules** (`get(/.../users/{uid})` for `isAdmin`, `get(/contracts/{id})` for subcollection participation) are correct and standard, but each one **costs a Firestore read per evaluation**. Worth knowing for billing as traffic grows.

### `storage.rules`

- ✅ **/kyc/{userId}/{file=\*\*}** — owner-only write, owner+admin read, 10MB, image/* or PDF.
- ✅ **/gigs/{gigId}/{file=\*\*}** — gig-owner-only write (via Firestore lookup), public read, 5MB, image/* only.
- ✅ **/avatars/{userId}/{file=\*\*}** — owner-only write, public read, 2MB, image/* only.
- ⚠️ **`isAdmin()` defined in storage.rules but never called.** Dead function. Harmless.

**Every collection from schema.ts has a rule.** No orphans.

## 5. Auth

- ✅ **`src/lib/firebase/auth-helpers.ts`** — `signUp`, `signIn`, `signOut`, `postSessionCookie`, `deleteSessionCookie` all exported. `signUp` **rejects role `admin`** at line 34 (`throw new Error(...)`); also coerces to `'freelancer' | 'client'` in type.
- ✅ **`src/lib/firebase/server-auth.ts`** — has `import "server-only"` at line 1; `getCurrentUser()` reads `session` cookie via `await cookies()`, calls `adminAuth.verifySessionCookie(cookie, true)` (the `true` enables revocation check), fetches user doc via `adminDb`. Exports `SESSION_COOKIE_NAME`, `SESSION_COOKIE_MAX_AGE_SECONDS` (5 days).
- ✅ **`src/app/api/session/route.ts`** — POST (creates session cookie from ID token) and DELETE (clears it) both present; httpOnly + sameSite=lax + secure-in-production cookie attrs.
- ✅ **`src/hooks/use-current-user.ts`** — uses `useAuthState` (react-firebase-hooks) for auth state, then `onSnapshot` on the user doc. Cleans up the snapshot on unmount.
- ❌ **`src/middleware.ts` does NOT exist.** No middleware at all in the project.
  - Day-1 spec did not ask for one, so this is technically not a gap against spec — but worth flagging because `/freelancer` and `/client` routes have **no role enforcement**. Only `/admin/*` has a role check via `src/app/(dashboard)/admin/layout.tsx`. A signed-in client can navigate to `/freelancer/gigs` (they'll see "No gigs yet"); a signed-in freelancer can navigate to `/client/browse` (they'll see the marketplace).
  - Note: Next 16 also renamed `middleware.ts` to **`proxy.ts`**. If you add a guard later, use the new name.
- ❌ **No `src/types/next-auth.d.ts` or equivalent.** No type augmentation file exists. Reasonable, since you're using Firebase Auth directly (not next-auth) — there's nothing to augment. Marked ❌ only because the audit asked.

## 6. Design tokens + theme

- ✅ **`--azure-50` through `--azure-900`** defined in `:root` (lines 97–106). Dark variant doesn't redeclare these because the literal hex values stay the same in both themes — only `--glass-*` and `--bg-base` swap. Acceptable.
- ✅ **`--cyan-accent: #22d3ee`** at line 107.
- ✅ **`--glass-bg`, `--glass-border`, `--glass-shadow`** all defined in both `:root` (lines 110–112) and `.dark` (lines 154–156).
- ✅ **`--bg-base`** in `:root` (`#f8fafc`) and `.dark` (`#020617`).
- ✅ **`body::before` animated blobs** defined (lines 176–187) with two radial-gradient blobs + 36px blur + 0.5 opacity + 20s `cw-blob-drift` animation. `@keyframes cw-blob-drift` defined.

### `src/app/layout.tsx`

- ✅ `ThemeProvider` wraps children, `attribute="class"`, `defaultTheme="light"`, `enableSystem`.
- ✅ `Inter` + `JetBrains_Mono` loaded from `next/font/google`, applied via `--font-sans` and `--font-mono` CSS vars.
- ✅ `<Toaster richColors position="bottom-right" />` rendered inside `ThemeProvider`.
- ✅ `<html suppressHydrationWarning>` set.

### `src/components/ui/` contents

| Component | Status |
|---|---|
| `glass-card.tsx` | ✅ has `default` + `elevated` variants |
| `gradient-text.tsx` | ✅ |
| `azure-button.tsx` | ✅ |
| `theme-toggle.tsx` | ✅ |
| `wallet-pill.tsx` | ✅ |
| `skill-input.tsx` (Day 2) | ✅ |
| `gig-card.tsx` | ✅ in `src/components/` (not `src/components/ui/`), with `marketplace` and `manage` variants |
| `coming-soon.tsx` | ✅ |

Plus all shadcn primitives: avatar, badge, button, card, checkbox, dialog, dropdown-menu, form, input, label, popover, select, separator, skeleton, slider, sonner, switch, table, tabs, textarea.

## 7. Pages

### Public

| Route | Status |
|---|---|
| `/` (landing) | ✅ real — glass nav, gradient hero, 3 tilted stat cards, 4-step "How it works", glass footer |
| `/login` | ✅ real — react-hook-form + zod, GlassCard elevated, calls `signIn` + `postSessionCookie`, routes to `/${user.role}` |
| `/register` | ✅ real — same shape, 2-radio role chooser, rejects admin client- and rule-side |
| `/gig/[id]` | ✅ real — server component, `notFound()` for missing/non-published, two-column with sticky pricing sidebar, Overview/About-seller tabs, similar-gigs row |

### Dashboard

- ✅ `(dashboard)/layout.tsx` — auth check + redirect, sidebar+topbar shell.
- ✅ `(dashboard)/admin/layout.tsx` — extra admin-role check, redirects non-admins to `/`.
- ❌ **No `(dashboard)/freelancer/layout.tsx` and no `(dashboard)/client/layout.tsx`** with role checks — see §5 note.

### Freelancer

| Route | Status |
|---|---|
| `/freelancer` | ✅ real dashboard home — welcome + 4 StatCards |
| `/freelancer/gigs` | ✅ real — tabs (All/Drafts/Published/Unpublished), manage cards, empty state, skeleton |
| `/freelancer/gigs/new` | ✅ real — shared `GigForm` with live preview |
| `/freelancer/gigs/[id]/edit` | ✅ real — pre-populated form + Danger Zone |
| `/freelancer/proposals` | ⚠️ ComingSoon placeholder |
| `/freelancer/contracts` | ⚠️ ComingSoon placeholder |
| `/freelancer/messages` | ⚠️ ComingSoon placeholder |
| `/freelancer/earnings` | ⚠️ ComingSoon placeholder |
| `/freelancer/profile` | ⚠️ ComingSoon placeholder |

### Client

| Route | Status |
|---|---|
| `/client` | ✅ real dashboard home — 4 StatCards |
| `/client/browse` | ✅ real — sticky filter strip, URL-synced filters, cursor pagination, AI-ranked toggle (visual only) |
| `/client/contracts` | ⚠️ ComingSoon placeholder |
| `/client/messages` | ⚠️ ComingSoon placeholder |
| `/client/reviews` | ⚠️ ComingSoon placeholder |
| `/client/profile` | ⚠️ ComingSoon placeholder |

### Admin

| Route | Status |
|---|---|
| `/admin` | ✅ real dashboard home |
| `/admin/kyc` | ⚠️ ComingSoon placeholder |
| `/admin/fraud` | ⚠️ ComingSoon placeholder |
| `/admin/disputes` | ⚠️ ComingSoon placeholder |
| `/admin/users` | ⚠️ ComingSoon placeholder |
| `/admin/reports` | ⚠️ ComingSoon placeholder |
| `/admin/settings` | ⚠️ ComingSoon placeholder |

The ⚠️ here is "exists but intentionally a placeholder", per the Day 1 spec — not actual broken code.

## 8. Gig functions

### `src/lib/firebase/gigs.ts`

- ✅ `createGig(freelancerUser: User, input: GigInput): Promise<string>` (line 81)
- ✅ `updateGig(gigId, currentUserId, updates: Partial<GigInput> & { thumbnailUrl?: ... })` (line 119) — whitelists editable fields, never touches denormalized freelancer snapshot
- ✅ `publishGig(gigId, currentUserId)` (line 157), `unpublishGig` (line 164)
- ✅ `deleteGig` (line 171) — ownership check + Storage cleanup
- ✅ `getGigById` (line 189)
- ✅ `getFreelancerGigs(freelancerId)` (line 195)
- ✅ `searchGigs(filters)` (line 214) — supports `query`, `category`, `skills`, `minBudget`, `maxBudget`, `sort`, `limit`, `cursor`. Documented Firestore limitations + client-side fallback in a comment block.

### `src/lib/firebase/storage-helpers.ts`

- ✅ `uploadGigThumbnail(gigId, file)` (line 19) — validates image/* + 5MB
- ✅ `deleteFileFromUrl(url)` (line 43) — accepts both `gs://` and `https://firebasestorage.googleapis.com/.../o/PATH?...` URLs

### `src/lib/firebase/admin-gigs.ts`

- ✅ `getPublishedGigs(maxResults = 100)` (line 12)
- ✅ `getGigByIdAdmin(gigId)` (line 29)
- ✅ `getSimilarGigsAdmin(category, excludeGigId, maxResults)` (line 39) — added Day 2 for "similar gigs" rail

`src/lib/firebase/admin-users.ts` — bonus helper added Day 2: `getUserByIdAdmin(uid)`.

### `src/lib/schemas/gig-schema.ts`

- ✅ `CATEGORIES` const exported (11 entries)
- ✅ `gigSchema` exported with both pricing-tier refinements: Standard ≥ Basic, Premium ≥ Standard
- ✅ `GigInput` type exported via `z.infer`

## 9. Static red-flag scan

- ✅ **No `any` or `as any` anywhere in `src/`.** Grepped `:\s*any\b`, `:\s*any\[\]`, `<any>`, `as any` — zero matches.
- ✅ **All firebase-admin imports live in server-only contexts.** 6 files reference `firebase-admin` or `@/lib/firebase/admin`: 4 are explicitly marked `import "server-only"` (`admin.ts`, `server-auth.ts`, `admin-gigs.ts`, `admin-users.ts`); the other 2 are intrinsically server-side (`src/app/api/session/route.ts` route handler, `src/app/gig/[id]/page.tsx` server component). No client component pulls admin code.
- ✅ **All hook-using files have `"use client"`.** Scanned every file that calls `useState`, `useEffect`, `useRouter`, `useForm`, `useSearchParams`, `useTheme`, `useParams`, `useCurrentUser`, or has inline `onClick=`: every result has the directive.
- ⚠️ **`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is used inside `admin.ts`** at line 28 (passed to `initializeApp` as `storageBucket`). This is NOT a security leak — `NEXT_PUBLIC_*` values are public by definition (they're in the JS bundle), so using one server-side is fine. The bucket name is the same for both SDKs. Worth flagging because the audit specifically asked.
- ⚠️ **Two dead helper functions in rules files** — `isCreatingParticipant()` in `firestore.rules` (line 65) and `isAdmin()` in `storage.rules` (line 10). Neither is called. Cosmetic cleanup, not a bug.
- ✅ **No imports of modules outside `package.json`** in the files sampled.

**No red flags found in static scan** beyond the documented oddities above.

---

## Summary

| Symbol | Count |
|---|---|
| ✅ PRESENT AND CORRECT | **62** |
| ⚠️ PRESENT BUT QUESTIONABLE | **22** (most are intentional placeholders) |
| ❌ MISSING | **3** (middleware, freelancer/client role guards, types augmentation file) |
| 🤷 CAN'T VERIFY | **2** (see open questions) |

### Top 3 things to address before Day 3

1. **No role enforcement on `/freelancer/*` and `/client/*` routes.** Currently any signed-in user can wander into either dashboard. Fix is a tiny `(dashboard)/freelancer/layout.tsx` and `(dashboard)/client/layout.tsx` that mirror the admin layout's role-check + redirect. **20-minute job; do before Day 3** since you're about to add contract creation flows that will rely on role context. (Server-side rule enforcement is in place — this is a UX/defense-in-depth gap, not a security hole.)
2. **`/freelancer/proposals` and `/freelancer/contracts` are still ComingSoon placeholders**, but Day 3's whole point is to make contracts real. Make sure the Day 3 plan **overwrites** these two files (and `/client/contracts`) rather than creating new ones — easy to forget.
3. **Two dead helpers in security rules** (`isCreatingParticipant` in firestore.rules, `isAdmin` in storage.rules). If rules will be deployed for the first time before Day 3, clean these up so the deploy doesn't carry stale code. Genuinely minor but the cheapest win on the list.

## Open questions for the user

These can't be verified from files alone:

1. **🤷 Are the Firestore + Storage rules actually deployed?** The rules files exist and are correct, but `npx firebase deploy --only firestore:rules,storage` is a manual step. Until that runs, the project is using whatever rules Firebase shipped at project creation (typically: deny-all or test-mode time-bombed open). Run it and confirm the output shows both rule sets uploaded.
2. **🤷 Is Email/Password sign-in enabled in the Firebase console?** Day 1's seed script failed with `auth/configuration-not-found` because the provider was off. If it hasn't been enabled since, signup/signin won't work either. Verify at https://console.firebase.google.com/project/freelancechain-5f872/authentication/providers → "Email/Password" → toggled on.
3. **🤷 Did the seed actually run?** Tied to #2. If `npm run seed` hasn't completed, there's no admin user (`admin@chainwork.test`), no test freelancers (Ayesha/Ali), no test clients. Day 3's contract flows will need these to demo. Run it after #2 and confirm five `✓ Created/Updated …` lines.
4. **🤷 No composite indexes deployed (`firestore.indexes.json` is empty).** `searchGigs` combines `status` + `category` + `array-contains-any` + `orderBy` — Firestore will throw at runtime requiring a composite index the first time someone applies skill + category filters together. The error will include a one-click link to create the index. Either run a real query in dev to surface those links, or pre-write the index in `firestore.indexes.json` before deploy.

---

*End of audit.*

