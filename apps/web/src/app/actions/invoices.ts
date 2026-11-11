"use server";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Contract,
  type ContractTransaction,
  type Milestone,
  type User,
} from "@/lib/firebase/schema";
import { toMillis } from "@/lib/firebase/serialize";
import { getCurrentUser } from "@/lib/firebase/server-auth";

const BTC_PRICE_USD = 67500;

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  contractId: string;
  contractTitle: string;
  milestoneId: string;
  milestoneDescription: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  freelancerWallet: string;
  amountUsd: number;
  amountBtc: number;
  sats: number;
  status: "paid" | "ready_for_release" | "held" | "in_progress";
  adminHold: boolean;
  adminHoldReason?: string | null;
  adminCleared: boolean;
  mockTxHash?: string | null;
  issuedAt: number;
  dueDate: number;
  paidAt?: number | null;
  bitcoinPaymentUri: string;
}

export interface FreelancerInvoicesOverview {
  totalInvoicedUsd: number;
  totalInvoicedBtc: number;
  paidUsd: number;
  paidBtc: number;
  pendingEscrowUsd: number;
  pendingEscrowBtc: number;
  heldUsd: number;
  invoices: InvoiceItem[];
}

function generateDeterministicBtcAddress(freelancerId: string, index: number): string {
  // Generates a mock SegWit Bech32 Bitcoin address based on freelancer ID
  const cleanId = freelancerId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 10);
  return `bc1qcw${cleanId}${index}p9x4m7k2`;
}

export async function getFreelancerInvoices(): Promise<FreelancerInvoicesOverview> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "freelancer") throw new Error("Freelancers only.");

  // Fetch freelancer user record for wallet info
  const userDoc = await adminDb.collection(COLLECTIONS.users).doc(me.uid).get();
  const userData = userDoc.exists ? (userDoc.data() as User) : null;
  const defaultWallet = userData?.walletAddress || `bc1qcw${me.uid.slice(0, 8)}escrow`;

  // Fetch contracts where user is freelancer
  const contractsSnap = await adminDb
    .collection(COLLECTIONS.contracts)
    .where("freelancerId", "==", me.uid)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const invoices: InvoiceItem[] = [];
  let totalInvoicedUsd = 0;
  let paidUsd = 0;
  let pendingEscrowUsd = 0;
  let heldUsd = 0;

  let invoiceCounter = 101;

  for (const cDoc of contractsSnap.docs) {
    const c = cDoc.data() as Contract;

    // Fetch milestones for this contract
    const mSnap = await cDoc.ref.collection("milestones").orderBy("order", "asc").get();

    // Fetch transactions to find release hashes
    const txSnap = await cDoc.ref.collection("transactions").get();
    const releaseTxMap = new Map<string, { hash: string; at: number }>();
    for (const tDoc of txSnap.docs) {
      const tx = tDoc.data() as ContractTransaction;
      if (tx.type === "milestone_release" && tx.milestoneId) {
        releaseTxMap.set(tx.milestoneId, {
          hash: tx.mockHash || "0x...",
          at: toMillis(tx.createdAt),
        });
      }
    }

    for (const mDoc of mSnap.docs) {
      const m = mDoc.data() as Milestone;
      const amount = m.amount || 0;
      const btcAmount = parseFloat((amount / BTC_PRICE_USD).toFixed(8));
      const sats = Math.round(btcAmount * 100_000_000);

      totalInvoicedUsd += amount;

      let status: InvoiceItem["status"] = "in_progress";
      const isPaid = m.status === "completed";
      const isDelivered = m.status === "delivered";
      const isHeld = !!m.adminHold;

      if (isPaid) {
        status = "paid";
        paidUsd += amount;
      } else if (isHeld) {
        status = "held";
        heldUsd += amount;
      } else if (isDelivered) {
        status = "ready_for_release";
        pendingEscrowUsd += amount;
      } else {
        status = "in_progress";
        pendingEscrowUsd += amount;
      }

      const invoiceNum = `CW-INV-2026-${invoiceCounter++}`;
      const btcAddr = generateDeterministicBtcAddress(me.uid, invoices.length + 1);
      const paymentUri = `bitcoin:${btcAddr}?amount=${btcAmount}&label=${encodeURIComponent(
        `ChainWork-${invoiceNum}`
      )}`;

      const releaseTx = releaseTxMap.get(mDoc.id);

      invoices.push({
        id: `${c.id}_${mDoc.id}`,
        invoiceNumber: invoiceNum,
        contractId: c.id,
        contractTitle: c.title,
        milestoneId: mDoc.id,
        milestoneDescription: m.description,
        clientId: c.clientId,
        clientName: c.clientName,
        freelancerId: me.uid,
        freelancerName: me.name,
        freelancerWallet: defaultWallet,
        amountUsd: amount,
        amountBtc: btcAmount,
        sats,
        status,
        adminHold: isHeld,
        adminHoldReason: m.adminHoldReason ?? null,
        adminCleared: !!m.adminCleared,
        mockTxHash: releaseTx?.hash || (isPaid ? c.mockTxHash : null),
        issuedAt: toMillis(c.createdAt),
        dueDate: toMillis(m.deadline),
        paidAt: releaseTx?.at || (isPaid ? toMillis(m.updatedAt) : null),
        bitcoinPaymentUri: paymentUri,
      });
    }
  }

  // Sort invoices by issued date descending
  invoices.sort((a, b) => b.issuedAt - a.issuedAt);

  return {
    totalInvoicedUsd,
    totalInvoicedBtc: parseFloat((totalInvoicedUsd / BTC_PRICE_USD).toFixed(6)),
    paidUsd,
    paidBtc: parseFloat((paidUsd / BTC_PRICE_USD).toFixed(6)),
    pendingEscrowUsd,
    pendingEscrowBtc: parseFloat((pendingEscrowUsd / BTC_PRICE_USD).toFixed(6)),
    heldUsd,
    invoices,
  };
}
