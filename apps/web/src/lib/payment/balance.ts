import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type Contract } from "@/lib/firebase/schema";
import {
  calculateClientFee,
  calculateFreelancerFee,
  calculateNetAmount,
} from "@chainwork/shared";
import { getTransactionHistory } from "@/lib/payment/transaction-log";

/**
 * Money model (demo escrow, see lib/escrow/escrow-service.ts — frozen):
 *
 * - `contracts/{id}/transactions` subcollections are the source of truth for
 *   CONTRACT money: `escrow_fund` (client pays in), `milestone_release`
 *   (freelancer gets paid), `refund` (client gets money back).
 * - The top-level `transactions` collection is the WALLET ledger: `deposit`
 *   and `withdrawal` rows. (Legacy `payment`/`platform_fee` rows written by
 *   the old simulated flows are ignored here to avoid double counting —
 *   contract money is always derived from the escrow subcollections.)
 */

export interface WalletTransaction {
  id: string;
  userId: string;
  userName: string;
  type: "deposit" | "withdrawal" | "payment" | "platform_fee" | "refund";
  amount: number;
  feeAmount?: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface PaymentsStats {
  role: "freelancer" | "client";
  /** Freelancer: gross milestone releases. Client: gross escrow funding. */
  totalGross: number;
  /** Freelancer: net earnings after the freelancer fee. */
  totalEarningsNet: number;
  /** Fees attributable to this user (freelancer fee or client fee). */
  platformFees: number;
  /** Freelancer only: funded-but-unreleased contract value, net of fee. */
  pendingEarningsNet: number;
  /** Sum of |withdrawals| that are pending or completed. */
  withdrawals: number;
  /** Wallet deposits (completed). */
  totalDeposits: number;
  /** Escrow refunds received (client). */
  refunds: number;
  /** Client: escrow funding + client fees − refunds. */
  totalSpent: number;
  /** What the user can withdraw right now. */
  availableBalance: number;
}

export interface UserPaymentsData {
  transactions: WalletTransaction[];
  stats: PaymentsStats;
}

interface ActorLike {
  uid: string;
  name: string;
  role: string;
}

function tsToMillis(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value && typeof (value as { _seconds?: number })._seconds === "number") {
    return (value as { _seconds: number })._seconds * 1000;
  }
  return Date.now();
}

async function collectContractRows(
  actor: ActorLike,
  role: "freelancer" | "client"
): Promise<{
  rows: WalletTransaction[];
  totalGross: number;
  totalEarningsNet: number;
  platformFees: number;
  pendingEarningsNet: number;
  refunds: number;
}> {
  const field = role === "freelancer" ? "freelancerId" : "clientId";
  const contractsSnap = await adminDb
    .collection(COLLECTIONS.contracts)
    .where(field, "==", actor.uid)
    .get();

  const rows: WalletTransaction[] = [];
  let totalGross = 0;
  let totalEarningsNet = 0;
  let platformFees = 0;
  let pendingEarningsNet = 0;
  let refunds = 0;

  for (const doc of contractsSnap.docs) {
    const contract = doc.data() as Contract;
    const contractTitle = contract.title || contract.gigTitle || doc.id;
    const counterpartyName =
      role === "freelancer" ? contract.clientName : contract.freelancerName;

    const txSnap = await doc.ref.collection("transactions").get();
    let releasedGross = 0;

    for (const txDoc of txSnap.docs) {
      const tx = txDoc.data() as {
        type?: string;
        amount?: number;
        mockHash?: string;
        milestoneId?: string | null;
        createdAt?: unknown;
      };
      const amount = tx.amount || 0;
      const createdAt = tsToMillis(tx.createdAt);
      const baseMeta = {
        contractId: doc.id,
        contractTitle,
        counterpartyName,
        milestoneId: tx.milestoneId ?? null,
        mockHash: tx.mockHash ?? null,
      };

      if (role === "freelancer" && tx.type === "milestone_release") {
        const fee = calculateFreelancerFee(amount);
        const net = amount - fee;
        releasedGross += amount;
        totalGross += amount;
        totalEarningsNet += net;
        platformFees += fee;
        rows.push({
          id: `${txDoc.id}-earning`,
          userId: actor.uid,
          userName: actor.name,
          type: "payment",
          amount: net,
          feeAmount: fee,
          status: "completed",
          referenceId: doc.id,
          metadata: { ...baseMeta, grossAmount: amount },
          createdAt,
        });
        rows.push({
          id: `${txDoc.id}-fee`,
          userId: actor.uid,
          userName: actor.name,
          type: "platform_fee",
          amount: -fee,
          status: "completed",
          referenceId: doc.id,
          metadata: { ...baseMeta, grossAmount: amount },
          createdAt,
        });
      }

      if (role === "client" && tx.type === "escrow_fund") {
        const fee = calculateClientFee(amount);
        totalGross += amount;
        platformFees += fee;
        rows.push({
          id: `${txDoc.id}-fund`,
          userId: actor.uid,
          userName: actor.name,
          type: "payment",
          amount: -amount,
          feeAmount: fee,
          status: "completed",
          referenceId: doc.id,
          metadata: baseMeta,
          createdAt,
        });
        rows.push({
          id: `${txDoc.id}-fee`,
          userId: actor.uid,
          userName: actor.name,
          type: "platform_fee",
          amount: -fee,
          status: "completed",
          referenceId: doc.id,
          metadata: baseMeta,
          createdAt,
        });
      }

      if (role === "client" && tx.type === "refund") {
        refunds += amount;
        rows.push({
          id: `${txDoc.id}-refund`,
          userId: actor.uid,
          userName: actor.name,
          type: "refund",
          amount,
          status: "completed",
          referenceId: doc.id,
          metadata: baseMeta,
          createdAt,
        });
      }
    }

    if (
      role === "freelancer" &&
      contract.escrowFunded &&
      (contract.status === "active" || contract.status === "disputed")
    ) {
      const pendingGross = Math.max(contract.totalAmount - releasedGross, 0);
      pendingEarningsNet += calculateNetAmount(pendingGross);
    }
  }

  return { rows, totalGross, totalEarningsNet, platformFees, pendingEarningsNet, refunds };
}

/**
 * Merged, UI-ready payment history + balances for one user.
 * Also the single source of truth the withdrawal API checks balances against.
 */
export async function getUserPaymentsData(actor: ActorLike): Promise<UserPaymentsData> {
  const role: "freelancer" | "client" = actor.role === "client" ? "client" : "freelancer";

  const [contractData, ledger] = await Promise.all([
    collectContractRows(actor, role),
    getTransactionHistory(actor.uid, 200),
  ]);

  const rows = [...contractData.rows];
  let withdrawals = 0;
  let totalDeposits = 0;

  for (const entry of ledger) {
    if (entry.type !== "deposit" && entry.type !== "withdrawal") continue;
    const createdAt = tsToMillis(entry.createdAt);

    if (entry.type === "deposit" && entry.status === "completed") {
      totalDeposits += Math.abs(entry.amount);
    }
    if (
      entry.type === "withdrawal" &&
      (entry.status === "pending" || entry.status === "completed")
    ) {
      // amount is stored as -net; the gross requested amount lives in netAmount.
      withdrawals += Math.abs(entry.netAmount ?? entry.amount);
    }

    rows.push({
      id: entry.id ?? `ledger-${createdAt}`,
      userId: entry.userId,
      userName: entry.userName,
      type: entry.type,
      amount: entry.amount,
      feeAmount: entry.feeAmount,
      status: entry.status,
      referenceId: entry.referenceId,
      metadata: entry.metadata,
      createdAt,
    });
  }

  rows.sort((a, b) => b.createdAt - a.createdAt);

  const availableBalance =
    role === "freelancer"
      ? contractData.totalEarningsNet + totalDeposits - withdrawals
      : totalDeposits + contractData.refunds - withdrawals;

  return {
    transactions: rows,
    stats: {
      role,
      totalGross: contractData.totalGross,
      totalEarningsNet: contractData.totalEarningsNet,
      platformFees: contractData.platformFees,
      pendingEarningsNet: contractData.pendingEarningsNet,
      withdrawals,
      totalDeposits,
      refunds: contractData.refunds,
      totalSpent:
        contractData.totalGross + contractData.platformFees - contractData.refunds,
      availableBalance: Math.max(availableBalance, 0),
    },
  };
}

/** Sum of withdrawals requested in the given window (for daily/monthly limits). */
export async function getWithdrawnInWindow(
  userId: string,
  sinceMs: number
): Promise<number> {
  const ledger = await getTransactionHistory(userId, 200);
  return ledger
    .filter(
      (t) =>
        t.type === "withdrawal" &&
        (t.status === "pending" || t.status === "completed") &&
        tsToMillis(t.createdAt) >= sinceMs
    )
    .reduce((sum, t) => sum + Math.abs(t.netAmount ?? t.amount), 0);
}
