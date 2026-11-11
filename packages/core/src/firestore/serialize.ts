import type {
  Contract,
  ContractTransaction,
  Gig,
  KycSubmission,
  Message,
  Milestone,
  Proposal,
  Review,
  SerializedContract,
  SerializedContractTransaction,
  SerializedGig,
  SerializedKycSubmission,
  SerializedMessage,
  SerializedMilestone,
  SerializedProposal,
  SerializedReview,
  SerializedUser,
  User,
} from "@chainwork/shared";

/**
 * Convert any Firestore-ish timestamp value to milliseconds since epoch.
 * Handles three shapes:
 *  - `Timestamp` instances from either the client (firebase/firestore) or
 *    admin (firebase-admin/firestore) SDK (both expose `toMillis()`).
 *  - The plain `{ _seconds, _nanoseconds }` POJO that the admin SDK exposes
 *    when JSON-serialized.
 *  - A raw number (already serialized) — passes through.
 *
 * Returns 0 when no usable shape is detected. We tolerate this rather than
 * throwing because the only failure mode we've ever seen is a missing field
 * on a freshly written doc that hasn't picked up `serverTimestamp()` yet.
 */
export function toMillis(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value || typeof value !== "object") return 0;

  const candidate = value as {
    toMillis?: () => number;
    seconds?: number;
    nanoseconds?: number;
    _seconds?: number;
    _nanoseconds?: number;
  };

  if (typeof candidate.toMillis === "function") {
    return candidate.toMillis();
  }

  const sec = candidate._seconds ?? candidate.seconds;
  const nsec = candidate._nanoseconds ?? candidate.nanoseconds ?? 0;
  if (typeof sec === "number") {
    return sec * 1000 + Math.floor(nsec / 1_000_000);
  }

  return 0;
}

function toMillisNullable(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return toMillis(value);
}

export function serializeUser(user: User): SerializedUser {
  return {
    ...user,
    createdAt: toMillis(user.createdAt),
    updatedAt: toMillis(user.updatedAt),
  };
}

export function serializeGig(gig: Gig): SerializedGig {
  return {
    ...gig,
    createdAt: toMillis(gig.createdAt),
    updatedAt: toMillis(gig.updatedAt),
  };
}

export function serializeContract(contract: Contract): SerializedContract {
  return {
    ...contract,
    createdAt: toMillis(contract.createdAt),
    updatedAt: toMillis(contract.updatedAt),
    disputeOpenedAt: toMillisNullable(contract.disputeOpenedAt),
  };
}

export function serializeMilestone(m: Milestone): SerializedMilestone {
  return {
    ...m,
    deadline: toMillis(m.deadline),
    createdAt: toMillis(m.createdAt),
    updatedAt: toMillis(m.updatedAt),
    deliveredAt: toMillisNullable(m.deliveredAt),
    reviewWindowExpiresAt: toMillisNullable(m.reviewWindowExpiresAt),
    revisionRequestedAt: toMillisNullable(m.revisionRequestedAt),
    deliveryFileUrl: m.deliveryFileUrl ?? null,
    deliveryFileName: m.deliveryFileName ?? null,
    deliveryFileSize: m.deliveryFileSize ?? null,
    deliveryLink: m.deliveryLink ?? null,
    adminCleared: m.adminCleared ?? null,
    stripePaymentIntentId: m.stripePaymentIntentId ?? null,
    stripePayoutStatus: m.stripePayoutStatus ?? null,
    revisionCount: m.revisionCount ?? 0,
    revisionNote: m.revisionNote ?? null,
  };
}

export function serializeContractTransaction(
  t: ContractTransaction
): SerializedContractTransaction {
  return {
    ...t,
    createdAt: toMillis(t.createdAt),
  };
}

export function serializeMessage(m: Message): SerializedMessage {
  return {
    ...m,
    readAt: toMillisNullable(m.readAt),
    createdAt: toMillis(m.createdAt),
  };
}

export function serializeReview(r: Review): SerializedReview {
  return {
    ...r,
    createdAt: toMillis(r.createdAt),
  };
}

export function serializeKycSubmission(
  k: KycSubmission
): SerializedKycSubmission {
  return {
    ...k,
    reviewedAt: toMillisNullable(k.reviewedAt),
    createdAt: toMillis(k.createdAt),
  };
}

export function serializeProposal(
  p: Proposal
): SerializedProposal {
  return {
    ...p,
    createdAt: toMillis(p.createdAt),
    updatedAt: toMillis(p.updatedAt),
  };
}

// Small re-export so call sites can use the same nullable converter for
// fields like `reviewedAt` later (KycSubmission, Message.readAt, etc.).
export { toMillisNullable };
