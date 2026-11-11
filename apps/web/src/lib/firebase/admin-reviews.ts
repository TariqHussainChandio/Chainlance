import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Review,
  type SerializedReview,
} from "@/lib/firebase/schema";
import { serializeReview } from "@/lib/firebase/serialize";

/**
 * Server-side fetch of reviews for a freelancer (or any user). Used on the
 * public gig detail page so the reviews list renders during SSR without
 * waiting for a client-side query on mount.
 */
export async function getReviewsForUserAdmin(
  userId: string,
  max = 50
): Promise<SerializedReview[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.reviews)
    .where("revieweeId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(max)
    .get();
  return snap.docs.map((d) => serializeReview(d.data() as Review));
}
