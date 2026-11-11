# Comprehensive Freelancer Module Specification & React Native Conversion Guide

> **Document Version:** 1.0  
> **Target Audience:** Developers & AI Agents  
> **Source Workspace:** `d:\Chain-work-main\Chain-work-main` (Next.js Web App) & `d:\Chain-work-main\chainwork-mobile` (React Native Mobile App)

---

## 1. Directory & File Inventory

### Web Application (`Chain-work-main/src`)

```
src/
├── app/(dashboard)/freelancer/
│   ├── page.tsx                          # Freelancer Dashboard Overview (Hero banner, Stats, Shortcuts, Recent Contracts & Proposals)
│   ├── layout.tsx                        # Dashboard Layout Wrapper
│   ├── contracts/
│   │   ├── page.tsx                      # Contracts List View (Delegates to ContractsList component)
│   │   └── [id]/page.tsx                 # Contract Detail View (Delegates to ContractDetail component)
│   ├── earnings/
│   │   └── page.tsx                      # Quick Earnings Redirect / View
│   ├── gigs/
│   │   ├── page.tsx                      # My Gigs Manager (Tab filters: All, Draft, Published, Unpublished, Pagination)
│   │   ├── new/page.tsx                  # Create Gig Page Wrapper
│   │   ├── [id]/edit/page.tsx            # Edit Gig Page Wrapper
│   │   └── _components/
│   │       └── gig-form.tsx              # Multi-tier Gig Form (Basics, Description, Pricing Basic/Standard/Premium, Thumbnail Upload, Live Preview)
│   ├── invoices/
│   │   └── page.tsx                      # Invoices Page Wrapper
│   ├── messages/
│   │   └── page.tsx                      # Messages Page Wrapper (Delegates to MessagesInbox component)
│   ├── payments/
│   │   ├── page.tsx                      # Payments & Earnings Overview (Stats, Balance, Fee calculations, Withdraw modal)
│   │   └── withdraw/page.tsx             # Stripe Express Payout Page (Cleared balance, 3-day clearance banner, Bank payout, History)
│   ├── profile/
│   │   └── page.tsx                      # Profile Page (Delegates to ProfileShell component)
│   ├── proposals/
│   │   └── page.tsx                      # Proposals Management (Filter tabs, Search, Proposal Cards, Detail Modal, Withdraw action)
│   └── reviews/
│       └── page.tsx                      # Reviews Page (Delegates to ReviewsList component)
├── components/
│   ├── gig-card.tsx                      # Gig Card component with management & marketplace variants
│   ├── contract/
│   │   ├── contracts-list.tsx            # Contracts Table with Status filtering & Milestone progress counter
│   │   ├── contract-detail.tsx           # Full Contract Details, Milestone release requests, Deliveries, Dispute triggers
│   │   ├── contract-wizard.tsx           # Step-by-step contract creation / agreement wizard
│   │   ├── contract-messages.tsx         # Contract-bound chat feed
│   │   ├── contract-review-panel.tsx     # Review and rating submission panel
│   │   └── order-countdown-timer.tsx     # Live delivery deadline timer
│   ├── messages/
│   │   └── messages-inbox.tsx            # Full Chat Inbox with real-time Firestore conversation streams
│   ├── notifications/
│   │   ├── notification-bell.tsx         # Popover bell with real-time listener, unread count badge, audio cue, item deletion
│   │   └── notification-center.tsx       # Dedicated Notifications Center view
│   ├── payment/
│   │   ├── fee-display.tsx               # Platform fee (20%) breakdown display
│   │   ├── stripe-account-setup-modal.tsx# Stripe Connect onboarding modal
│   │   ├── stripe-card-form.tsx          # Card processing form component
│   │   └── transaction-list.tsx          # Transaction history table with filtering
│   ├── profile/
│   │   └── profile-shell.tsx             # Comprehensive profile viewer/editor (Bio, Hourly Rate, Skills, Portfolio)
│   ├── proposal/
│   │   └── submit-proposal-dialog.tsx    # Submit Pitch dialog with cover letter & custom milestone breakdown
│   └── review/
│       └── reviews-list.tsx              # Star ratings breakdown & client review cards
```

### React Native Mobile App (`chainwork-mobile/src`)

```
src/
├── screens/freelancer/
│   ├── FreelancerHomeScreen.tsx          # Mobile Freelancer Dashboard View
│   ├── FreelancerGigsScreen.tsx          # Mobile Gigs List & Management Screen
│   ├── FreelancerContractsScreen.tsx     # Mobile Contracts List Screen
│   ├── FreelancerProposalsScreen.tsx     # Mobile Proposals Screen
│   ├── FreelancerPaymentsScreen.tsx      # Mobile Payments & Withdrawals Screen
│   ├── FreelancerInvoicesScreen.tsx      # Mobile Invoices Screen
│   ├── FreelancerProfileScreen.tsx       # Mobile Profile Screen
│   └── FreelancerReviewsScreen.tsx       # Mobile Reviews Screen
├── screens/shared/
│   └── NotificationsScreen.tsx           # Mobile Real-Time Notifications Screen
└── components/modals/
    ├── EditGigModal.tsx                  # Mobile Edit Gig Modal
    └── SubmitProposalModal.tsx           # Mobile Submit Proposal Modal
```

---

## 2. Comprehensive Feature Breakdown

### A. Freelancer Dashboard (`/freelancer`)
* **Hero Banner:**
  * Welcome greeting displaying verified suite badge (`Sparkles`), user avatar, and initials.
  * Direct action buttons: `"Create New Gig"` (`/freelancer/gigs/new`) and `"Browse Jobs"` (`/client/browse`).
* **Performance Metrics Grid (4 Stat Cards):**
  1. `Total Earnings`: Sum of all completed milestone amounts.
  2. `Active Contracts`: Count of contracts with `active` or `delivered` status.
  3. `Pending Proposals`: Count of proposals with `pending` status.
  4. `Profile Views`: Dynamic Marketplace impression metric based on user rating.
* **Quick Work Shortcuts Grid:**
  * Quick links to `My Gigs`, `Contracts`, `Proposals`, `Messages`, `Earnings`, and `My Profile`.
* **Recent Activity Split View:**
  * **Recent Contracts Card:** Displays up to 3 recent contracts with client avatar, contract title, amount, status pill, and direct detail link.
  * **Recent Proposals Card:** Displays up to 3 recent submitted proposals with gig title, client name, bid amount, and proposal status.

---

### B. My Gigs & Gig Form (`/freelancer/gigs`, `/gigs/new`, `/gigs/[id]/edit`)
* **Gigs Management Screen:**
  * **Filter Tabs:** `All`, `Drafts`, `Published`, `Unpublished` with dynamic badge counters.
  * **Pagination:** Bounded page size (9 gigs per page).
  * **Actions:** Edit gig, delete gig, change status (publish/unpublish/draft), view preview.
* **Gig Form (`GigForm` component):**
  * **Basics Section:** Title (string), Category (Select dropdown: `Web Development`, `Mobile Apps`, `UI/UX Design`, `AI & ML`, `Blockchain & Smart Contracts`, `Writing & Content`, `Digital Marketing`, `Other`), Skills tag input (`SkillInput`).
  * **Description Section:** Textarea with 2000 character limit counter (min 50 characters required).
  * **Pricing & Delivery Section:**
    * Three tiers: `Basic` ($), `Standard` ($), `Premium` ($). Validation rule: `Premium >= Standard >= Basic`.
    * Delivery Days field (1 to 90 days).
  * **Thumbnail Upload Section:** 16:9 aspect ratio image selector (Max 5MB), image replacement & removal controls.
  * **Live Preview Sidebar:** Real-time rendered `GigCard` preview demonstrating marketplace appearance.
  * **Submission Intents:** `Save as draft`, `Publish gig`, or `Save changes`.

---

### C. Contracts & Delivery Management (`/freelancer/contracts`, `/contracts/[id]`)
* **Contracts List View:**
  * **Tabs:** `All`, `Active`, `Delivered`, `Completed`, `Disputed`, `Cancelled`.
  * **Table Columns:** Counterparty Avatar & Name, Gig Title, Total Contract Amount, Milestone Progress Counter (`completed / total`), Status Pill, Created Time (relative format), Action button (`View`).
* **Contract Detail Screen (`ContractDetail` component):**
  * **Order Countdown Timer:** Live countdown tracking delivery deadline.
  * **Milestone Progress Tracker:** List of milestones with description, amount, deadline, and status (`pending`, `in_progress`, `delivered`, `completed`, `disputed`).
  * **Milestone Work Submission:** Form for freelancer to submit deliverable URL, work notes, and file attachments to request milestone completion.
  * **Contract Chat Feed (`ContractMessages`):** Dedicated chat channel attached specifically to contract ID.
  * **Dispute Resolution Trigger:** Button to initiate dispute if client fails to respond or review.

---

### D. Proposals & Pitching (`/freelancer/proposals`)
* **Proposals Screen:**
  * **Filter Tabs:** `All`, `Pending Review`, `Accepted & Hired`, `Declined`, `Withdrawn`.
  * **Search Bar:** Real-time keyword filtering across gig title, client name, and cover letter text.
  * **Proposal Cards Grid:**
    * Displays submission date, status badge with icon (`Clock`, `CheckCircle2`, `XCircle`, `AlertCircle`), Client Avatar & Name, Gig Title, Cover Letter snippet, and Bid Amount (`GradientText`).
  * **Proposal Detail Modal:**
    * Full cover letter view.
    * Proposed milestone breakdown (Description, Amount, Deadline Days).
    * `Withdraw Proposal` action (for `pending` proposals).

---

### E. Earnings, Payments & Stripe Express Payouts (`/freelancer/payments`, `/payments/withdraw`)
* **Financial Overview Cards:**
  1. `Total Earnings`: Gross sum of completed milestone payments.
  2. `Available Balance`: Net balance after deducting platform fees (20%) and processed withdrawals.
  3. `Pending Earnings`: Total locked in pending milestones.
  4. `Platform Fees`: 20% system fee indicator.
* **3-Day Clearance Policy Banner:**
  * Explains that delivered work undergoes a 72-hour review window. If no revisions or disputes are requested by the client within 3 days, funds auto-clear to the available balance.
* **Withdraw Funds Dialog & Page:**
  * Amount input field with minimum ($10) and maximum checks.
  * Instant fee calculation: 1% withdrawal fee, displaying net amount to be received by freelancer.
  * Stripe Connect account settings dialog (Stripe Email, Bank Account / Card last 4 digits).
  * Direct Bank Transfer initiation via Stripe Express Payout.
  * Payout History log table (`PO-STRIPE-XXXX` records with status pills `cleared`, `pending_clearance`, `processing`).

---

### F. Real-Time Notifications (`NotificationBell` component)
* **Real-time Listener:** Subscribes to Firestore `notifications` collection filtered by `userId`.
* **Audio Alerts:** Plays notification chime on receiving new unread items.
* **Unread Badge:** Red/Emerald badge counter with `9+` overflow handler.
* **Type-based Categories & Icons:**
  * `contract` (FileText, Emerald)
  * `milestone` (CheckCircle, Teal)
  * `proposal` (Send, Cyan)
  * `dispute` (AlertTriangle, Amber)
  * `system` (Info, Purple)
  * `message` (MessageSquare, Blue)
* **User Actions:** Mark single read on click (redirects to target link), Mark All as Read button, Delete notification item.

---

## 3. UI Component Specifications & Equivalents

| Web Component (Next.js / Tailwind) | Purpose / UI Description | React Native Equivalent (Expo / RN) |
| :--- | :--- | :--- |
| `GlassCard` | Semi-transparent card container with glassmorphism border and subtle background blur. | `View` wrapped with `react-native-blur` (`BlurView`) or styled view with rgba background & border color. |
| `AzureButton` | Primary action button with cyan/azure gradient glow, rounded pill design, loading spinner. | Touchable `TouchableOpacity` or `Pressable` wrapping `LinearGradient` from `expo-linear-gradient`. |
| `StatusPill` | Compact status badge with distinct background and text colors per status. | Custom `View` with `Text` and dynamic color dictionary. |
| `GradientText` | Text with vibrant gradient fill. | `MaskedView` (`@react-native-masked-view/masked-view`) with `LinearGradient`. |
| `SkillInput` | Tag-style input for adding/removing skills. | Horizontal scrollable `ScrollView` with `TextInput` and `Chip` / `Badge` components with clear icons. |
| `Tabs` / `TabsList` / `TabsTrigger` | Horizontal tab bar for filtering content. | Custom `ScrollView` with horizontal flex, `Pressable` items, and active indicator line. |
| `Avatar` / `AvatarImage` | User avatar with image fallback to initials. | `react-native-fast-image` or standard `Image` with fallback `View` rendering initial letters. |
| `Dialog` / `Popover` | Modal overlay for details, withdrawal, or notifications popover. | React Native `Modal` or `@gorhom/bottom-sheet` for smooth native bottom-sheet overlays. |
| `Table` / `TableBody` | Data table for contracts, payouts, and transactions. | `FlatList` with custom card/row component layout optimized for mobile screen widths. |

---

## 4. Backend Actions, Firebase APIs & Data Schemas

### Data Models (`src/lib/firebase/schema.ts`)
* **`Gig`**: `{ id, freelancerId, freelancerName, freelancerAvatar, freelancerRating, title, description, category, pricingBasic, pricingStandard, pricingPremium, deliveryDays, status: 'draft'|'published'|'unpublished', skills, thumbnailUrl, createdAt, updatedAt }`
* **`Contract`**: `{ id, gigId, clientId, clientName, clientAvatar, freelancerId, freelancerName, freelancerAvatar, title, totalAmount, status: 'draft'|'active'|'delivered'|'completed'|'disputed'|'cancelled', createdAt, updatedAt }`
* **`Milestone`**: `{ id, contractId, description, amount, deadlineDays, status: 'pending'|'in_progress'|'delivered'|'completed'|'disputed', deliverableNote, deliverableUrl, createdAt }`
* **`Proposal`**: `{ id, gigId, gigTitle, clientId, clientName, freelancerId, freelancerName, freelancerAvatar, coverLetter, bidAmount, deliveryDays, status: 'pending'|'under_review'|'accepted'|'rejected'|'withdrawn', milestones: [...], createdAt }`
* **`Notification`**: `{ id, userId, title, message, type, link, read, createdAt }`

---

## 5. React Native Implementation Plan for AI Agents

When building or updating the React Native app (`chainwork-mobile`), ensure the following mapping:

1. **Navigation Structure:**
   * Stack Navigator for Freelancer Flow:
     * `FreelancerHome` (`FreelancerHomeScreen.tsx`)
     * `FreelancerGigs` (`FreelancerGigsScreen.tsx`)
     * `CreateEditGig` (`EditGigModal.tsx` or new screen)
     * `FreelancerContracts` (`FreelancerContractsScreen.tsx`)
     * `ContractDetail` (`ContractDetailScreen.tsx`)
     * `FreelancerProposals` (`FreelancerProposalsScreen.tsx`)
     * `FreelancerPayments` (`FreelancerPaymentsScreen.tsx`)
     * `FreelancerNotifications` (`NotificationsScreen.tsx`)

2. **Native Asset Handling:**
   * Replace file `<input type="file">` with `expo-image-picker` for thumbnail and milestone file selection.
   * Use `expo-av` or `expo-audio` for notification chime playback.

3. **Form Validation:**
   * Maintain `react-hook-form` and `@hookform/resolvers/zod` with `gigSchema`.

4. **Real-time Synchronization:**
   * Re-use Firebase JS SDK listeners (`onSnapshot`) in custom React hooks (`useFreelancerContracts`, `useFreelancerProposals`, `useNotifications`) to keep UI instantly synchronized across mobile and web.
