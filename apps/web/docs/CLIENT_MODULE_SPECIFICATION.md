# Comprehensive Client Module Specification & React Native Conversion Guide

> **Document Version:** 1.0  
> **Target Audience:** Developers & AI Agents  
> **Source Workspace:** `d:\Chain-work-main\Chain-work-main` (Next.js Web App) & `d:\Chain-work-main\chainwork-mobile` (React Native Mobile App)

---

## 1. Directory & File Inventory

### Web Application (`Chain-work-main/src`)

```
src/
├── app/(dashboard)/client/
│   ├── page.tsx                          # Client Dashboard Overview (Hero banner, Stats, Quick Actions, Active Contracts & Proposals)
│   ├── layout.tsx                        # Dashboard Layout Wrapper
│   ├── browse/
│   │   └── page.tsx                      # Marketplace & AI Talent Search (Category Carousel, Budget Slider, Skill Filters, AI Match Toggle)
│   ├── contracts/
│   │   ├── page.tsx                      # Contracts List View (Delegates to ContractsList component)
│   │   ├── new/page.tsx                  # Contract Creation Wizard Page (Select gig tier, define milestones, fund escrow)
│   │   └── [id]/page.tsx                 # Contract Detail View (Milestone releases, deliverable reviews, chat feed, dispute trigger)
│   ├── messages/
│   │   └── page.tsx                      # Client Messages Inbox (Delegates to MessagesInbox component)
│   ├── payments/
│   │   ├── page.tsx                      # Client Payments Overview (Total Spent, 20% Fees, Deposits, Transaction History)
│   │   └── deposit/page.tsx              # Stripe Card Deposit Form (Secure escrow funding via Stripe process API)
│   ├── profile/
│   │   └── page.tsx                      # Client Profile Page (Delegates to ProfileShell component)
│   ├── proposals/
│   │   └── page.tsx                      # Received Proposals Manager (Filter tabs, Search, Proposal Cards, Detail Modal, Hire & Decline actions)
│   └── reviews/
│       └── page.tsx                      # Client Reviews & Ratings Page (Delegates to ReviewsList component)
├── components/
│   ├── gig-card.tsx                      # Marketplace Gig Card component (Shows price, rating, AI match score & explanation)
│   ├── contract/
│   │   ├── contracts-list.tsx            # Contracts Table with Status filtering & Milestone progress counter
│   │   ├── contract-detail.tsx           # Contract Detail View with Milestone release & approval actions
│   │   ├── contract-wizard.tsx           # Step-by-step Contract Creation & Escrow Funding Wizard
│   │   ├── contract-messages.tsx         # Contract-specific real-time chat stream
│   │   ├── contract-review-panel.tsx     # Review & rating submission panel for freelancers
│   │   └── order-countdown-timer.tsx     # Live delivery deadline timer
│   ├── messages/
│   │   └── messages-inbox.tsx            # Real-time chat inbox with freelancer conversation feeds
│   ├── notifications/
│   │   ├── notification-bell.tsx         # Popover bell with real-time listener, unread badge, audio cue, route redirects
│   │   └── notification-center.tsx       # Dedicated Notifications Center view
│   └── payment/
│       ├── fee-display.tsx               # Platform fee (20%) breakdown display
│       ├── stripe-card-form.tsx          # Stripe Card processing input form
│       └── transaction-list.tsx          # Transaction history table with filtering
```

### React Native Mobile App (`chainwork-mobile/src`)

```
src/
├── screens/client/
│   ├── ClientHomeScreen.tsx              # Mobile Client Dashboard Overview Screen
│   ├── ClientBrowseScreen.tsx            # Mobile Marketplace & Talent Search Screen
│   ├── ClientContractsScreen.tsx         # Mobile Contracts List & Management Screen
│   ├── ClientProposalsScreen.tsx         # Mobile Proposals Review & Hiring Screen
│   ├── ClientPaymentsScreen.tsx          # Mobile Escrow Payments & Deposit Screen
│   ├── ClientProfileScreen.tsx           # Mobile Client Profile Screen
│   └── ClientReviewsScreen.tsx           # Mobile Reviews & Ratings Screen
└── components/modals/
    └── SubmitProposalModal.tsx           # Mobile Modal (for proposal inspection/hiring flow)
```

---

## 2. Comprehensive Feature Breakdown

### A. Client Dashboard Overview (`/client`)
* **Hero Welcome Banner:**
  * Greeting header displaying user avatar, name initials, and `"Verified Client Portal"` badge (`Sparkles`).
  * Direct action buttons: `"Browse & Hire Talent"` (`/client/browse`) and `"Add Escrow Funds"` (`/client/payments/deposit`).
* **Stripe Payment Account Status Banner:**
  * Displays payment verification badge (`Verified & Ready` or `Setup Recommended`).
  * Informs client that escrow funding operates securely via 256-bit Stripe encryption.
* **Performance Metrics Grid (4 Stat Tiles):**
  1. `Active Contracts`: Count of ongoing contracts (`active` or `delivered`).
  2. `Total Spent`: Total sum of completed milestone payments.
  3. `Hired Freelancers`: Count of unique freelancer IDs hired.
  4. `Open Proposals`: Count of pending applicant pitches awaiting review.
* **Quick Work Shortcuts Grid:**
  * Quick navigation to `Hire Talent`, `Contracts`, `Proposals`, `Messages`, `Payments`, and `Account Settings`.
* **Recent Activity Split View:**
  * **Active Contracts Card:** Displays up to 4 recent contracts with freelancer avatar, title, total amount, status badge, and direct detail link.
  * **Pending Proposals Card:** Displays up to 3 recent proposal applications with freelancer avatar, delivery days, bid amount, and `Review` action.

---

### B. Browse Marketplace & AI Talent Match (`/client/browse`)
* **Category Carousel Navigation Bar:**
  * Quick filter pills: `All Services`, `Web Development`, `Mobile Apps`, `UI/UX Design`, `Smart Contracts & Web3`, `AI & Machine Learning`, `Graphics & Design`, `Writing & Translation`.
* **Sticky Filter Bar:**
  * **Search Input:** Real-time search by service keyword (e.g. Next.js, Figma, Smart Contracts).
  * **Category Select Dropdown:** Filter by specific service category.
  * **Budget Range Slider:** Range from $0 to $10,000 with interactive slider and minimum/maximum commitments.
  * **Skills Filter Popover:** Tag checkboxes for popular tech skills (`React`, `TypeScript`, `Next.js`, `Solidity`, `Tailwind`, `AI/ML`, etc.).
  * **Sort Dropdown:** Options for `Newest`, `Price: low to high`, `Price: high to low`, and `Top rated`.
  * **Reset Filters Button:** Clears all active search parameters back to default state.
* **AI Recommendation Engine Toggle (`Wand2` icon):**
  * Toggles call to `/api/recommendations` endpoint.
  * Renders match percentage score (e.g., `95% Match`) and personalized AI explanation badges directly on gig cards.
* **Gig Cards Grid & Pagination:**
  * Renders 24 cards per page with `Load More Services` cursor pagination.

---

### C. Received Proposals & Hiring Flow (`/client/proposals`)
* **Proposals Screen:**
  * **Filter Tabs:** `All Proposals`, `Needs Review` (`pending`), `Accepted & Hired` (`accepted`), `Declined` (`rejected`).
  * **Search Bar:** Keyword search across freelancer name, gig title, and cover letter text.
  * **Proposal Cards Grid:**
    * Displays submission date, status badge, Freelancer Avatar, Name, Rating score (stars), Gig Title, Cover Letter quote snippet, Proposed Price (`GradientText`), `Review` button, and `Hire` button.
* **Proposal Detail & Hiring Dialog:**
  * Full freelancer profile overview (Avatar, Name, Rating).
  * Proposed Bid Amount and Delivery Timeline in days.
  * Full cover letter text.
  * Proposed Milestone Breakdown (Description, Deadline Days, Milestone Amount).
  * `Decline` action (marks status as `rejected`).
  * `Accept & Hire Freelancer` action: Executes `acceptProposalAndCreateContract` which creates a new contract document in Firestore, links the freelancer, locks the terms, and redirects to `/client/contracts/[contractId]`.

---

### D. Contracts & Milestone Escrow Management (`/client/contracts`, `/client/contracts/[id]`, `/client/contracts/new`)
* **New Contract Wizard (`/client/contracts/new?gigId=...&tier=...`):**
  * Loads gig data based on query parameter.
  * Allows client to select tier (`Basic`, `Standard`, `Premium`) or customize milestone breakdown.
  * Prompts client to deposit/allocate funds into smart contract escrow.
* **Contracts List View (`ContractsList` component):**
  * **Tabs:** `All`, `Active`, `Delivered`, `Completed`, `Disputed`, `Cancelled`.
  * **Table Columns:** Freelancer Avatar & Name, Title, Amount, Milestone Progress (`completed / total`), Status Pill, Relative Created Date, Action (`View`).
* **Contract Detail View (`ContractDetail` component):**
  * **Milestone Approval & Escrow Release:** Client can review submitted work notes/URLs, request revisions, or approve milestone to release funds to the freelancer.
  * **Order Countdown Timer:** Live timer tracking remaining delivery time.
  * **Contract Messages Feed:** Integrated chat channel for direct client-freelancer communication.
  * **Rating & Review Panel:** Allows client to rate freelancer (1-5 stars) and write public feedback upon contract completion.

---

### E. Payments, Escrow Deposits & Fees (`/client/payments`, `/client/payments/deposit`)
* **Financial Overview Cards:**
  1. `Total Spent`: Total payments released to freelancers.
  2. `Platform Fees`: 20% system revenue share display.
  3. `Deposits`: Total escrow deposits added to wallet.
* **Deposit Funds Modal & Page (`/client/payments/deposit`):**
  * Amount input field (Minimum $10 USD).
  * `StripeCardForm` component: Collects credit/debit card details.
  * Calls `/api/payment/process` endpoint to authorize payment via Stripe.
  * Displays notice: 20% platform fee is allocated to platform revenue upon deposit/contract funding.
* **Transaction History List:** Filterable by `Payments`, `Fees`, and `Deposits`.

---

## 3. UI Component Specifications & Equivalents

| Web Component (Next.js / Tailwind) | Purpose / UI Description | React Native Equivalent (Expo / RN) |
| :--- | :--- | :--- |
| `GlassCard` | Glassmorphism container with backdrop blur and border glow. | Styled `View` with translucent background color & subtle border, or `BlurView` (`react-native-blur`). |
| `AzureButton` | Primary action button with cyan/emerald gradient and shadow. | `TouchableOpacity` or `Pressable` with `LinearGradient` (`expo-linear-gradient`). |
| `Slider` | Dual-thumb or single-thumb budget range input slider. | `@react-native-community/slider` or `@mrsweaters/react-native-multi-slider`. |
| `Switch` | AI-Ranked toggle switch. | Native React Native `Switch` component. |
| `Popover` | Filter popovers for skills selection and budget range. | React Native `Modal` or `@gorhom/bottom-sheet` filter panel. |
| `Dialog` | Modal dialog for reviewing proposal details and hiring. | React Native `Modal` or `@gorhom/bottom-sheet` component. |
| `GigCard` | Marketplace service card displaying price, rating, and AI match score. | Custom React Native `Card` with `Image`, `Text`, `Badge`, and touch handler. |

---

## 4. Backend Actions, Firebase APIs & Data Schemas

### Firebase Methods Used
* `listClientContracts(clientId: string)`: Fetches contracts where `clientId == uid`.
* `listClientProposals(clientId: string)`: Fetches proposals submitted for client's gigs or directed to client.
* `listMilestones(contractId: string)`: Fetches milestone documents for a contract.
* `acceptProposalAndCreateContract(...)`: Accepts proposal, updates status to `accepted`, creates contract document in Firestore with status `active`.
* `updateProposalStatus(proposalId: string, status: ProposalStatus)`: Updates proposal status to `rejected` or `under_review`.
* `/api/recommendations`: AI recommendation route providing ranked gigs with match scores.
* `/api/payment/process`: Payment processing route handling Stripe charge & deposit.

---

## 5. React Native Implementation Plan for AI Agents

When building or updating the React Native app (`chainwork-mobile`), ensure the following mapping:

1. **Navigation Structure:**
   * Stack Navigator for Client Flow:
     * `ClientHome` (`ClientHomeScreen.tsx`)
     * `ClientBrowse` (`ClientBrowseScreen.tsx`)
     * `ClientContracts` (`ClientContractsScreen.tsx`)
     * `ContractDetail` (`ContractDetailScreen.tsx`)
     * `ClientProposals` (`ClientProposalsScreen.tsx`)
     * `ClientPayments` (`ClientPaymentsScreen.tsx`)
     * `Deposit` (`DepositScreen.tsx` or Modal)
     * `ClientNotifications` (`NotificationsScreen.tsx`)

2. **Search & AI Filter Bar:**
   * Horizontal `ScrollView` for category selection.
   * Filter sheet modal containing budget range slider, skill chip selectors, and AI-Ranked toggle switch.

3. **Proposal Review & Hiring Bottom Sheet:**
   * Use `@gorhom/bottom-sheet` to display cover letter, proposed milestones, and `Accept & Hire Freelancer` button.

4. **Real-time Firestore Hooks:**
   * Re-use Firestore listeners for contracts, proposals, and notifications so client app updates instantly when freelancers submit milestones or pitch proposals.
