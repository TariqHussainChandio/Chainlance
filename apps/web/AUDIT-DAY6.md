# ChainWork Day 6 Audit

> Read-only investigation. No project files modified.
> Date: 2026-05-26

## [SECTION 1: DISPUTES]

- ✅ `src/lib/firebase/disputes.ts` exists with `listDisputes(filter)`, `subscribeDisputes(filter, cb)` using `onSnapshot`, and `getDisputeContext(contractId)` returning `{ contract, milestones, systemMessages, recentMessages }`.
- ✅ `listDisputes("active")` queries `contracts where status === "disputed"` with `orderBy("updatedAt","desc")`.
- ⚠️ `getDisputeContext` fetches the contract via `where("id","==",contractId) + limit(1)` instead of `getDoc(doc(...contracts/{id}))`. Works because the doc stores its own `id` field, but it's an extra index requirement and one round-trip slower than a direct lookup.
- ✅ `src/app/actions/disputes.ts` has `"use server"`, admin check via `getCurrentUser`, calls `resolveDispute` from `@/lib/escrow/escrow-service` for both decisions, validates resolution length ≥ 8 chars, and adds a system message with the resolution text.
- ✅ `/admin/disputes/page.tsx` replaces the `ComingSoon` placeholder. It's `"use client"`, subscribes via `subscribeDisputes`, has OVERDUE / DUE SOON badges keyed off `updatedAt` (5d / 3d cutoffs), and renders an empty state with "Excellent."
- ⚠️ The spec said "Sheet (right slide-over)". Implementation uses Dialog (centered modal) — same substitute used in `/admin/fraud`. Functional, not visual parity.
- ✅ Both "Release to freelancer" (emerald) and "Refund client" (red outline) buttons exist with a resolution `Textarea`.
- ⚠️ SLA badges read from `contract.updatedAt` (which is the latest mutation, e.g. message arrival), not the original dispute open timestamp. If a dispute sees ongoing messages, the SLA clock effectively keeps resetting. Spec said "if dispute opened > N days ago" — we don't currently capture that timestamp.

## [SECTION 2: USERS MANAGEMENT]

- ✅ `/admin/users/page.tsx` replaces the placeholder.
- ✅ Client component subscribing to `users` collection via `onSnapshot` (ordered by `createdAt desc`, capped at 500).
- ✅ Search input debounced 300ms; role filter (All/Freelancer/Client/Admin/Banned); KYC filter (All/Pending/Submitted/Approved/Rejected); sort options (Newest/Oldest/Highest fraud/Highest rating).
- ✅ Table columns: User (avatar + name + email) / Role / KYC / Fraud score / Joined / Actions.
- ✅ Fraud score chip uses `BUCKET_COLOR` from `@/lib/ai/fraud` — green/yellow/orange/red bands.
- ✅ Per-row "Run fraud check" calls `runFraudCheckForUser`; "View profile" opens a Dialog slide-over with stats + restrict/unrestrict.
- ✅ `UserRole` extended in `schema.ts:14` to include `"banned"`.
- ❌ `src/app/(dashboard)/_components/sidebar.tsx:80` declares `navByRole: Record<SerializedUser["role"], NavLink[]>` but only has entries for `freelancer/client/admin`. Adding `"banned"` to the union breaks exhaustiveness — this is a TS error today and will fail `tsc --noEmit`.
- ⚠️ Sidebar topbar at line 204–208 has a 3-arm ternary (`admin` / `client` / else `Freelancer`). A banned user will be labelled "Freelancer" in the topbar. Cosmetic.
- ⚠️ Pagination is client-side only: `filtered.slice(page * 50, (page+1) * 50)`. No Firestore `startAfter` cursor. Works because the live subscription is hard-capped at 500 users. Past 500 we'd silently truncate. Spec said "simple, 50 users per page" which matches the intent.

## [SECTION 3: REPORTS]

- ✅ `src/app/actions/reports.ts` has `"use server"`, admin gate, `generatePlatformReport({range})`.
- ✅ Reads users, gigs, contracts, transactions (via per-contract subcollection lookup). Does NOT read `kycSubmissions` or `fraudAlerts` collections directly — `kycPending` is derived from `user.kycStatus`, `highRiskUsers` from `user.fraudScore`, `activeDisputes` from contract status. Not a defect but worth noting.
- ✅ Computed fields present: `totalUsers`, `usersByRole`, `newUsersInRange`, `totalGigs`, `newGigsInRange`, `totalContracts`, `contractsByStatus`, `contractsInRange`, `totalVolume`, `volumeInRange`, `avgContractValue`, `topFreelancers` (top 5), `topCategories` (top 5), `activeDisputes`, `kycPending`, `highRiskUsers`. All spec fields present.
- ✅ `/admin/reports/page.tsx` replaces placeholder, has range selector (7d/30d/90d/All), 4 hero stat cards, top freelancers + top categories lists, 3 quick-action cards linking to `/admin/kyc`, `/admin/disputes`, `/admin/fraud`. Export CSV button → toast stub.
- ⚠️ Charts are HTML/CSS bar divs, not SVG. Spec explicitly said "inline SVG (no chart library)". No chart library is imported (correct), but the medium is `<div style="width: X%">` rather than `<svg>`. Visual outcome equivalent; literal letter of spec missed.
- ✅ No charting libraries imported (no `recharts`, `chart.js`, `d3`).

## [SECTION 4: SETTINGS]

- ✅ Three `GlassCard`s: Platform configuration / Admin actions / About.
- ✅ "Rescan all users for fraud" → `runFraudCheckOnAllUsers` with spinner + toast.
- ✅ "Clear all dismissed fraud alerts" → `clearDismissedFraudAlerts` (in `src/app/actions/admin-maintenance.ts`) with a Dialog confirmation before deletion.
- ✅ All configuration values are display-only (`<dd>` strings, no inputs). Auto-flag threshold shown as 65, demo mode pill, escrow backend = "Mock (Firestore-backed)", AI engine = "Rule-based + TF-IDF", platform fee = "$0".
- ✅ About card lists the 4 known limitations from the spec (mocked escrow, rule-based fraud, TF-IDF AI, Firestore messaging).

## [SECTION 5: ADMIN DASHBOARD STATS]

- ✅ `/admin/page.tsx` is now `"use client"` with `useEffect` calling `getAdminDashboardStats()`.
- ✅ 4 primary tiles with `GradientText` values: Pending KYC, Open fraud alerts, Active disputes, Total users.
- ✅ Each tile wrapped in `<Link>` to `/admin/kyc`, `/admin/fraud`, `/admin/disputes`, `/admin/users` respectively.
- ✅ 4 secondary tiles: Total volume processed, New users this week, Gigs published this week, Contracts created this week.
- ⚠️ `pendingKyc` only counts `kycSubmissions where status === "pending"`, missing `"submitted"`. Spec said "pending OR submitted". `/admin/reports` uses the user-doc derivation and counts both, so the two surfaces disagree. The `getAdminDashboardStats` action queries the `kycSubmissions` collection while reports counts `user.kycStatus`.

## [SECTION 6: FIRESTORE INDEXES]

Index file additions confirmed:

- ✅ `contracts: status ASC + updatedAt DESC` (added — needed for the disputes subscription)
- ✅ `contracts: status ASC + createdAt DESC` (added — spec)
- ✅ `users: role ASC + createdAt DESC` (added — spec)
- ✅ `users: fraudScore DESC` (added — single-field but declared)
- ✅ `contracts: clientId ASC + createdAt DESC` already present (pre-Day-6)
- ⚠️ No composite index declared for `messages` subcollection `senderId ASC + createdAt DESC` even though `getDisputeContext` issues that exact query at COLLECTION scope. Existing `messages` index/fieldOverride is COLLECTION_GROUP scoped on `senderId` only. Firestore will likely refuse this query at runtime and the dispute slide-over "Dispute reason" section will surface an error link to create the index.
- 🤷 Deployment status unknown. No evidence in this session that `npx firebase deploy --only firestore:indexes` was run. Until deployed, the dispute list, users role filter, and high-fraud-score sort will fail with index-required errors in prod.

## [SECTION 7: INTEGRATION POINTS — DID DAY 6 BREAK DAY 5?]

- ✅ `src/components/contract/contract-detail.tsx:21,572` still calls `disputeMilestone(contractId, milestoneId, reason)` — unchanged, still writes the system message that `getDisputeContext` reads.
- ✅ `/admin/fraud` route was not touched on Day 6; the new home page tile links to it correctly.
- ⚠️ `getCurrentUser` still returns `SerializedUser` whose `role` is now `UserRole = "freelancer" | "client" | "admin" | "banned"`. Most consumers do `if (user.role !== "freelancer") throw …` style checks — those keep working because they whitelist the expected role. But the sidebar `navByRole` lookup (Section 2 ❌) returns `undefined` for a banned user, and downstream `.map` crashes.
- ⚠️ A banned user that still has a valid session can navigate to `/freelancer` → role-mismatch redirect → `redirect(`/${user.role}`)` = `/banned` → 404. No `/banned` landing or middleware lockout exists.

## [SECTION 8: STATIC TYPE / IMPORT AUDIT]

- ✅ No `TODO` / `FIXME` markers in any Day 6 file (`disputes.ts`, `admin-users.ts`, `reports.ts`, `admin-dashboard.ts`, `admin-maintenance.ts`, or the four pages).
- ✅ Zero `: any` or `<any>` in newly created Day 6 files.
- ✅ All server-action files import `firebase-admin/firestore` and have `"use server"` at the top. None require `import "server-only"` because the `"use server"` directive already enforces server-only at the module boundary; the existing pattern in this repo (kyc.ts, fraud.ts, contracts.ts, profile.ts, reviews.ts) is consistent — none of them import `"server-only"` either.
- ✅ All new pages (`/admin/disputes`, `/admin/users`, `/admin/reports`, `/admin/settings`, `/admin`) start with `"use client"` and use React hooks.
- ⚠️ `src/app/(dashboard)/admin/users/page.tsx:540` exports a legacy `SortHeader` helper that's no longer used anywhere on the page (the new layout uses `Select` instead). Dead code.
- ⚠️ `src/app/actions/admin-dashboard.ts:79` `void _c;` voids a `Contract` cast that's then unused — small lint smell.
- ⚠️ `src/app/api/recommendations/route.ts:123-124` has the pre-existing `_Unused = Gig` trick — not Day 6, but it stayed.

---

## [SUMMARY]

- Total ✅ count: 34
- Total ⚠️ count: 12
- Total ❌ count: 1
- Total 🤷 count: 1

## [TOP 5 ISSUES TO FIX BEFORE DAY 7]

1. **`sidebar.tsx:80` TypeScript error** — `Record<SerializedUser["role"], NavLink[]>` is missing the `"banned"` key. Either add a `banned` entry (probably mapping to an empty array + a "you've been restricted" topbar message) or relax the type to `Partial<Record<…>>` and handle `undefined`. This will fail the next `tsc --noEmit` run.
2. **`messages` subcollection index for `senderId == 'system'` + `orderBy(createdAt desc)`** is missing from `firestore.indexes.json`. The dispute slide-over will throw an index-required error at runtime once the dispute system message exists.
3. **Banned-user UX gap** — no `/banned` landing page or middleware redirect. A flipped user just hits 404 loops via dashboard layouts that `redirect("/${role}")`.
4. **`pendingKyc` counter mismatch** between `/admin` home (counts `kycSubmissions.status == "pending"`) and `/admin/reports` (counts users with `kycStatus in {pending,submitted}`). Pick one, and most likely add `"submitted"` to the admin-dashboard query so the two surfaces agree.
5. **SLA badges anchor on `contract.updatedAt`**, which mutates every message arrival. The 5-day SLA clock will silently reset on chatty disputes. Either snapshot a `disputeOpenedAt` field when `disputeMilestone` fires (in `contracts.ts:288`), or scan transactions/messages for the dispute trigger event and use that timestamp.

## [OPEN QUESTIONS FOR THE USER]

- 🤷 Did you run `npx firebase deploy --only firestore:indexes`? The Day 6 disputes subscription (`status in [...] + orderBy(updatedAt desc)`) and the users-page sort by `fraudScore` will fail in production until the new indexes are live. Indexes take 1–5 minutes to build; queries error during the build window.
- 🤷 Was `npx tsc --noEmit` run after the `UserRole` extension? The `sidebar.tsx:80` error means it almost certainly was NOT clean — the prior Day 6 turn ended before the type-check step ran.
- Should the Reports charts be re-done as real inline SVG (per literal spec), or is the HTML/CSS bar implementation acceptable? Visual outcome is the same.
- For "Pending KYC", should the dashboard tile count user-doc `kycStatus` or `kycSubmissions` collection rows? They diverge in this codebase because seeded users get `kycStatus: "approved"` without a corresponding `kycSubmissions` doc.
