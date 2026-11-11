"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type User } from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import {
  individualVerificationSchema,
  organizationVerificationSchema,
  type IndividualVerificationInput,
  type OrganizationVerificationInput,
} from "@/lib/schemas/verification-schema";

export type VerificationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Submit an individual client verification request.
 *
 * Rules enforced here:
 * - Only clients may call this.
 * - If verificationMethod is already set (a previous submission exists),
 *   the user cannot switch to a different method — they are locked in.
 * - Status transitions to "pending" for admin review.
 */
export async function submitIndividualVerification(
  input: IndividualVerificationInput
): Promise<VerificationResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Not signed in." };
  if (me.role !== "client") {
    return { ok: false, error: "Only clients can submit individual verification." };
  }

  const parsed = individualVerificationSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, error: msg };
  }

  const userRef = adminDb.collection(COLLECTIONS.users).doc(me.uid);
  const snap = await userRef.get();
  if (!snap.exists) return { ok: false, error: "Account not found." };

  const existing = snap.data() as User;

  // Exclusive lock: once a method is chosen it cannot be changed.
  if (
    existing.verificationMethod &&
    existing.verificationMethod !== parsed.data.method
  ) {
    return {
      ok: false,
      error: `You already submitted a ${existing.verificationMethod} verification. Only one method is allowed per account.`,
    };
  }

  const value =
    parsed.data.method === "linkedin"
      ? parsed.data.profileUrl
      : parsed.data.phoneNumber;

  await userRef.update({
    accountType: "individual",
    verificationMethod: parsed.data.method,
    verificationValue: value,
    verificationStatus: "pending",
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/client/profile");
  return { ok: true };
}

/**
 * Submit an organization verification request.
 *
 * Organizations can only verify via LinkedIn. A separate "organization"
 * account type is set so the UI can render the correct flow.
 */
export async function submitOrganizationVerification(
  input: OrganizationVerificationInput
): Promise<VerificationResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Not signed in." };
  if (me.role !== "client") {
    return { ok: false, error: "Only clients can submit organization verification." };
  }

  const parsed = organizationVerificationSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, error: msg };
  }

  const userRef = adminDb.collection(COLLECTIONS.users).doc(me.uid);
  const snap = await userRef.get();
  if (!snap.exists) return { ok: false, error: "Account not found." };

  await userRef.update({
    accountType: "organization",
    verificationMethod: "linkedin",
    verificationValue: parsed.data.linkedinUrl,
    verificationStatus: "pending",
    organizationLinkedIn: parsed.data.linkedinUrl,
    organizationName: parsed.data.organizationName,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/client/profile");
  return { ok: true };
}

/**
 * Admin action: approve or reject a client verification.
 */
export async function reviewVerification(
  targetUid: string,
  decision: "verified" | "rejected"
): Promise<VerificationResult> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }

  const userRef = adminDb.collection(COLLECTIONS.users).doc(targetUid);
  const snap = await userRef.get();
  if (!snap.exists) return { ok: false, error: "User not found." };

  await userRef.update({
    verificationStatus: decision,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
