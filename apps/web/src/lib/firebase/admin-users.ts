import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type User } from "@/lib/firebase/schema";

/**
 * Server-side user fetch. Bypasses client security rules so public pages
 * (e.g. /gig/[id] "About seller") can render freelancer details without
 * requiring the visitor to be signed in.
 */
export async function getUserByIdAdmin(uid: string): Promise<User | null> {
  const snap = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as User;
}
