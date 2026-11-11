"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Contract,
  type ContractTransaction,
  type Milestone,
} from "@/lib/firebase/schema";
import { toMillis } from "@/lib/firebase/serialize";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import { releaseMilestonePayment } from "@/lib/escrow/escrow-service";
import { sendNotificationAdmin } from "@/lib/firebase/admin-notifications";

export interface AdminPaymentTransaction {
  id: string;
  contractId: string;
  contractTitle: string;
  clientName: string;
  freelancerName: string;
  milestoneId: string | null;
  amount: number;
  type: "escrow_fund" | "milestone_release" | "refund";
  mockHash: string;
  createdAt: number;
}

export interface AdminMilestoneEscrowItem {
  id: string;
  description: string;
  amount: number;
  status: string;
  adminCleared: boolean;
  adminHold: boolean;
  adminHoldReason?: string | null;
  adminAuthorizedAt?: number | null;
  adminAuthorizedByName?: string | null;
  adminAuthorizedNote?: string | null;
  deliveredAt?: number | null;
}

export interface AdminContractEscrow {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  freelancerName: string;
  freelancerId: string;
  totalAmount: number;
  escrowFunded: boolean;
  status: string;
  createdAt: number;
  milestones: AdminMilestoneEscrowItem[];
}

export interface AdminPendingWithdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  feeAmount: number;
  status: string;
  paymentMethod?: string;
  createdAt: number;
}

export interface AdminPaymentsOverview {
  totalVolume: number;
  escrowBalance: number;
  releasedAmount: number;
  refundedAmount: number;
  pendingAuthorizationsCount: number;
  heldPaymentsCount: number;
  transactions: AdminPaymentTransaction[];
  activeEscrows: AdminContractEscrow[];
  pendingWithdrawals: AdminPendingWithdrawal[];
}

export async function getAdminPaymentsData(): Promise<AdminPaymentsOverview> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const contractsSnap = await adminDb
    .collection(COLLECTIONS.contracts)
    .orderBy("createdAt", "desc")
    .limit(500)
    .get();

  let totalVolume = 0;
  let escrowBalance = 0;
  let releasedAmount = 0;
  let refundedAmount = 0;
  let pendingAuthorizationsCount = 0;
  let heldPaymentsCount = 0;

  const transactionsList: AdminPaymentTransaction[] = [];
  const activeEscrows: AdminContractEscrow[] = [];

  for (const doc of contractsSnap.docs) {
    const c = doc.data() as Contract;

    // Read milestones for this contract to support admin clearance & escrow review
    const milestonesSnap = await doc.ref.collection("milestones").orderBy("order", "asc").get();
    const milestoneItems: AdminMilestoneEscrowItem[] = milestonesSnap.docs.map((mDoc) => {
      const m = mDoc.data() as Milestone;
      if (m.adminHold) heldPaymentsCount++;
      if (m.status === "delivered" && !m.adminCleared) pendingAuthorizationsCount++;

      return {
        id: mDoc.id,
        description: m.description,
        amount: m.amount || 0,
        status: m.status,
        adminCleared: !!m.adminCleared,
        adminHold: !!m.adminHold,
        adminHoldReason: m.adminHoldReason ?? null,
        adminAuthorizedAt: m.adminAuthorizedAt ? toMillis(m.adminAuthorizedAt) : null,
        adminAuthorizedByName: m.adminAuthorizedByName ?? null,
        adminAuthorizedNote: m.adminAuthorizedNote ?? null,
        deliveredAt: m.deliveredAt ? toMillis(m.deliveredAt) : null,
      };
    });

    // Check escrow balance
    if (c.escrowFunded && (c.status === "active" || c.status === "disputed" || c.status === "delivered")) {
      escrowBalance += c.totalAmount || 0;
      activeEscrows.push({
        id: c.id,
        title: c.title,
        clientName: c.clientName,
        clientId: c.clientId,
        freelancerName: c.freelancerName,
        freelancerId: c.freelancerId,
        totalAmount: c.totalAmount,
        escrowFunded: c.escrowFunded,
        status: c.status,
        createdAt: toMillis(c.createdAt),
        milestones: milestoneItems,
      });
    }

    try {
      const txSnap = await doc.ref.collection("transactions").get();
      for (const tDoc of txSnap.docs) {
        const tx = tDoc.data() as ContractTransaction;
        const amount = tx.amount || 0;
        totalVolume += amount;

        if (tx.type === "milestone_release") {
          releasedAmount += amount;
        } else if (tx.type === "refund") {
          refundedAmount += amount;
        }

        transactionsList.push({
          id: tDoc.id,
          contractId: c.id,
          contractTitle: c.title,
          clientName: c.clientName,
          freelancerName: c.freelancerName,
          milestoneId: tx.milestoneId ?? null,
          amount,
          type: tx.type,
          mockHash: tx.mockHash || "0x...",
          createdAt: toMillis(tx.createdAt),
        });
      }
    } catch (err) {
      console.warn(`[admin-payments] Failed reading transactions for contract ${c.id}:`, err);
    }
  }

  // Read pending platform withdrawals
  const pendingWithdrawals: AdminPendingWithdrawal[] = [];
  try {
    const wdSnap = await adminDb
      .collection(COLLECTIONS.transactions)
      .where("type", "==", "withdrawal")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    for (const doc of wdSnap.docs) {
      const d = doc.data();
      pendingWithdrawals.push({
        id: doc.id,
        userId: d.userId,
        userName: d.userName || "User",
        amount: Math.abs(d.amount || 0),
        feeAmount: d.feeAmount || 0,
        status: d.status,
        paymentMethod: (d.metadata as { paymentMethod?: string })?.paymentMethod || "Crypto / Bank",
        createdAt: toMillis(d.createdAt),
      });
    }
  } catch (err) {
    console.warn("[admin-payments] Error reading pending withdrawals:", err);
  }

  // Sort transactions by createdAt descending
  transactionsList.sort((a, b) => b.createdAt - a.createdAt);

  return {
    totalVolume,
    escrowBalance,
    releasedAmount,
    refundedAmount,
    pendingAuthorizationsCount,
    heldPaymentsCount,
    transactions: transactionsList,
    activeEscrows,
    pendingWithdrawals,
  };
}

/**
 * Admin action to explicitly clear and release a milestone payout to freelancer.
 */
export async function adminClearMilestonePayout(
  contractId: string,
  milestoneId: string
): Promise<{ success: boolean }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const cRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId);
  const mRef = cRef.collection("milestones").doc(milestoneId);

  const mSnap = await mRef.get();
  if (!mSnap.exists) throw new Error("Milestone not found.");

  await mRef.update({
    adminCleared: true,
    stripePayoutStatus: "cleared",
    status: "approved",
  });

  return { success: true };
}

/**
 * Primary Admin Authority Action:
 * Tells the system that this payment should GO FORWARD and releases the funds.
 */
export async function adminAuthorizePayment(
  contractId: string,
  milestoneId: string,
  note?: string
): Promise<{ success: boolean; txHash: string }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const cRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId);
  const cSnap = await cRef.get();
  if (!cSnap.exists) throw new Error("Contract not found.");
  const contract = cSnap.data() as Contract;

  const mRef = cRef.collection("milestones").doc(milestoneId);
  const mSnap = await mRef.get();
  if (!mSnap.exists) throw new Error("Milestone not found.");
  const milestone = mSnap.data() as Milestone;

  if (milestone.status === "completed") {
    throw new Error("This milestone has already been completed and paid out.");
  }

  // Force release payment via escrow service with admin override
  const result = await releaseMilestonePayment(contractId, milestoneId, me.uid, {
    skipClientCheck: true,
    allowAdminForce: true,
  });

  // Record admin authority metadata
  await mRef.update({
    adminCleared: true,
    adminHold: false,
    adminHoldReason: null,
    adminAuthorizedAt: FieldValue.serverTimestamp(),
    adminAuthorizedByName: me.name,
    adminAuthorizedNote: note?.trim() || "Authorized by platform admin",
    stripePayoutStatus: "cleared",
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/payments");
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);

  // Notify freelancer
  void sendNotificationAdmin({
    userId: contract.freelancerId,
    title: "Payment Authorized by Admin! ⚡",
    message: `Admin ${me.name} authorized your $${milestone.amount} payout for milestone "${milestone.description}". Payment is sent forward!`,
    type: "milestone",
    link: `/freelancer/contracts/${contractId}`,
  });

  // Notify client
  void sendNotificationAdmin({
    userId: contract.clientId,
    title: "Admin Payment Authorization ⚡",
    message: `Admin ${me.name} reviewed and authorized payment for milestone "${milestone.description}" ($${milestone.amount}) to go forward.`,
    type: "contract",
    link: `/client/contracts/${contractId}`,
  });

  return { success: true, txHash: result.txHash };
}

/**
 * Admin Authority: Place a payment on hold (pause it from moving forward).
 */
export async function adminHoldPayment(
  contractId: string,
  milestoneId: string,
  reason: string
): Promise<{ success: boolean }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  if (!reason || reason.trim().length < 4) {
    throw new Error("Please specify a reason for placing this payment on hold.");
  }

  const cRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId);
  const cSnap = await cRef.get();
  if (!cSnap.exists) throw new Error("Contract not found.");
  const contract = cSnap.data() as Contract;

  const mRef = cRef.collection("milestones").doc(milestoneId);
  const mSnap = await mRef.get();
  if (!mSnap.exists) throw new Error("Milestone not found.");
  const milestone = mSnap.data() as Milestone;

  await mRef.update({
    adminHold: true,
    adminHoldReason: reason.trim(),
    adminHoldAt: FieldValue.serverTimestamp(),
    adminCleared: false,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/payments");
  revalidatePath(`/client/contracts/${contractId}`);
  revalidatePath(`/freelancer/contracts/${contractId}`);

  void sendNotificationAdmin({
    userId: contract.freelancerId,
    title: "Payment Placed on Admin Hold ⏸️",
    message: `Milestone "${milestone.description}" ($${milestone.amount}) payment has been placed on hold: ${reason.trim()}`,
    type: "milestone",
    link: `/freelancer/contracts/${contractId}`,
  });

  return { success: true };
}

/**
 * Admin Authority: Release hold on a payment.
 */
export async function adminReleaseHold(
  contractId: string,
  milestoneId: string
): Promise<{ success: boolean }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const cRef = adminDb.collection(COLLECTIONS.contracts).doc(contractId);
  const mRef = cRef.collection("milestones").doc(milestoneId);

  await mRef.update({
    adminHold: false,
    adminHoldReason: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/payments");
  return { success: true };
}

/**
 * Admin Authority: Approve a pending withdrawal to go forward.
 */
export async function adminApproveWithdrawal(
  transactionId: string
): Promise<{ success: boolean }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const txRef = adminDb.collection(COLLECTIONS.transactions).doc(transactionId);
  const txSnap = await txRef.get();
  if (!txSnap.exists) throw new Error("Withdrawal transaction not found.");

  const tx = txSnap.data();
  if (tx?.type !== "withdrawal") throw new Error("Transaction is not a withdrawal.");
  if (tx?.status === "completed") throw new Error("Withdrawal is already completed.");

  await txRef.update({
    status: "completed",
    adminApprovedBy: me.name,
    adminApprovedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/payments");

  if (tx?.userId) {
    void sendNotificationAdmin({
      userId: tx.userId,
      title: "Withdrawal Approved & Sent 💸",
      message: `Your withdrawal of $${Math.abs(tx.amount || 0)} has been authorized by administration and is on its way.`,
      type: "system",
      link: "/freelancer/payments",
    });
  }

  return { success: true };
}

/**
 * Admin Authority: Reject a withdrawal request.
 */
export async function adminRejectWithdrawal(
  transactionId: string,
  reason: string
): Promise<{ success: boolean }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const txRef = adminDb.collection(COLLECTIONS.transactions).doc(transactionId);
  const txSnap = await txRef.get();
  if (!txSnap.exists) throw new Error("Withdrawal transaction not found.");

  const tx = txSnap.data();
  if (tx?.status !== "pending") throw new Error("Only pending withdrawals can be rejected.");

  await txRef.update({
    status: "cancelled",
    rejectionReason: reason.trim() || "Rejected by admin",
    adminRejectedBy: me.name,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/payments");

  if (tx?.userId) {
    void sendNotificationAdmin({
      userId: tx.userId,
      title: "Withdrawal Request Rejected ⚠️",
      message: `Your withdrawal request of $${Math.abs(tx.amount || 0)} was declined: ${reason.trim() || "Contact support"}`,
      type: "system",
      link: "/freelancer/payments",
    });
  }

  return { success: true };
}
