"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Contract,
  type Review,
  type User,
} from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import { reviewSchema, type ReviewInput } from "@/lib/schemas/review-schema";

export interface SubmitReviewResult {
  ok: true;
  reviewId: string;
}

export async function submitReview(
  input: ReviewInput
): Promise<SubmitReviewResult> {
  const parsed = reviewSchema.parse(input);

  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");

  const contractRef = adminDb
    .collection(COLLECTIONS.contracts)
    .doc(parsed.contractId);
  const contractSnap = await contractRef.get();
  if (!contractSnap.exists) throw new Error("Contract not found.");
  const contract = contractSnap.data() as Contract;

  if (contract.clientId !== me.uid && contract.freelancerId !== me.uid) {
    throw new Error("Only contract participants can leave a review.");
  }
  if (contract.status !== "completed") {
    throw new Error("Reviews are available only on completed contracts.");
  }
  const otherPartyId =
    me.uid === contract.clientId
      ? contract.freelancerId
      : contract.clientId;
  if (parsed.revieweeId !== otherPartyId) {
    throw new Error("You can only review the other party in this contract.");
  }

  // Reject duplicates: one review per (contract, reviewer→reviewee) pair.
  const existing = await adminDb
    .collection(COLLECTIONS.reviews)
    .where("contractId", "==", parsed.contractId)
    .where("reviewerId", "==", me.uid)
    .where("revieweeId", "==", parsed.revieweeId)
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new Error("You already reviewed this contract.");
  }

  const revieweeRef = adminDb
    .collection(COLLECTIONS.users)
    .doc(parsed.revieweeId);
  const revieweeSnap = await revieweeRef.get();
  if (!revieweeSnap.exists) throw new Error("Reviewee no longer exists.");
  const reviewee = revieweeSnap.data() as User;

  const reviewRef = adminDb.collection(COLLECTIONS.reviews).doc();
  const reviewId = reviewRef.id;
  const now = FieldValue.serverTimestamp();

  await reviewRef.set({
    id: reviewId,
    reviewerId: me.uid,
    reviewerName: me.name,
    reviewerAvatar: me.profileImage ?? null,
    revieweeId: parsed.revieweeId,
    revieweeName: reviewee.name,
    revieweeAvatar: reviewee.profileImage ?? null,
    contractId: parsed.contractId,
    contractTitle: contract.title,
    gigId: contract.gigId,
    rating: parsed.rating,
    comment: parsed.comment.trim(),
    createdAt: now,
  });

  // Recompute reviewee's average rating from all received reviews.
  const allReceived = await adminDb
    .collection(COLLECTIONS.reviews)
    .where("revieweeId", "==", parsed.revieweeId)
    .get();
  const reviews = allReceived.docs.map((d) => d.data() as Review);
  const includesNew = reviews.some((r) => r.id === reviewId);
  const ratingPool = includesNew
    ? reviews.map((r) => r.rating)
    : [...reviews.map((r) => r.rating), parsed.rating];
  const avg =
    ratingPool.reduce((a, b) => a + b, 0) / Math.max(ratingPool.length, 1);
  const roundedRating = Number(avg.toFixed(2));

  await revieweeRef.update({
    rating: roundedRating,
    updatedAt: now,
  });

  // If the reviewee is a freelancer, update freelancerRating on all their gigs
  // and refresh their contract completion rate.
  if (reviewee.role === "freelancer") {
    const contracts = await adminDb
      .collection(COLLECTIONS.contracts)
      .where("freelancerId", "==", parsed.revieweeId)
      .get();
    const list = contracts.docs.map((d) => d.data() as Contract);
    const total = list.length;
    const completed = list.filter((c) => c.status === "completed").length;
    const completionRate = total === 0 ? 0 : completed / total;
    await revieweeRef.update({ completionRate });

    // Synchronize rating to all published gigs of this freelancer
    const gigsSnap = await adminDb
      .collection(COLLECTIONS.gigs)
      .where("freelancerId", "==", parsed.revieweeId)
      .get();
    for (const gigDoc of gigsSnap.docs) {
      await gigDoc.ref.update({
        freelancerRating: roundedRating,
        updatedAt: now,
      });
    }
  }

  revalidatePath(`/client/contracts/${parsed.contractId}`);
  revalidatePath(`/freelancer/contracts/${parsed.contractId}`);
  revalidatePath(`/client/reviews`);
  revalidatePath(`/freelancer/reviews`);
  revalidatePath(`/client/browse`);
  if (contract.gigId) revalidatePath(`/gig/${contract.gigId}`);
  return { ok: true, reviewId };
}
