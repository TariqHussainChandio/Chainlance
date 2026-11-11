import "server-only";

import { randomBytes, randomInt } from "node:crypto";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Contract,
  type ContractTransactionType,
  type Milestone,
  type User,
} from "@/lib/firebase/schema";

export interface EscrowResult {
  success: boolean;
  txHash: string;
  blockNumber: number;
  gasUsed: number;
  timestamp: number;
}

const AMOUNT_EPSILON = 0.01;

function generateMockTxHash(): string {
  return "0x" + randomBytes(32).toString("hex");
}

function generateMockBlockNumber(): number {
  return randomInt(5_500_000, 6_500_000);
}

function generateMockGas(): number {
  return randomInt(21_000, 150_001);
}

function mockResult(txHash: string = generateMockTxHash()): EscrowResult {
  return {
    success: true,
    txHash,
    blockNumber: generateMockBlockNumber(),
    gasUsed: generateMockGas(),
    timestamp: Date.now(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateConfirmationLatency(): Promise<void> {
  await sleep(randomInt(1500, 3001));
}

function contractRef(contractId: string) {
  return adminDb.collection(COLLECTIONS.contracts).doc(contractId);
}

function milestonesCol(contractId: string) {
  return contractRef(contractId).collection("milestones");
}

function transactionsCol(contractId: string) {
  return contractRef(contractId).collection("transactions");
}

async function readContract(contractId: string): Promise<Contract> {
  const snap = await contractRef(contractId).get();
  if (!snap.exists) throw new Error(`Contract ${contractId} not found`);
  return snap.data() as Contract;
}

async function isAdmin(uid: string): Promise<boolean> {
  const snap = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
  if (!snap.exists) return false;
  return (snap.data() as User).role === "admin";
}

interface TransactionInput {
  type: ContractTransactionType;
  amount: number;
  mockHash: string;
  milestoneId?: string | null;
}

function buildTxDoc(input: TransactionInput) {
  return {
    milestoneId: input.milestoneId ?? null,
    amount: input.amount,
    type: input.type,
    mockHash: input.mockHash,
    createdAt: FieldValue.serverTimestamp(),
  };
}

/**
 * MOCK IMPLEMENTATION — production replaces this with ethers.js call to
 * `Escrow.deploy(clientAddress, freelancerAddress, totalAmount)`.
 *
 * Records that the escrow contract has been deployed on-chain (no funds
 * locked yet) and pins the transaction hash to the contract document.
 */
export async function deployEscrow(
  contractId: string,
  expectedAmount: number
): Promise<EscrowResult> {
  const contract = await readContract(contractId);
  if (contract.status !== "draft") {
    throw new Error("Escrow can only be deployed on draft contracts.");
  }
  if (Math.abs(contract.totalAmount - expectedAmount) > AMOUNT_EPSILON) {
    throw new Error(
      `Expected amount ${expectedAmount} does not match contract total ${contract.totalAmount}.`
    );
  }

  const result = mockResult();

  await adminDb.runTransaction(async (tx) => {
    const txRef = transactionsCol(contractId).doc();
    tx.set(
      txRef,
      buildTxDoc({
        type: "escrow_fund",
        amount: expectedAmount,
        mockHash: result.txHash,
        milestoneId: null,
      })
    );
    tx.update(contractRef(contractId), {
      mockTxHash: result.txHash,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await simulateConfirmationLatency();
  return result;
}

/**
 * MOCK IMPLEMENTATION — production replaces this with ethers.js call to
 * `Escrow.fund({ value: totalAmount })` from the client's connected wallet.
 *
 * Transitions a draft contract to active and marks escrow as funded.
 */
export async function fundEscrow(
  contractId: string,
  clientUid: string
): Promise<EscrowResult> {
  const contract = await readContract(contractId);
  if (contract.status !== "draft") {
    throw new Error("Escrow can only be funded on draft contracts.");
  }
  if (contract.clientId !== clientUid) {
    throw new Error("Only the contract's client can fund the escrow.");
  }

  const result = mockResult();

  await adminDb.runTransaction(async (tx) => {
    const txRef = transactionsCol(contractId).doc();
    tx.set(
      txRef,
      buildTxDoc({
        type: "escrow_fund",
        amount: contract.totalAmount,
        mockHash: result.txHash,
        milestoneId: null,
      })
    );
    tx.update(contractRef(contractId), {
      status: "active",
      escrowFunded: true,
      mockTxHash: result.txHash,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await simulateConfirmationLatency();
  return result;
}

interface ReleaseOptions {
  skipClientCheck?: boolean;
  allowAdminForce?: boolean;
}

/**
 * MOCK IMPLEMENTATION — production replaces this with ethers.js call to
 * `Escrow.releaseMilestone(milestoneId)` from the client's wallet.
 *
 * Pays out a milestone and, if all milestones are now complete, marks the
 * parent contract as completed.
 */
export async function releaseMilestonePayment(
  contractId: string,
  milestoneId: string,
  callerUid: string,
  options: ReleaseOptions = {}
): Promise<EscrowResult> {
  const result = mockResult();

  await adminDb.runTransaction(async (tx) => {
    const cRef = contractRef(contractId);
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists) throw new Error(`Contract ${contractId} not found.`);
    const contract = cSnap.data() as Contract;

    if (!options.skipClientCheck && contract.clientId !== callerUid) {
      throw new Error("Only the contract's client can release a milestone.");
    }

    const mRef = milestonesCol(contractId).doc(milestoneId);
    const mSnap = await tx.get(mRef);
    if (!mSnap.exists) {
      throw new Error(`Milestone ${milestoneId} not found.`);
    }
    const milestone = mSnap.data() as Milestone;

    if (milestone.status === "completed") {
      throw new Error(`Milestone ${milestoneId} has already been completed and paid.`);
    }

    if (!options.allowAdminForce && milestone.status !== "delivered" && milestone.status !== "disputed") {
      throw new Error(
        `Milestone must be 'delivered' (or 'disputed' for admin overrides) to release. Current: ${milestone.status}.`
      );
    }

    // Mark this milestone completed.
    tx.update(mRef, {
      status: "completed",
      adminCleared: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Compute whether all other milestones are completed too.
    const allMilestonesSnap = await milestonesCol(contractId).get();
    const remaining = allMilestonesSnap.docs.filter(
      (d) => d.id !== milestoneId
    );
    const allCompleted = remaining.every(
      (d) => (d.data() as Milestone).status === "completed"
    );

    tx.set(
      transactionsCol(contractId).doc(),
      buildTxDoc({
        type: "milestone_release",
        amount: milestone.amount,
        mockHash: result.txHash,
        milestoneId,
      })
    );

    tx.update(cRef, {
      status: allCompleted ? "completed" : "active",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await simulateConfirmationLatency();
  return result;
}

/**
 * MOCK IMPLEMENTATION — production replaces this with ethers.js call to
 * `Escrow.lockFunds(milestoneId)` from either participant.
 *
 * Marks a milestone (and its parent contract) as disputed. No funds move;
 * therefore no transaction is recorded.
 */
export async function lockFunds(
  contractId: string,
  milestoneId: string,
  callerUid: string
): Promise<{ success: true }> {
  await adminDb.runTransaction(async (tx) => {
    const cRef = contractRef(contractId);
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists) throw new Error(`Contract ${contractId} not found.`);
    const contract = cSnap.data() as Contract;

    if (
      contract.clientId !== callerUid &&
      contract.freelancerId !== callerUid
    ) {
      throw new Error("Only contract participants can dispute a milestone.");
    }

    const mRef = milestonesCol(contractId).doc(milestoneId);
    const mSnap = await tx.get(mRef);
    if (!mSnap.exists) {
      throw new Error(`Milestone ${milestoneId} not found.`);
    }

    tx.update(mRef, {
      status: "disputed",
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(cRef, {
      status: "disputed",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await simulateConfirmationLatency();
  return { success: true };
}

/**
 * MOCK IMPLEMENTATION — production replaces this with ethers.js call to
 * `Escrow.refund()` triggered by an admin multisig.
 *
 * Refunds the client the remaining balance (total minus what's already
 * been released for completed milestones) and cancels the contract.
 */
export async function refundEscrow(
  contractId: string,
  adminUid: string
): Promise<EscrowResult> {
  if (!(await isAdmin(adminUid))) {
    throw new Error("Only admins can issue refunds.");
  }

  const result = mockResult();
  let refundAmount = 0;

  await adminDb.runTransaction(async (tx) => {
    const cRef = contractRef(contractId);
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists) throw new Error(`Contract ${contractId} not found.`);
    const contract = cSnap.data() as Contract;

    const milestonesSnap = await milestonesCol(contractId).get();
    const completedSum = milestonesSnap.docs
      .map((d) => d.data() as Milestone)
      .filter((m) => m.status === "completed")
      .reduce((acc, m) => acc + m.amount, 0);

    refundAmount = Math.max(contract.totalAmount - completedSum, 0);

    tx.set(
      transactionsCol(contractId).doc(),
      buildTxDoc({
        type: "refund",
        amount: refundAmount,
        mockHash: result.txHash,
        milestoneId: null,
      })
    );
    tx.update(cRef, {
      status: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await simulateConfirmationLatency();
  void refundAmount; // refundAmount is in the tx doc; mirrored for clarity.
  return result;
}

/**
 * MOCK IMPLEMENTATION — production replaces this with ethers.js call to
 * `Escrow.resolveDispute(decision)` from an admin multisig.
 *
 * Routes a disputed milestone to either release (paying the freelancer) or
 * refund (cancelling the contract).
 */
export async function resolveDispute(
  contractId: string,
  milestoneId: string,
  decision: "release" | "refund",
  adminUid: string
): Promise<EscrowResult> {
  if (!(await isAdmin(adminUid))) {
    throw new Error("Only admins can resolve disputes.");
  }

  if (decision === "release") {
    return releaseMilestonePayment(contractId, milestoneId, adminUid, {
      skipClientCheck: true,
    });
  }
  return refundEscrow(contractId, adminUid);
}

// Re-export for callers who want to seed milestone deadlines as Timestamp.
export { Timestamp as AdminTimestamp };
