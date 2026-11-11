"use server";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Contract,
  type Gig,
  type Review,
  type SerializedContract,
  type SerializedGig,
  type SerializedUser,
  type User,
  type UserRole,
} from "@/lib/firebase/schema";
import {
  serializeContract,
  serializeGig,
  serializeUser,
} from "@/lib/firebase/serialize";
import { getCurrentUser } from "@/lib/firebase/server-auth";

/**
 * Admin-only: returns every user in the directory. Used by /admin/users.
 * Hard-capped at 500 because the page renders the full list (no server
 * pagination yet); past that we'd want a paged table.
 */
export async function adminListAllUsers(): Promise<SerializedUser[]> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const snap = await adminDb.collection(COLLECTIONS.users).limit(500).get();
  return snap.docs.map((d) => serializeUser(d.data() as User));
}

export interface UserProfileStats {
  user: SerializedUser;
  gigCount: number;
  contractsAsClient: number;
  contractsAsFreelancer: number;
  reviewsReceived: number;
  avgRating: number;
  completionRate: number;
  recentActivity: ActivityEvent[];
}

export interface ActivityEvent {
  type: "gig" | "contract";
  id: string;
  label: string;
  createdAt: number;
}

/**
 * Profile stats for the admin "View profile" slide-over. Aggregates
 * across gigs, contracts and reviews. Activity timeline is capped at 10
 * events to keep payload small.
 */
export async function getUserProfileStats(
  userId: string
): Promise<UserProfileStats> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const userSnap = await adminDb
    .collection(COLLECTIONS.users)
    .doc(userId)
    .get();
  if (!userSnap.exists) throw new Error("User not found.");
  const user = serializeUser(userSnap.data() as User);

  const [gigsSnap, asClientSnap, asFreelancerSnap, reviewsSnap] =
    await Promise.all([
      adminDb
        .collection(COLLECTIONS.gigs)
        .where("freelancerId", "==", userId)
        .get(),
      adminDb
        .collection(COLLECTIONS.contracts)
        .where("clientId", "==", userId)
        .get(),
      adminDb
        .collection(COLLECTIONS.contracts)
        .where("freelancerId", "==", userId)
        .get(),
      adminDb
        .collection(COLLECTIONS.reviews)
        .where("revieweeId", "==", userId)
        .get(),
    ]);

  const gigs = gigsSnap.docs.map((d) => serializeGig(d.data() as Gig));
  const asClient = asClientSnap.docs.map((d) =>
    serializeContract(d.data() as Contract)
  );
  const asFreelancer = asFreelancerSnap.docs.map((d) =>
    serializeContract(d.data() as Contract)
  );

  const reviews = reviewsSnap.docs.map((d) => d.data() as Review);
  const reviewsReceived = reviews.length;
  const avgRating =
    reviewsReceived === 0
      ? 0
      : reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0) / reviewsReceived;

  const freelancerContracts = asFreelancer;
  const completed = freelancerContracts.filter(
    (c) => c.status === "completed"
  ).length;
  const completionRate =
    freelancerContracts.length === 0
      ? user.completionRate ?? 0
      : completed / freelancerContracts.length;

  const events: ActivityEvent[] = [
    ...gigs.map<ActivityEvent>((g) => ({
      type: "gig",
      id: g.id,
      label: `Published gig "${g.title}"`,
      createdAt: g.createdAt,
    })),
    ...asClient.map<ActivityEvent>((c) => ({
      type: "contract",
      id: c.id,
      label: `Created contract "${c.title}"`,
      createdAt: c.createdAt,
    })),
    ...asFreelancer.map<ActivityEvent>((c) => ({
      type: "contract",
      id: c.id,
      label: `Accepted contract "${c.title}"`,
      createdAt: c.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);

  return {
    user,
    gigCount: gigs.length,
    contractsAsClient: asClient.length,
    contractsAsFreelancer: asFreelancer.length,
    reviewsReceived,
    avgRating,
    completionRate,
    recentActivity: events,
  };
}

interface SerializedSnapshot {
  gigs: SerializedGig[];
  contracts: SerializedContract[];
}

/**
 * Lightweight version used by admin tooling that just wants the raw
 * arrays (e.g. for charts on the reports page).
 */
export async function getUserGigsAndContracts(
  userId: string
): Promise<SerializedSnapshot> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const [gigsSnap, contractsSnap] = await Promise.all([
    adminDb
      .collection(COLLECTIONS.gigs)
      .where("freelancerId", "==", userId)
      .get(),
    adminDb
      .collection(COLLECTIONS.contracts)
      .where("freelancerId", "==", userId)
      .get(),
  ]);
  return {
    gigs: gigsSnap.docs.map((d) => serializeGig(d.data() as Gig)),
    contracts: contractsSnap.docs.map((d) =>
      serializeContract(d.data() as Contract)
    ),
  };
}

export interface SetUserBanInput {
  userId: string;
  banned: boolean;
  /**
   * Role to restore when unbanning. Required because the user doc
   * doesn't keep a memo of the prior role once flipped to "banned".
   */
  restoreRole?: UserRole;
}

/**
 * Flip a user between "banned" and a normal role. We don't store a
 * `priorRole` field so the caller has to pass the role to restore
 * (read from the user doc just before issuing the unban — the UI does
 * this via getUserProfileStats first).
 */
export async function setUserBanState(
  input: SetUserBanInput
): Promise<{ ok: true }> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");
  if (input.userId === me.uid) {
    throw new Error("You cannot ban yourself.");
  }

  const nextRole: UserRole = input.banned
    ? "banned"
    : input.restoreRole && input.restoreRole !== "banned"
      ? input.restoreRole
      : "freelancer";

  await adminDb
    .collection(COLLECTIONS.users)
    .doc(input.userId)
    .update({
      role: nextRole,
      updatedAt: FieldValue.serverTimestamp(),
    });
  return { ok: true };
}
