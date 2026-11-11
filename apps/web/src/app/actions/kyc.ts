"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type KycSubmission,
  type User,
} from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import {
  kycReviewSchema,
  kycSubmissionSchema,
  type KycReviewInput,
  type KycSubmissionInput,
} from "@/lib/schemas/kyc-schema";

export interface KycActionResult {
  ok: true;
}

export async function submitKyc(
  input: KycSubmissionInput
): Promise<KycActionResult> {
  const parsed = kycSubmissionSchema.parse(input);

  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.kycStatus === "approved") {
    throw new Error("Your identity is already verified.");
  }

  const userRef = adminDb.collection(COLLECTIONS.users).doc(me.uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error("Account record missing.");
  const userDoc = userSnap.data() as User;

  const submissionRef = adminDb.collection(COLLECTIONS.kycSubmissions).doc();
  const now = FieldValue.serverTimestamp();

  await adminDb.runTransaction(async (tx) => {
    tx.set(submissionRef, {
      id: submissionRef.id,
      userId: me.uid,
      userName: userDoc.name,
      userEmail: userDoc.email,
      userRole: userDoc.role,
      userFraudScore: userDoc.fraudScore ?? 0,
      documentUrl: parsed.documentUrl,
      documentPublicId: parsed.documentPublicId,
      documentType: parsed.documentType,
      status: "pending",
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: now,
    });
    tx.update(userRef, {
      kycStatus: "submitted",
      updatedAt: now,
    });
  });

  revalidatePath("/freelancer/profile");
  revalidatePath("/client/profile");
  revalidatePath("/admin/kyc");
  return { ok: true };
}

export async function reviewKyc(
  input: KycReviewInput
): Promise<KycActionResult> {
  const parsed = kycReviewSchema.parse(input);

  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const submissionRef = adminDb
    .collection(COLLECTIONS.kycSubmissions)
    .doc(parsed.submissionId);
  const submissionSnap = await submissionRef.get();
  if (!submissionSnap.exists) throw new Error("Submission not found.");
  const submission = submissionSnap.data() as KycSubmission;
  if (submission.status !== "pending") {
    throw new Error("This submission was already reviewed.");
  }

  const userRef = adminDb.collection(COLLECTIONS.users).doc(submission.userId);
  const now = FieldValue.serverTimestamp();
  const nextStatus = parsed.decision === "approve" ? "approved" : "rejected";

  await adminDb.runTransaction(async (tx) => {
    tx.update(submissionRef, {
      status: nextStatus,
      reviewedById: me.uid,
      reviewedAt: now,
      rejectionReason:
        parsed.decision === "reject" ? parsed.reason?.trim() ?? null : null,
    });
    tx.update(userRef, {
      kycStatus: nextStatus,
      updatedAt: now,
    });
  });

  revalidatePath("/admin/kyc");
  revalidatePath("/freelancer/profile");
  revalidatePath("/client/profile");
  return { ok: true };
}
