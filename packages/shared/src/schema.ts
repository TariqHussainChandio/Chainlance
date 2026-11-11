// Framework-agnostic Firestore timestamp — structurally compatible with
// both firebase/firestore.Timestamp and firebase-admin/firestore.Timestamp.
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

export const COLLECTIONS = {
  users: "users",
  gigs: "gigs",
  contracts: "contracts",
  reviews: "reviews",
  fraudAlerts: "fraudAlerts",
  kycSubmissions: "kycSubmissions",
  adminAuditLog: "adminAuditLog",
  transactions: "transactions",
  proposals: "proposals",
  notifications: "notifications",
} as const;

export type NotificationType = "contract" | "milestone" | "proposal" | "dispute" | "system" | "message";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  read: boolean;
  createdAt: FirestoreTimestamp;
}

export interface SerializedNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  read: boolean;
  createdAt: number;
}

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export type UserRole = "freelancer" | "client" | "admin" | "banned";
export type AdminRole = "super_admin" | "support_admin";
export type KycStatus = "pending" | "submitted" | "approved" | "rejected";

export type VerificationMethod = "linkedin" | "whatsapp" | "phone";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type AccountType = "individual" | "organization";

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  adminRole?: AdminRole | null;
  walletAddress: string | null;
  kycStatus: KycStatus;
  fraudScore: number;
  profileImage: string | null;
  bio: string | null;
  skills?: string[];
  rating?: number;
  completionRate?: number;
  portfolioUrls?: string[];
  companyName?: string | null;
  preferredBudget?: number | null;
  phoneNumber?: string | null;
  emailVerified?: boolean;
  previousRole?: "freelancer" | "client" | null;
  stripeAccountId?: string | null;
  stripeAccountEmail?: string | null;
  stripeAccountName?: string | null;
  stripeAccountType?: "individual" | "company" | null;
  stripeCountry?: string | null;
  stripeConnected?: boolean;
  paymentMethodConnected?: boolean;
  tags?: string[];
  accountType?: AccountType | null;
  verificationMethod?: VerificationMethod | null;
  verificationValue?: string | null;
  verificationStatus?: VerificationStatus | null;
  organizationLinkedIn?: string | null;
  organizationName?: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type GigStatus = "draft" | "published" | "unpublished";

export interface Gig {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string | null;
  freelancerRating: number;
  title: string;
  description: string;
  category: string;
  pricingBasic: number;
  pricingStandard: number;
  pricingPremium: number;
  deliveryDays: number;
  status: GigStatus;
  skills: string[];
  gigType?: "software" | "hardware" | null;
  thumbnailUrl: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type ContractStatus =
  | "draft"
  | "active"
  | "delivered"
  | "disputed"
  | "completed"
  | "cancelled";

export interface Contract {
  id: string;
  clientId: string;
  freelancerId: string;
  clientName: string;
  clientAvatar: string | null;
  freelancerName: string;
  freelancerAvatar: string | null;
  gigId: string | null;
  gigTitle: string | null;
  title: string;
  totalAmount: number;
  status: ContractStatus;
  mockTxHash: string | null;
  escrowFunded: boolean;
  disputeOpenedAt?: FirestoreTimestamp | null;
  disputeReason?: string | null;
  disputeEvidenceUrl?: string | null;
  disputeEvidenceName?: string | null;
  disputedBy?: string | null;
  disputedByName?: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type MilestoneStatus =
  | "pending"
  | "delivered"
  | "approved"
  | "disputed"
  | "completed";

export interface Milestone {
  id: string;
  description: string;
  amount: number;
  deadline: FirestoreTimestamp;
  status: MilestoneStatus;
  deliveryEvidence: string | null;
  deliveryFileUrl?: string | null;
  deliveryFileName?: string | null;
  deliveryFileSize?: number | null;
  deliveryLink?: string | null;
  deliveredAt?: FirestoreTimestamp | null;
  reviewWindowExpiresAt?: FirestoreTimestamp | null;
  adminCleared?: boolean | null;
  adminHold?: boolean | null;
  adminHoldReason?: string | null;
  adminHoldAt?: FirestoreTimestamp | null;
  adminAuthorizedAt?: FirestoreTimestamp | null;
  adminAuthorizedByName?: string | null;
  adminAuthorizedNote?: string | null;
  stripePaymentIntentId?: string | null;
  stripePayoutStatus?: "pending_clearance" | "cleared" | "refunded" | null;
  revisionCount?: number | null;
  revisionNote?: string | null;
  revisionRequestedAt?: FirestoreTimestamp | null;
  order: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type ContractTransactionType =
  | "escrow_fund"
  | "milestone_release"
  | "refund";

export interface ContractTransaction {
  id: string;
  milestoneId: string | null;
  amount: number;
  type: ContractTransactionType;
  mockHash: string;
  createdAt: FirestoreTimestamp;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  readAt: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  revieweeId: string;
  revieweeName: string;
  revieweeAvatar: string | null;
  contractId: string;
  contractTitle: string;
  gigId: string | null;
  rating: number;
  comment: string;
  createdAt: FirestoreTimestamp;
}

export type FraudAlertStatus = "open" | "reviewed" | "dismissed" | "confirmed";

export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  riskScore: number;
  detectedPattern: string;
  status: FraudAlertStatus;
  createdAt: FirestoreTimestamp;
}

export type KycSubmissionStatus = "pending" | "approved" | "rejected";

export type KycDocumentType =
  | "passport"
  | "national_id"
  | "drivers_license";

export interface KycSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  userFraudScore: number;
  documentUrl: string;
  documentPublicId: string;
  documentType: KycDocumentType;
  status: KycSubmissionStatus;
  reviewedById: string | null;
  reviewedAt: FirestoreTimestamp | null;
  rejectionReason: string | null;
  createdAt: FirestoreTimestamp;
}

export type SerializedUser = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: number;
  updatedAt: number;
};

export type SerializedGig = Omit<Gig, "createdAt" | "updatedAt"> & {
  createdAt: number;
  updatedAt: number;
};

export type SerializedContract = Omit<
  Contract,
  "createdAt" | "updatedAt" | "disputeOpenedAt"
> & {
  createdAt: number;
  updatedAt: number;
  disputeOpenedAt: number | null;
};

export type SerializedMilestone = Omit<
  Milestone,
  "deadline" | "createdAt" | "updatedAt" | "deliveredAt" | "reviewWindowExpiresAt" | "revisionRequestedAt"
> & {
  deadline: number;
  createdAt: number;
  updatedAt: number;
  deliveredAt: number | null;
  reviewWindowExpiresAt: number | null;
  revisionRequestedAt: number | null;
};

export type SerializedContractTransaction = Omit<
  ContractTransaction,
  "createdAt"
> & {
  createdAt: number;
};

export type SerializedMessage = Omit<Message, "readAt" | "createdAt"> & {
  readAt: number | null;
  createdAt: number;
};

export type SerializedReview = Omit<Review, "createdAt"> & {
  createdAt: number;
};

export type ProposalStatus =
  | "pending"
  | "under_review"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface ProposalMilestone {
  description: string;
  amount: number;
  deadlineDays: number;
}

export interface Proposal {
  id: string;
  gigId: string;
  gigTitle: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string | null;
  freelancerRating: number;
  clientId: string;
  clientName: string;
  coverLetter: string;
  bidAmount: number;
  deliveryDays: number;
  milestones: ProposalMilestone[];
  status: ProposalStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type SerializedKycSubmission = Omit<
  KycSubmission,
  "reviewedAt" | "createdAt"
> & {
  reviewedAt: number | null;
  createdAt: number;
};

export type SerializedProposal = Omit<
  Proposal,
  "createdAt" | "updatedAt"
> & {
  createdAt: number;
  updatedAt: number;
};

export type AdminAuditAction = "promote_admin" | "demote_admin";

export interface AdminAuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  action: AdminAuditAction;
  timestamp: FirestoreTimestamp;
}

export type SerializedAdminAuditLogEntry = Omit<
  AdminAuditLogEntry,
  "timestamp"
> & {
  timestamp: number;
};
