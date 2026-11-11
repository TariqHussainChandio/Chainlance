import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type Gig, type GigStatus } from "@/lib/firebase/schema";

const PUBLISHED: GigStatus = "published";

/**
 * Returns all published gigs ordered by createdAt descending.
 * For public marketplace SSR fallbacks where no filters are applied.
 */
export async function getPublishedGigs(maxResults = 100): Promise<Gig[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.gigs)
    .where("status", "==", PUBLISHED)
    .orderBy("createdAt", "desc")
    .limit(maxResults)
    .get();

  return snap.docs.map((d) => d.data() as Gig);
}

/**
 * Server-side single-gig fetch. Bypasses client security rules so that
 * /gig/[id] can render even for logged-out visitors when the gig is
 * published. Callers MUST check `status === 'published'` before exposing
 * a draft/unpublished gig publicly.
 */
export async function getGigByIdAdmin(gigId: string): Promise<Gig | null> {
  const snap = await adminDb.collection(COLLECTIONS.gigs).doc(gigId).get();
  if (!snap.exists) return null;
  return snap.data() as Gig;
}

/**
 * Up to `maxResults` other published gigs in the same category, excluding
 * the one currently displayed. Used by /gig/[id] "Similar gigs" section.
 */
export async function getSimilarGigsAdmin(
  category: string,
  excludeGigId: string,
  maxResults = 4
): Promise<Gig[]> {
  // We fetch one extra in case the excluded gig appears in the result set.
  const snap = await adminDb
    .collection(COLLECTIONS.gigs)
    .where("status", "==", PUBLISHED)
    .where("category", "==", category)
    .orderBy("createdAt", "desc")
    .limit(maxResults + 1)
    .get();

  const gigs = snap.docs
    .map((d) => d.data() as Gig)
    .filter((g) => g.id !== excludeGigId)
    .slice(0, maxResults);
  return gigs;
}
