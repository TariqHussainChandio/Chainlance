"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import {
  fundEscrow,
  lockFunds,
  releaseMilestonePayment,
  type EscrowResult,
} from "@/lib/escrow/escrow-service";
import {
  COLLECTIONS,
  type Contract,
  type Gig,
  type Milestone,
  type User,
} from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import { sendNotificationAdmin } from "@/lib/firebase/admin-notifications";
import { toMillis, toMillisNullable } from "@/lib/firebase/serialize";

const AMOUNT_EPSILON = 0.01;
const MILESTONE_MIN = 1;
const MILESTONE_MAX = 10;

export interface CreateContractInput {
  gigId: string;
  title: string;
  totalAmount: number;
  milestones: Array<{
    description: string;
    amount: number;
    /** ISO date string or millisecond timestamp. Required. */
    deadline: string | number;
  }>;
}

export interface CreateContractResult {
  contractId: string;
}

function asDeadlineTimestamp(value: string | number): Timestamp {
  const ms = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(ms) || ms <= 0) {
    throw new Error("Each milestone needs a valid deadline.");
  }
  return Timestamp.fromMillis(ms);
}

function sumMilestoneAmounts(
  milestones: CreateContractInput["milestones"]
): number {
  return milestones.reduce((acc, m) => acc + Number(m.amount || 0), 0);
}

async function readContractOrThrow(contractId: string): Promise<Contract> {
  const snap = await adminDb
    .collection(COLLECTIONS.contracts)
    .doc(contractId)
    .get();
  if (!snap.exists) {
    throw new Error(`Contract ${contractId} not found.`);
  }
  return snap.data() as Contract;
}

async function readMilestoneOrThrow(
  contractId: string,
  milestoneId: string
): Promise<Milestone> {
  const snap = await adminDb
    .collection(COLLECTIONS.contracts)
    .doc(contractId)
    .collection("milestones")
    .doc(milestoneId)
    .get();
  if (!snap.exists) {
    throw new Error(`Milestone ${milestoneId} not found.`);
  }
  return snap.data() as Milestone;
}

function revalidateContractSurfaces(): void {
  revalidatePath("/client/contracts");
  revalidatePath("/freelancer/contracts");
}

export async function createContract(
  input: CreateContractInput
): Promise<CreateContractResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  if (user.role !== "client") {
    throw new Error("Only clients can create contracts.");
  }

  if (!input.title || input.title.trim().length < 3) {
    throw new Error("Contract title is required.");
  }
  if (!Number.isFinite(input.totalAmount) || input.totalAmount <= 0) {
    throw new Error("Total amount must be a positive number.");
  }
  if (
    input.milestones.length < MILESTONE_MIN ||
    input.milestones.length > MILESTONE_MAX
  ) {
    throw new Error(
      `Contracts must have between ${MILESTONE_MIN} and ${MILESTONE_MAX} milestones.`
    );
  }

  const milestoneSum = sumMilestoneAmounts(input.milestones);
  if (Math.abs(milestoneSum - input.totalAmount) > AMOUNT_EPSILON) {
    throw new Error(
      `Sum of milestone amounts (${milestoneSum}) must equal totalAmount (${input.totalAmount}).`
    );
  }

  const gigSnap = await adminDb
    .collection(COLLECTIONS.gigs)
    .doc(input.gigId)
    .get();
  if (!gigSnap.exists) {
    throw new Error(`Gig ${input.gigId} not found.`);
  }
  const gig = gigSnap.data() as Gig;
  if (gig.status !== "published") {
    throw new Error("Cannot create a contract against an unpublished gig.");
  }

  const freelancerSnap = await adminDb
    .collection(COLLECTIONS.users)
    .doc(gig.freelancerId)
    .get();
  if (!freelancerSnap.exists) {
    throw new Error("Freelancer profile no longer exists.");
  }
  const freelancer = freelancerSnap.data() as User;

  const contractRef = adminDb.collection(COLLECTIONS.contracts).doc();
  const contractId = contractRef.id;
  const now = FieldValue.serverTimestamp();

  const contractDoc = {
    id: contractId,
    clientId: user.uid,
    freelancerId: freelancer.uid,
    clientName: user.name,
    clientAvatar: user.profileImage ?? null,
    freelancerName: freelancer.name,
    freelancerAvatar: freelancer.profileImage ?? null,
    gigId: gig.id,
    gigTitle: gig.title,
    title: input.title.trim(),
    totalAmount: input.totalAmount,
    status: "draft" as const,
    mockTxHash: null,
    escrowFunded: false,
    createdAt: now,
    updatedAt: now,
  };

  const batch = adminDb.batch();
  batch.set(contractRef, contractDoc);

  input.milestones.forEach((m, index) => {
    const mRef = contractRef.collection("milestones").doc();
    batch.set(mRef, {
      id: mRef.id,
      description: m.description,
      amount: Number(m.amount),
      deadline: asDeadlineTimestamp(m.deadline),
      status: "pending" as const,
      deliveryEvidence: null,
      order: index,
      createdAt: now,
      updatedAt: now,
    });
  });

  await batch.commit();
  revalidateContractSurfaces();

  void sendNotificationAdmin({
    userId: freelancer.uid,
    title: "New Contract Offer 📄",
    message: `${user.name} sent you a contract offer for "${input.title}".`,
    type: "contract",
    link: `/freelancer/contracts/${contractId}`,
  });

  return { contractId };
}

export async function fundContractEscrow(
  contractId: string
): Promise<EscrowResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const contract = await readContractOrThrow(contractId);
  if (contract.clientId !== user.uid) {
    throw new Error("Only the contract's client can fund the escrow.");
  }

  const result = await fundEscrow(contractId, user.uid);
  revalidateContractSurfaces();
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);

  void sendNotificationAdmin({
    userId: contract.freelancerId,
    title: "Escrow Funded 💰",
    message: `${user.name} funded $${contract.totalAmount} in escrow for "${contract.title}". Work is active!`,
    type: "contract",
    link: `/freelancer/contracts/${contractId}`,
  });

  return result;
}

export async function markMilestoneDelivered(
  contractId: string,
  milestoneId: string,
  evidence: string,
  deliveryFileUrl?: string | null,
  deliveryFileName?: string | null,
  deliveryFileSize?: number | null,
  deliveryLink?: string | null
): Promise<{ success: true }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const contract = await readContractOrThrow(contractId);
  if (contract.freelancerId !== user.uid) {
    throw new Error("Only the contract's freelancer can mark delivery.");
  }
  if (contract.status !== "active") {
    throw new Error("Contract must be active to mark a milestone delivered.");
  }

  const milestone = await readMilestoneOrThrow(contractId, milestoneId);
  if (milestone.status !== "pending") {
    throw new Error(
      `Milestone must be 'pending' to mark delivered. Current: ${milestone.status}.`
    );
  }
  if (!evidence || evidence.trim().length === 0) {
    throw new Error("Delivery evidence is required.");
  }

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const expiresAtDate = new Date(Date.now() + THREE_DAYS_MS);

  const cRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId);
  const mRef = cRef.collection("milestones").doc(milestoneId);

  await adminDb.runTransaction(async (tx) => {
    tx.update(mRef, {
      status: "delivered",
      deliveryEvidence: evidence.trim(),
      deliveryFileUrl: deliveryFileUrl ?? null,
      deliveryFileName: deliveryFileName ?? null,
      deliveryFileSize: deliveryFileSize ?? null,
      deliveryLink: deliveryLink ?? null,
      deliveredAt: FieldValue.serverTimestamp(),
      reviewWindowExpiresAt: expiresAtDate,
      adminCleared: false,
      stripePayoutStatus: "pending_clearance",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const allMilestonesSnap = await cRef.collection("milestones").get();
    const stillPending = allMilestonesSnap.docs.some(
      (d) =>
        d.id !== milestoneId && (d.data() as Milestone).status === "pending"
    );
    if (!stillPending) {
      tx.update(cRef, {
        status: "delivered",
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      tx.update(cRef, {
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  revalidateContractSurfaces();
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);

  void sendNotificationAdmin({
    userId: contract.clientId,
    title: "Milestone Work Delivered 🚀",
    message: `${user.name} delivered work for milestone "${milestone.description}". 3-day (72h) review window initiated.`,
    type: "milestone",
    link: `/client/contracts/${contractId}`,
  });

  return { success: true };
}

export async function approveMilestone(
  contractId: string,
  milestoneId: string
): Promise<EscrowResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const contract = await readContractOrThrow(contractId);
  const isClient = contract.clientId === user.uid;
  const isAdmin = user.role === "admin";

  if (!isClient && !isAdmin) {
    throw new Error("Only the contract's client or an administrator can approve a milestone payment.");
  }

  const milestone = await readMilestoneOrThrow(contractId, milestoneId);

  // If milestone is placed on admin hold and caller is not an admin, block approval
  if (milestone.adminHold && !isAdmin) {
    throw new Error(
      `This payment is on Admin Hold: "${milestone.adminHoldReason || "Security review in progress"}". An administrator must clear it before funds can proceed.`
    );
  }

  const result = await releaseMilestonePayment(
    contractId,
    milestoneId,
    user.uid,
    { skipClientCheck: isAdmin, allowAdminForce: isAdmin }
  );

  // If approved by admin, update admin clearance fields
  if (isAdmin) {
    const mRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId).collection("milestones").doc(milestoneId);
    await mRef.update({
      adminCleared: true,
      adminHold: false,
      adminHoldReason: null,
      adminAuthorizedAt: FieldValue.serverTimestamp(),
      adminAuthorizedByName: user.name,
      stripePayoutStatus: "cleared",
    });
  }

  revalidateContractSurfaces();
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);
  revalidatePath(`/admin/payments`);

  void sendNotificationAdmin({
    userId: contract.freelancerId,
    title: "Payment Released! 🎉",
    message: `${isAdmin ? "Admin (" + user.name + ")" : user.name} approved milestone "${milestone.description}" and authorized $${milestone.amount} payment to go forward.`,
    type: "milestone",
    link: `/freelancer/contracts/${contractId}`,
  });

  if (isAdmin) {
    void sendNotificationAdmin({
      userId: contract.clientId,
      title: "Admin Payment Authorization ⚡",
      message: `Administrator ${user.name} reviewed and authorized the payment of $${milestone.amount} for milestone "${milestone.description}" to proceed.`,
      type: "contract",
      link: `/client/contracts/${contractId}`,
    });
  }

  return result;
}

/**
 * Admin authority: Put a milestone payment on hold to prevent release.
 */
export async function adminHoldMilestonePayment(
  contractId: string,
  milestoneId: string,
  reason: string
): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  if (user.role !== "admin") throw new Error("Admins only.");

  if (!reason || reason.trim().length < 5) {
    throw new Error("Please provide a reason for the payment hold (at least 5 characters).");
  }

  const contract = await readContractOrThrow(contractId);
  const milestone = await readMilestoneOrThrow(contractId, milestoneId);

  const mRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId).collection("milestones").doc(milestoneId);
  await mRef.update({
    adminHold: true,
    adminHoldReason: reason.trim(),
    adminHoldAt: FieldValue.serverTimestamp(),
    adminCleared: false,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidateContractSurfaces();
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);
  revalidatePath(`/admin/payments`);

  void sendNotificationAdmin({
    userId: contract.freelancerId,
    title: "Payment Placed on Admin Hold ⏸️",
    message: `Milestone "${milestone.description}" has been temporarily held for review: ${reason.trim()}`,
    type: "milestone",
    link: `/freelancer/contracts/${contractId}`,
  });

  void sendNotificationAdmin({
    userId: contract.clientId,
    title: "Payment Placed on Admin Hold ⏸️",
    message: `Milestone "${milestone.description}" payment has been placed on hold: ${reason.trim()}`,
    type: "contract",
    link: `/client/contracts/${contractId}`,
  });

  return { success: true };
}

/**
 * Admin authority: Clear the hold from a milestone payment.
 */
export async function adminReleaseMilestoneHold(
  contractId: string,
  milestoneId: string
): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  if (user.role !== "admin") throw new Error("Admins only.");

  const contract = await readContractOrThrow(contractId);
  const milestone = await readMilestoneOrThrow(contractId, milestoneId);

  const mRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId).collection("milestones").doc(milestoneId);
  await mRef.update({
    adminHold: false,
    adminHoldReason: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidateContractSurfaces();
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);
  revalidatePath(`/admin/payments`);

  void sendNotificationAdmin({
    userId: contract.freelancerId,
    title: "Payment Hold Cleared ✅",
    message: `The admin hold on milestone "${milestone.description}" has been removed.`,
    type: "milestone",
    link: `/freelancer/contracts/${contractId}`,
  });

  return { success: true };
}

export async function disputeMilestone(
  contractId: string,
  milestoneId: string,
  reason: string,
  evidenceUrl?: string | null,
  evidenceName?: string | null
): Promise<{ success: true }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const contract = await readContractOrThrow(contractId);
  if (
    contract.clientId !== user.uid &&
    contract.freelancerId !== user.uid
  ) {
    throw new Error("Only contract participants can raise a dispute.");
  }
  if (!reason || reason.trim().length < 8) {
    throw new Error("Provide at least 8 characters describing the dispute.");
  }

  await lockFunds(contractId, milestoneId, user.uid);

  const contractRef = adminDb
    .collection(COLLECTIONS.contracts)
    .doc(contractId);

  const updateData: Record<string, unknown> = {
    disputeReason: reason.trim(),
    disputedBy: user.uid,
    disputedByName: user.name,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (evidenceUrl) {
    updateData.disputeEvidenceUrl = evidenceUrl;
  }
  if (evidenceName) {
    updateData.disputeEvidenceName = evidenceName;
  }

  const freshSnap = await contractRef.get();
  const fresh = freshSnap.data() as Contract | undefined;
  if (fresh && !fresh.disputeOpenedAt) {
    updateData.disputeOpenedAt = FieldValue.serverTimestamp();
  }

  await contractRef.update(updateData);

  const messagesCol = contractRef.collection("messages");
  const evidenceText = evidenceName ? ` | Attachment evidence: ${evidenceName}` : "";
  await messagesCol.add({
    senderId: "system",
    senderName: "System",
    senderAvatar: null,
    content: `${user.name} raised a dispute. Reason: ${reason.trim()}${evidenceText}`,
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidateContractSurfaces();
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);

  const targetId = user.uid === contract.clientId ? contract.freelancerId : contract.clientId;
  const targetRole = user.uid === contract.clientId ? "freelancer" : "client";
  void sendNotificationAdmin({
    userId: targetId,
    title: "Dispute Opened ⚠️",
    message: `${user.name} opened a dispute on contract "${contract.title}". Reason: ${reason.trim()}`,
    type: "dispute",
    link: `/${targetRole}/contracts/${contractId}`,
  });

  return { success: true };
}

/**
 * Allows client or freelancer to resolve/withdraw an open dispute.
 * Restores contract status back to 'active'.
 */
export async function resolveOrWithdrawDispute(
  contractId: string,
  reasonNote?: string
): Promise<{ success: true }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const contract = await readContractOrThrow(contractId);
  if (
    contract.clientId !== user.uid &&
    contract.freelancerId !== user.uid
  ) {
    throw new Error("Only contract participants can withdraw or resolve a dispute.");
  }

  const cRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId);

  // Restore contract to active
  await cRef.update({
    status: "active",
    disputeOpenedAt: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Restore any disputed milestones back to pending
  const milestonesSnap = await cRef.collection("milestones").get();
  for (const mDoc of milestonesSnap.docs) {
    if (mDoc.data().status === "disputed") {
      await mDoc.ref.update({
        status: "pending",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // System notification message
  await cRef.collection("messages").add({
    senderId: "system",
    senderName: "System",
    senderAvatar: null,
    content: `Dispute resolved & withdrawn by ${user.name}. ${
      reasonNote ? `Note: ${reasonNote.trim()}` : "Work resuming as agreed."
    }`,
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidateContractSurfaces();
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);
  revalidatePath(`/admin/disputes`);
  return { success: true };
}

export async function requestMilestoneRevision(
  contractId: string,
  milestoneId: string,
  feedbackNote: string,
  extensionDays?: number
): Promise<{ success: true }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const contract = await readContractOrThrow(contractId);
  if (contract.clientId !== user.uid) {
    throw new Error("Only the contract client can request work revisions.");
  }
  if (!feedbackNote || feedbackNote.trim().length < 5) {
    throw new Error("Please provide constructive revision instructions (at least 5 chars).");
  }

  const milestone = await readMilestoneOrThrow(contractId, milestoneId);
  const expiresAtMs = toMillisNullable(milestone.reviewWindowExpiresAt);
  if (expiresAtMs && Date.now() >= expiresAtMs) {
    throw new Error("The 3-day review window has expired. This milestone has been auto-cleared and can no longer be sent for revision.");
  }

  const cRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId);
  const mRef = cRef.collection("milestones").doc(milestoneId);

  const mUpdates: Record<string, unknown> = {
    status: "pending",
    deliveryEvidence: null,
    deliveredAt: null,
    reviewWindowExpiresAt: null,
    adminCleared: null,
    stripePayoutStatus: null,
    revisionCount: FieldValue.increment(1),
    revisionNote: feedbackNote.trim(),
    revisionRequestedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const extension = Math.max(0, Number(extensionDays || 0));
  if (extension > 0) {
    const currentMs = toMillis(milestone.deadline) || Date.now();
    const extendedDeadlineMs = Math.max(currentMs, Date.now()) + extension * 24 * 60 * 60 * 1000;
    mUpdates.deadline = Timestamp.fromMillis(extendedDeadlineMs);
  }

  await mRef.update(mUpdates);

  if (contract.status === "delivered" || contract.status === "disputed") {
    await cRef.update({
      status: "active",
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const extensionText = extension > 0 ? ` (Timeline extended by +${extension} days)` : "";
  await cRef.collection("messages").add({
    senderId: "system",
    senderName: "System",
    senderAvatar: null,
    content: `Revision requested by client ${user.name}${extensionText}: "${feedbackNote.trim()}". Milestone status set back to pending for re-delivery.`,
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  void sendNotificationAdmin({
    userId: contract.freelancerId,
    title: "Revision Requested 🔄",
    message: `${user.name} requested a revision on milestone "${milestone.description}"${extensionText}. Notes: ${feedbackNote.trim().slice(0, 60)}...`,
    type: "milestone",
    link: `/freelancer/contracts/${contractId}`,
  });

  revalidateContractSurfaces();
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);
  return { success: true };
}

/**
 * Automatically checks and releases delivered milestones if the 3-day (72-hour)
 * client review window has expired without revision or dispute.
 */
export async function checkAndAutoReleaseDeliveredMilestones(
  contractId: string
): Promise<{ releasedCount: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const cRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId);
  const cSnap = await cRef.get();
  if (!cSnap.exists) throw new Error("Contract not found.");
  const contractData = cSnap.data() as Contract;
  if (
    user.uid !== contractData.clientId &&
    user.uid !== contractData.freelancerId &&
    user.role !== "admin"
  ) {
    throw new Error("Only contract participants can trigger the auto-release check.");
  }

  const mSnap = await cRef.collection("milestones").get();

  let releasedCount = 0;
  for (const docSnap of mSnap.docs) {
    const m = docSnap.data() as Milestone;
    if (m.status === "delivered" && m.reviewWindowExpiresAt) {
      const expiresMs = toMillis(m.reviewWindowExpiresAt);
      if (expiresMs > 0 && Date.now() >= expiresMs) {
        try {
          await releaseMilestonePayment(contractId, docSnap.id, "system_auto_release");
          await docSnap.ref.update({
            adminCleared: true,
            stripePayoutStatus: "cleared",
            updatedAt: FieldValue.serverTimestamp(),
          });
          releasedCount++;
        } catch (err) {
          console.error(`Auto-release failed for milestone ${docSnap.id}:`, err);
        }
      }
    }
  }

  if (releasedCount > 0) {
    revalidateContractSurfaces();
    revalidatePath(`/client/contracts/${contractId}`);
    revalidatePath(`/freelancer/contracts/${contractId}`);
  }

  return { releasedCount };
}
