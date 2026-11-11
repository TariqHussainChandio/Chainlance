"use server";

import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/schema";
import { getCurrentUser } from "@/lib/firebase/server-auth";

/**
 * Deletes every fraudAlert doc with status === "dismissed". Used by the
 * /admin/settings "Clear all dismissed fraud alerts" button. Batched in
 * chunks of 400 to stay under the 500-write Firestore batch limit.
 */
export async function clearDismissedFraudAlerts(): Promise<{
  deleted: number;
}> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const snap = await adminDb
    .collection(COLLECTIONS.fraudAlerts)
    .where("status", "==", "dismissed")
    .get();

  if (snap.empty) return { deleted: 0 };

  const chunkSize = 400;
  let total = 0;
  for (let i = 0; i < snap.docs.length; i += chunkSize) {
    const batch = adminDb.batch();
    const chunk = snap.docs.slice(i, i + chunkSize);
    for (const doc of chunk) batch.delete(doc.ref);
    await batch.commit();
    total += chunk.length;
  }
  return { deleted: total };
}
