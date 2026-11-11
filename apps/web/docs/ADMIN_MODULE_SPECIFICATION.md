# Comprehensive Admin Module Specification & React Native Conversion Guide

> **Document Version:** 1.0  
> **Target Audience:** Developers & AI Agents  
> **Source Workspace:** `d:\Chain-work-main\Chain-work-main` (Next.js Web App) & `d:\Chain-work-main\chainwork-mobile` (React Native Mobile App)

---

## 1. Directory & File Inventory

### Web Application (`Chain-work-main/src`)

```
src/
├── app/(dashboard)/admin/
│   ├── page.tsx                          # Admin Overview Dashboard (Role badge, Super Admin actions, Action Queues, Weekly Velocity stats)
│   ├── layout.tsx                        # Admin Layout Wrapper (Role authorization checks)
│   ├── analytics/
│   │   ├── page.tsx                      # Platform Analytics Overview
│   │   ├── revenue/page.tsx              # Revenue & Fee Analytics (20% commission tracking, Escrow volume)
│   │   └── users/page.tsx                # User Acquisition & Retention Analytics
│   ├── disputes/
│   │   └── page.tsx                      # Dispute Resolution Center (SLA monitoring, Evidence inspector, Refund/Release arbitration)
│   ├── fraud/
│   │   └── page.tsx                      # AI Fraud Detection Hub (Risk distribution chart, Automated scanner, Account restriction triggers)
│   ├── kyc/
│   │   └── page.tsx                      # KYC Verification Center (Document inspector, Image/PDF preview, Approve/Reject flows)
│   ├── payments/
│   │   ├── page.tsx                      # Platform Financial Overview (Total Escrow, Revenue, Fee breakdown)
│   │   ├── disputes/page.tsx             # Financial Disputes & Chargebacks log
│   │   └── transactions/page.tsx         # Comprehensive Transaction Audit Log
│   ├── reports/
│   │   └── page.tsx                      # User & Content Incident Reports Manager
│   ├── settings/
│   │   └── page.tsx                      # Platform Settings (Platform fee rate [20%], Maintenance mode, Global params)
│   └── users/
│       └── page.tsx                      # Users & Admins Roster (Live table, Super Admin onboarding dialog, User detail drawer, Ban/Promote controls)
├── app/actions/
│   ├── admin-dashboard.ts                # Server action for fetching dashboard stats & action queue counters
│   ├── admin-roles.ts                    # Server action for creating admins, promoting/demoting admin privileges
│   ├── admin-users.ts                    # Server action for fetching user profile stats & managing ban states
│   ├── disputes.ts                       # Server action for resolving contract disputes (refund/release)
│   ├── fraud.ts                          # Server action for running user fraud checks & updating risk scores
│   ├── kyc.ts                            # Server action for approving or rejecting KYC identity submissions
│   └── reports.ts                        # Server action for resolving incident reports
└── components/admin/
    ├── admin-stats.tsx                   # Priority action queue stat cards
    ├── fee-analytics.tsx                 # Platform fee revenue chart component
    ├── recent-transactions.tsx           # Recent platform transactions audit table
    └── revenue-chart.tsx                 # Interactive platform financial revenue chart
```

### React Native Mobile App (`chainwork-mobile/src`)

```
src/
├── screens/admin/
│   ├── AdminHomeScreen.tsx              # Mobile Admin Overview & Priority Queues Screen
│   ├── AdminUsersScreen.tsx              # Mobile User Roster & Restriction Screen
│   ├── AdminDisputesScreen.tsx           # Mobile Dispute Resolution & Escrow Arbitration Screen
│   ├── AdminFraudScreen.tsx              # Mobile Fraud Alerts & Risk Score Screen
│   └── AdminKycScreen.tsx               # Mobile KYC Document Inspection & Verification Screen
```

---

## 2. Comprehensive Feature Breakdown

### A. Admin Overview Dashboard (`/admin`)
* **Role Permission Banner:**
  * Displays role badge (`Super Admin Control` vs `Support Admin Control`).
  * Super Admin quick action: `"Add New Admin"` button (`createAdminUser`).
* **Priority Action Queues (4 Core Stat Tiles):**
  1. `Pending KYC` (`/admin/kyc`): Unreviewed identity verification submissions.
  2. `Open Fraud Alerts` (`/admin/fraud`): Flagged high-risk user alerts.
  3. `Active Disputes` (`/admin/disputes`): Contract arbitration cases.
  4. `Total Users` (`/admin/users`): Total registered user count.
* **Operations Shortcuts Grid:**
  * Quick links to `KYC Review`, `Fraud Alerts`, `Disputes`, `Users`, `Reports`, and `System Settings`.
* **Weekly Velocity Stats Grid:**
  * Displays total volume processed ($), new users this week (+N), gigs published (+N), and contracts created (+N).

---

### B. User Management & Admin Role Onboarding (`/admin/users`)
* **User Roster Table:**
  * Real-time Firestore user stream with Avatar, Name, Email, Role Chip (`freelancer`, `client`, `admin`, `banned`), KYC Status Chip, Fraud Score Badge, Joined Date, and Actions (`Run check`, `View profile`).
* **Filter Controls & CSV Export:**
  * Search by name/email, filter by role (`All`, `Freelancer`, `Client`, `Admin`, `Banned`), filter by KYC status (`Pending`, `Submitted`, `Approved`, `Rejected`), sort by `Newest`, `Oldest`, `Highest fraud score`, or `Highest rating`.
  * `Export CSV` action button downloading `chainwork-users-TIMESTAMP.csv`.
* **Create New Admin Dialog (Super Admin Exclusive):**
  * Onboards new admin accounts with name, email, password (min 6 chars), and privilege level (`Super Admin` vs `Support Admin`).
* **User Profile Drawer:**
  * Displays user profile, bio, skills, hourly rate, wallet address, Stripe Connect status (`Connected & Verified` vs `Not Setup`), Stripe Account ID, Stripe Email, and Stripe Holder Name.
  * Role management buttons: `Promote to Admin` / `Demote from Admin`.
  * Account restriction toggle: `Restrict User Account` (Ban / Restore).

---

### C. Dispute Resolution & Escrow Arbitration (`/admin/disputes`)
* **Disputes Queue:**
  * **Filter Tabs:** `Active`, `Resolved`, `All`.
  * **SLA Monitoring:** 5-day SLA badge tracking dispute duration (`Overdue` if >= 5 days, `Due soon` if >= 3 days).
  * **Table Columns:** Contract Title, Client Avatar & Name, Freelancer Avatar & Name, Total Amount ($), Status, Opened Relative Date, Action (`Review`).
* **Dispute Review & Resolution Drawer (`DisputeSlideOver`):**
  * **Dispute Context:** Contract title, amount, client & freelancer avatars, milestone list.
  * **Submitted Dispute Details Box:** Displays raised by user name, dispute reason text, and disputed work evidence file attachment (`View Evidence ↗`).
  * **Contract Messages Feed:** Integrated chat log between client and freelancer leading up to dispute.
  * **Arbitration Action Form:**
    * Required resolution explanation input (min 8 characters).
    * `Refund Client` action: Reverses milestone escrow funds back to client.
    * `Release to Freelancer` action: Transfers milestone escrow funds to freelancer.
  * `Export CSV` action button.

---

### D. AI Fraud Detection & Risk Scoring (`/admin/fraud`)
* **Fraud Metrics & Risk Distribution:**
  * Stat cards: Open alerts count, Avg risk score, Flagged this week count, False positive rate.
  * Interactive Risk Distribution Bar Chart: Segregated into `Low Risk`, `Medium-Low`, `Medium-High`, and `High Risk` buckets.
* **Automated Risk Scanner (`"Scan now"`):**
  * Triggers `/api/admin/fraud/scan` endpoint to run automated heuristic pattern detectors across users.
* **Fraud Alerts Queue:**
  * Filter tabs: `All`, `Open`, `Reviewed`, `Confirmed`, `Dismissed`.
  * Table displaying user avatar, name, visual risk score bar (0-100), detected risk pattern, timestamp, and action buttons (`Dismiss`, `Confirm`).
* **Risk Review Drawer:**
  * Circular Risk Score Gauge indicator.
  * Detected patterns list (e.g. rapid bid spamming, suspicious payment IP, repeated contract cancellations).
  * User Activity Timeline log.
  * Actions: `Restrict Account` (sets score to 100 and restricts user) or `Dismiss Alert`.

---

### E. KYC Verification Center (`/admin/kyc`)
* **Queue Tabs:** `Pending`, `Approved`, `Rejected`.
* **Submission Inspector Dialog:**
  * Account summary: User Name, Email, Role, Fraud Score.
  * Document Type label (`Passport`, `Driver's License`, `National ID`).
  * Document Previewer: Embedded image viewer or PDF iframe with direct original document link.
  * Actions: `Approve` button (updates user `kycStatus` to `approved`) vs `Reject` button (requires rejection reason text).
* `Export CSV` action button.

---

### F. Financial Analytics & Platform Settings (`/admin/payments`, `/admin/analytics`, `/admin/settings`)
* **Revenue & Fee Tracking:**
  * Tracks 20% platform revenue share from escrow transactions.
  * Audit log of all completed transactions and platform fees.
* **Global Platform Settings (`/admin/settings`):**
  * Configures global platform parameters, fee rates (default 20%), and maintenance mode toggle.

---

## 3. UI Component Specifications & Equivalents

| Web Component (Next.js / Tailwind) | Purpose / UI Description | React Native Equivalent (Expo / RN) |
| :--- | :--- | :--- |
| `GlassCard` | Glassmorphism card with border glow and backdrop blur. | Styled `View` with translucent background & subtle border or `BlurView` (`react-native-blur`). |
| `Table` / `TableBody` | Data table for users, disputes, fraud alerts, and KYC queues. | `FlatList` with structured row cards optimized for mobile viewports. |
| `Dialog` / Slide-Over | Modal overlay for user profile drawer, dispute arbitration, risk review, and KYC document inspector. | `@gorhom/bottom-sheet` or native React Native `Modal`. |
| `RiskBar` / `ScoreGauge` | Visual risk score bar and circular score gauge. | Custom `View` with progress bar or SVG gauge using `react-native-svg`. |
| `Tabs` | Filter tabs for queues (`Pending`, `Approved`, `Rejected`, etc.). | Horizontal `ScrollView` with pressable filter chips. |

---

## 4. Backend Actions & Permissions Architecture

### Permission Roles (`src/lib/admin-permissions.ts`)
* **`super_admin`**: Complete platform authority, including creating new admin accounts, modifying global settings, and managing all queues.
* **`support_admin`**: Operational authority over disputes, KYC verification, user support, and fraud alerts.

### Server Actions Used
* `getAdminDashboardStats()`: Aggregates system metrics, volume, and priority queue counts.
* `createAdminUser(...)`: Onboards new super or support admin account.
* `setUserBanState(...)`: Restricts or restores user access.
* `promoteUserToAdmin(...)` / `demoteAdmin(...)`: Changes user role privileges.
* `resolveDispute(...)`: Executes escrow arbitration (release or refund).
* `runFraudCheckForUser(...)` / `updateFraudAlertStatus(...)` / `restrictUserAccount(...)`: Fraud detection and risk management actions.
* `reviewKyc(...)`: Approves or rejects identity documents.

---

## 5. React Native Implementation Plan for AI Agents

When building or updating the React Native app (`chainwork-mobile`), ensure the following mapping:

1. **Navigation Structure:**
   * Stack Navigator for Admin Flow:
     * `AdminHome` (`AdminHomeScreen.tsx`)
     * `AdminUsers` (`AdminUsersScreen.tsx`)
     * `AdminDisputes` (`AdminDisputesScreen.tsx`)
     * `AdminFraud` (`AdminFraudScreen.tsx`)
     * `AdminKyc` (`AdminKycScreen.tsx`)

2. **Mobile Queue Filters & Drawers:**
   * Use `@gorhom/bottom-sheet` for reviewing dispute evidence, user profile inspection, and KYC document previewing.

3. **Document Inspection:**
   * Use `react-native-pdf` or Expo `WebBrowser` / `Image` viewer for inspecting KYC identity documents.

4. **Real-time Synchronization:**
   * Use Firestore snapshot listeners on `disputes`, `fraud_alerts`, and `kyc_submissions` to keep the mobile admin interface updated in real time.
