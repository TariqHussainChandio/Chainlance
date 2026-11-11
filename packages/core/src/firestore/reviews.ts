import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import {
  COLLECTIONS,
  type Review,
  type SerializedReview,
} from "@chainwork/shared";
import { serializeReview } from "./serialize";

function reviewsCollection() {
  return collection(db, COLLECTIONS.reviews);
}

export async function listReviewsForUser(
  userId: string
): Promise<SerializedReview[]> {
  try {
    const q = query(
      reviewsCollection(),
      where("revieweeId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => serializeReview(d.data() as Review));
  } catch (err) {
    console.warn("Fallback for listReviewsForUser:", err);
    try {
      const q = query(reviewsCollection(), where("revieweeId", "==", userId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => serializeReview(d.data() as Review));
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }
}

export async function listReviewsByReviewer(
  userId: string
): Promise<SerializedReview[]> {
  try {
    const q = query(
      reviewsCollection(),
      where("reviewerId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => serializeReview(d.data() as Review));
  } catch (err) {
    console.warn("Fallback for listReviewsByReviewer:", err);
    try {
      const q = query(reviewsCollection(), where("reviewerId", "==", userId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => serializeReview(d.data() as Review));
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }
}

export async function listReviewsByGig(
  gigId: string
): Promise<SerializedReview[]> {
  try {
    const q = query(
      reviewsCollection(),
      where("gigId", "==", gigId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => serializeReview(d.data() as Review));
  } catch (err) {
    console.warn("Fallback for listReviewsByGig:", err);
    try {
      const q = query(reviewsCollection(), where("gigId", "==", gigId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => serializeReview(d.data() as Review));
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }
}

/**
 * For "have I already reviewed this contract?" checks — keyed by reviewer.
 * Returns the matching review if found, else null.
 */
export async function findMyReviewForContract(
  contractId: string,
  reviewerId: string
): Promise<SerializedReview | null> {
  try {
    const q = query(
      reviewsCollection(),
      where("contractId", "==", contractId),
      where("reviewerId", "==", reviewerId)
    );
    const snap = await getDocs(q);
    const first = snap.docs[0];
    if (!first) return null;
    return serializeReview(first.data() as Review);
  } catch (err) {
    console.warn("Fallback for findMyReviewForContract:", err);
    try {
      const snap = await getDocs(reviewsCollection());
      const matches = snap.docs.filter(
        (d) =>
          d.data().contractId === contractId &&
          d.data().reviewerId === reviewerId
      );
      if (!matches[0]) return null;
      return serializeReview(matches[0].data() as Review);
    } catch {
      return null;
    }
  }
}
