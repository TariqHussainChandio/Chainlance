"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { resolveDispute as escrowResolveDispute, type EscrowResult } from "@/lib/escrow/escrow-service";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";

export interface ResolveDisputeInput {
  contractId: string;
  milestoneId: string;
  decision: "release" | "refund";
  resolution: string;
}

/**
 * Admin-only dispute resolution. Routes through the existing escrow
 * service so the same release/refund mechanics fire as if a participant
 * had triggered them, then logs a system message explaining the call.
 *
 * Returning the EscrowResult lets the UI display the tx hash like the
 * regular flows do.
 */
export async function resolveDispute(
  input: ResolveDisputeInput
): Promise<EscrowResult> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const resolution = input.resolution.trim();
  if (resolution.length < 8) {
    throw new Error(
      "Resolution explanation must be at least 8 characters."
    );
  }

  const result = await escrowResolveDispute(
    input.contractId,
    input.milestoneId,
    input.decision,
    me.uid
  );

  // System message with the admin's explanation so both participants see
  // why the dispute was decided the way it was.
  const messagesCol = adminDb
    .collection(COLLECTIONS.contracts)
    .doc(input.contractId)
    .collection("messages");

  const decisionLabel =
    input.decision === "release"
      ? "released the milestone to the freelancer"
      : "refunded the remaining escrow to the client";

  await messagesCol.add({
    senderId: "system",
    senderName: "System",
    senderAvatar: null,
    content: `Admin ${me.name} ${decisionLabel}. ${resolution}`,
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/disputes");
  revalidatePath(`/client/contracts/${input.contractId}`);
  revalidatePath(`/freelancer/contracts/${input.contractId}`);
  return result;
}
