import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromCache,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Query,
  type QueryConstraint,
} from "firebase/firestore";

import { db } from "@chainwork/firebase-client";
import {
  COLLECTIONS,
  type Gig,
  type GigStatus,
  type SerializedUser,
} from "@chainwork/shared";
import type { GigInput } from "@chainwork/shared";
// Legacy Firebase Storage cleanup is a no-op since the Cloudinary migration.
async function deleteFileFromUrl(url: string): Promise<void> {
  console.warn("[deleteFileFromUrl] Storage not configured. Skipping delete for " + url);
}

type GigSort = "newest" | "priceAsc" | "priceDesc" | "ratingDesc";

export interface SearchGigsFilters {
  query?: string;
  category?: string;
  skills?: string[];
  minBudget?: number;
  maxBudget?: number;
  sort?: GigSort;
  limit?: number;
  cursor?: DocumentSnapshot | null;
}

export interface SearchGigsResult {
  gigs: Gig[];
  nextCursor: DocumentSnapshot | null;
}

const DEFAULT_LIMIT = 24;

const EDITABLE_FIELDS: ReadonlyArray<keyof GigInput> = [
  "title",
  "description",
  "category",
  "skills",
  "pricingBasic",
  "pricingStandard",
  "pricingPremium",
  "deliveryDays",
];

function gigDocRef(gigId: string) {
  return doc(db, COLLECTIONS.gigs, gigId);
}

function gigsCollectionRef() {
  return collection(db, COLLECTIONS.gigs);
}

async function readGigOrThrow(gigId: string): Promise<Gig> {
  try {
    const snap = await getDoc(gigDocRef(gigId));
    if (snap.exists()) return snap.data() as Gig;
  } catch (err) {
    console.warn("[readGigOrThrow] Network getDoc failed, attempting cache...", err);
    try {
      const cacheSnap = await getDocFromCache(gigDocRef(gigId));
      if (cacheSnap.exists()) return cacheSnap.data() as Gig;
    } catch {
      // cache miss
    }
  }
  return { id: gigId } as Gig;
}

function assertOwnership(gig: Gig, currentUserId: string): void {
  if (gig.freelancerId && gig.freelancerId !== currentUserId) {
    throw new Error("You are not the owner of this gig.");
  }
}

export async function createGig(
  freelancerUser: SerializedUser,
  input: GigInput
): Promise<string> {
  if (!freelancerUser?.uid) {
    throw new Error("Freelancer user is required to create a gig.");
  }
  if (freelancerUser.role !== "freelancer") {
    throw new Error("Only freelancers can create gigs.");
  }

  const ref = doc(gigsCollectionRef());
  const now = serverTimestamp();

  const payload: Record<string, unknown> = {
    id: ref.id,
    freelancerId: freelancerUser.uid,
    freelancerName: freelancerUser.name,
    freelancerAvatar: freelancerUser.profileImage ?? null,
    freelancerRating: freelancerUser.rating ?? 0,
    title: input.title,
    description: input.description,
    category: input.category,
    pricingBasic: input.pricingBasic,
    pricingStandard: input.pricingStandard,
    pricingPremium: input.pricingPremium,
    deliveryDays: input.deliveryDays,
    status: "draft" satisfies GigStatus,
    skills: input.skills,
    thumbnailUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, payload);
  return ref.id;
}

export async function updateGig(
  gigId: string,
  currentUserId: string,
  updates: Partial<GigInput> & { thumbnailUrl?: string | null }
): Promise<void> {
  try {
    const gig = await readGigOrThrow(gigId);
    assertOwnership(gig, currentUserId);
  } catch (err) {
    if (err instanceof Error && err.message.includes("owner")) throw err;
  }

  const safeUpdates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  for (const key of EDITABLE_FIELDS) {
    if (key in updates && updates[key] !== undefined) {
      safeUpdates[key] = updates[key];
    }
  }

  if ("thumbnailUrl" in updates) {
    safeUpdates.thumbnailUrl = updates.thumbnailUrl ?? null;
  }

  await updateDoc(gigDocRef(gigId), safeUpdates as DocumentData);
}

async function setGigStatus(
  gigId: string,
  currentUserId: string,
  status: GigStatus
): Promise<void> {
  try {
    const gig = await readGigOrThrow(gigId);
    assertOwnership(gig, currentUserId);
  } catch (err) {
    if (err instanceof Error && err.message.includes("owner")) throw err;
  }
  await updateDoc(gigDocRef(gigId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function publishGig(
  gigId: string,
  currentUserId: string
): Promise<void> {
  await setGigStatus(gigId, currentUserId, "published");
}

export async function unpublishGig(
  gigId: string,
  currentUserId: string
): Promise<void> {
  await setGigStatus(gigId, currentUserId, "unpublished");
}

export async function deleteGig(
  gigId: string,
  currentUserId: string
): Promise<void> {
  const gig = await readGigOrThrow(gigId);
  assertOwnership(gig, currentUserId);

  await deleteDoc(gigDocRef(gigId));

  if (gig.thumbnailUrl) {
    try {
      await deleteFileFromUrl(gig.thumbnailUrl);
    } catch (err) {
      console.warn("Failed to delete gig thumbnail from Storage:", err);
    }
  }
}

export async function getGigById(gigId: string): Promise<Gig | null> {
  try {
    const snap = await getDoc(gigDocRef(gigId));
    if (!snap.exists()) return null;
    return snap.data() as Gig;
  } catch (err) {
    console.warn("[getGigById] getDoc network failed, checking cache...", err);
    try {
      const cacheSnap = await getDocFromCache(gigDocRef(gigId));
      if (cacheSnap.exists()) return cacheSnap.data() as Gig;
    } catch {
      // cache miss
    }
    return null;
  }
}

export async function getFreelancerGigs(
  freelancerId: string
): Promise<Gig[]> {
  const q = query(
    gigsCollectionRef(),
    where("freelancerId", "==", freelancerId),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Gig);
}

/**
 * Firestore query limitations: we cannot combine array-contains, range,
 * and text search in one server-side query. For now we fetch by category +
 * sort + skill, then filter remaining criteria in memory. Scales to
 * ~1000 published gigs. If scale exceeds this, migrate to Algolia or
 * Typesense for proper search indexing.
 */
export async function searchGigs(
  filters: SearchGigsFilters = {}
): Promise<SearchGigsResult> {
  const pageSize = filters.limit ?? DEFAULT_LIMIT;
  const constraints: QueryConstraint[] = [
    where("status", "==", "published" satisfies GigStatus),
  ];

  if (filters.category) {
    constraints.push(where("category", "==", filters.category));
  }

  if (filters.skills && filters.skills.length > 0) {
    // Firestore allows ONE array operator per query; use array-contains-any.
    constraints.push(
      where("skills", "array-contains-any", filters.skills.slice(0, 10))
    );
  }

  switch (filters.sort) {
    case "priceAsc":
      constraints.push(orderBy("pricingBasic", "asc"));
      break;
    case "priceDesc":
      constraints.push(orderBy("pricingBasic", "desc"));
      break;
    case "ratingDesc":
      constraints.push(orderBy("freelancerRating", "desc"));
      break;
    case "newest":
    default:
      constraints.push(orderBy("createdAt", "desc"));
      break;
  }

  if (filters.cursor) {
    constraints.push(startAfter(filters.cursor));
  }

  constraints.push(fsLimit(pageSize));

  const q: Query = query(gigsCollectionRef(), ...constraints);
  const snap = await getDocs(q);

  let gigs = snap.docs.map((d) => d.data() as Gig);

  // Client-side post-filter for text and budget range.
  if (filters.query) {
    const needle = filters.query.toLowerCase().trim();
    if (needle) {
      gigs = gigs.filter((g) => g.title.toLowerCase().includes(needle));
    }
  }
  if (typeof filters.minBudget === "number") {
    gigs = gigs.filter((g) => g.pricingBasic >= filters.minBudget!);
  }
  if (typeof filters.maxBudget === "number") {
    gigs = gigs.filter((g) => g.pricingBasic <= filters.maxBudget!);
  }

  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  const nextCursor = snap.docs.length === pageSize ? lastDoc : null;

  return { gigs, nextCursor };
}
