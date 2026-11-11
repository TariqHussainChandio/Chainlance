"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Contract,
  type FraudAlert,
  type Gig,
  type Review,
  type User,
} from "@/lib/firebase/schema";
import {
  serializeContract,
  serializeGig,
  serializeReview,
  serializeUser,
} from "@/lib/firebase/serialize";
import {
  computeFraudScore,
  type FraudScore,
} from "@/lib/ai/fraud";
import { getCurrentUser } from "@/lib/firebase/server-auth";

// Auto-flag threshold sits at 65 (not 70) to give ~5 points of headroom
// over the expected Test Fraud score (~73): if rounding or a single
// signal under-fires we still want the alert to fire. Innocent users
// should top out below 20 after the round-2 tuning so there's no
// false-positive risk in the 65–70 band.
const FLAG_THRESHOLD = 65;

async function loadContext(userId: string) {
  const userSnap = await adminDb.collection(COLLECTIONS.users).doc(userId).get();
  if (!userSnap.exists) throw new Error("User not found.");
  const user = serializeUser(userSnap.data() as User);

  const [gigsSnap, contractsF, contractsC, reviewsR, reviewsG] = await Promise.all([
    adminDb
      .collection(COLLECTIONS.gigs)
      .where("freelancerId", "==", userId)
      .get(),
    adminDb
      .collection(COLLECTIONS.contracts)
      .where("freelancerId", "==", userId)
      .get(),
    adminDb
      .collection(COLLECTIONS.contracts)
      .where("clientId", "==", userId)
      .get(),
    adminDb
      .collection(COLLECTIONS.reviews)
      .where("revieweeId", "==", userId)
      .get(),
    adminDb
      .collection(COLLECTIONS.reviews)
      .where("reviewerId", "==", userId)
      .get(),
  ]);

  return {
    user,
    context: {
      gigs: gigsSnap.docs.map((d) => serializeGig(d.data() as Gig)),
      contractsAsFreelancer: contractsF.docs.map((d) =>
        serializeContract(d.data() as Contract)
      ),
      contractsAsClient: contractsC.docs.map((d) =>
        serializeContract(d.data() as Contract)
      ),
      reviewsReceived: reviewsR.docs.map((d) =>
        serializeReview(d.data() as Review)
      ),
      reviewsGiven: reviewsG.docs.map((d) =>
        serializeReview(d.data() as Review)
      ),
    },
  };
}

/**
 * Computes a fraud score for a single user, persists `fraudScore` on the
 * user doc, and writes a `fraudAlerts` doc when the score crosses the
 * flag threshold. Returns the score so callers can react in-band.
 *
 * Callable from:
 *  - the admin "Run check" action on /admin/users
 *  - the /api/internal/fraud-check-trigger route (fire-and-forget after
 *    gig create / contract fund / review submit)
 *  - runFraudCheckOnAllUsers for bulk scans
 */
export async function runFraudCheckForUser(
  userId: string
): Promise<FraudScore> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin" && me.uid !== userId) {
    throw new Error("Only admins can run fraud checks on other users.");
  }

  const { user, context } = await loadContext(userId);
  const score = computeFraudScore(user, context);

  const userRef = adminDb.collection(COLLECTIONS.users).doc(userId);
  await userRef.update({
    fraudScore: score.totalScore,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (score.totalScore >= FLAG_THRESHOLD) {
    // Open-alert dedup: only create a new alert if there isn't already an
    // open one for this user. Lets the scan be idempotent.
    const existing = await adminDb
      .collection(COLLECTIONS.fraudAlerts)
      .where("userId", "==", userId)
      .where("status", "==", "open")
      .limit(1)
      .get();
    if (existing.empty) {
      const alertRef = adminDb.collection(COLLECTIONS.fraudAlerts).doc();
      const alert: Omit<FraudAlert, "createdAt"> & {
        createdAt: FirebaseFirestore.FieldValue;
      } = {
        id: alertRef.id,
        userId: user.uid,
        userName: user.name,
        riskScore: score.totalScore,
        detectedPattern: score.detectedPatterns.join(" · ") || "Multiple signals",
        status: "open",
        createdAt: FieldValue.serverTimestamp(),
      };
      await alertRef.set(alert);
    } else {
      // Refresh the score on the existing alert so the dashboard reflects
      // the latest evaluation without spawning a new row.
      await existing.docs[0]!.ref.update({
        riskScore: score.totalScore,
        detectedPattern:
          score.detectedPatterns.join(" · ") || "Multiple signals",
      });
    }
  }

  return score;
}

export interface ScanAllResult {
  scanned: number;
  flagged: number;
}

export async function runFraudCheckOnAllUsers(): Promise<ScanAllResult> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const usersSnap = await adminDb.collection(COLLECTIONS.users).limit(100).get();

  let scanned = 0;
  let flagged = 0;
  for (const doc of usersSnap.docs) {
    try {
      const score = await runFraudCheckForUser(doc.id);
      scanned++;
      if (score.totalScore >= FLAG_THRESHOLD) flagged++;
    } catch {
      // Skip rows that fail; bulk scan should not abort on a single bad doc.
    }
  }
  return { scanned, flagged };
}

export interface UpdateAlertStatusInput {
  alertId: string;
  status: FraudAlert["status"];
}

export async function updateFraudAlertStatus(
  input: UpdateAlertStatusInput
): Promise<{ ok: true }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const alertRef = adminDb
    .collection(COLLECTIONS.fraudAlerts)
    .doc(input.alertId);
  const snap = await alertRef.get();
  if (!snap.exists) throw new Error("Alert not found.");
  const alert = snap.data() as FraudAlert;

  await alertRef.update({ status: input.status });

  if (input.status === "confirmed") {
    await adminDb
      .collection(COLLECTIONS.users)
      .doc(alert.userId)
      .update({
        fraudScore: 100,
        updatedAt: FieldValue.serverTimestamp(),
      });
  }
  return { ok: true };
}

export async function restrictUserAccount(userId: string): Promise<{ ok: true }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  await adminDb
    .collection(COLLECTIONS.users)
    .doc(userId)
    .update({
      fraudScore: 100,
      kycStatus: "rejected",
      updatedAt: FieldValue.serverTimestamp(),
    });
  return { ok: true };
}
