"use server";

import { Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Contract,
  type ContractTransaction,
} from "@/lib/firebase/schema";
import { toMillis } from "@/lib/firebase/serialize";
import { getCurrentUser } from "@/lib/firebase/server-auth";

export interface AdminDashboardStats {
  pendingKyc: number | null;
  openFraudAlerts: number | null;
  activeDisputes: number | null;
  totalUsers: number | null;
  totalVolume: number | null;
  newUsersThisWeek: number | null;
  gigsPublishedThisWeek: number | null;
  contractsThisWeek: number | null;
}

const WEEK_MS = 7 * 86_400_000;

/**
 * Runs `fn` and converts any thrown error (missing-index, network,
 * permission) into a `null` return so a single bad query doesn't take
 * down the whole dashboard. The UI renders "—" for null fields.
 */
async function safeCount(
  label: string,
  fn: () => Promise<number>
): Promise<number | null> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[admin-dashboard] ${label} query failed:`, err);
    return null;
  }
}

/**
 * Single round-trip for the /admin home page tiles. Each query is
 * wrapped individually — a missing-index error on (e.g.) the
 * "new users this week" range query reports `null` for that tile
 * without nuking the rest of the dashboard.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const weekAgo = Timestamp.fromMillis(Date.now() - WEEK_MS);

  const [
    pendingKyc,
    openFraudAlerts,
    activeDisputes,
    totalUsers,
    newUsersThisWeek,
    gigsPublishedThisWeek,
    contractsThisWeek,
    totalVolume,
  ] = await Promise.all([
    safeCount("pendingKyc", async () => {
      const s = await adminDb
        .collection(COLLECTIONS.kycSubmissions)
        .where("status", "in", ["pending", "submitted"])
        .count()
        .get();
      return s.data().count;
    }),
    safeCount("openFraudAlerts", async () => {
      const s = await adminDb
        .collection(COLLECTIONS.fraudAlerts)
        .where("status", "==", "open")
        .count()
        .get();
      return s.data().count;
    }),
    safeCount("activeDisputes", async () => {
      const s = await adminDb
        .collection(COLLECTIONS.contracts)
        .where("status", "==", "disputed")
        .count()
        .get();
      return s.data().count;
    }),
    safeCount("totalUsers", async () => {
      const s = await adminDb.collection(COLLECTIONS.users).count().get();
      return s.data().count;
    }),
    safeCount("newUsersThisWeek", async () => {
      const s = await adminDb
        .collection(COLLECTIONS.users)
        .where("createdAt", ">=", weekAgo)
        .count()
        .get();
      return s.data().count;
    }),
    safeCount("gigsPublishedThisWeek", async () => {
      const s = await adminDb
        .collection(COLLECTIONS.gigs)
        .where("status", "==", "published")
        .where("createdAt", ">=", weekAgo)
        .count()
        .get();
      return s.data().count;
    }),
    safeCount("contractsThisWeek", async () => {
      const s = await adminDb
        .collection(COLLECTIONS.contracts)
        .where("createdAt", ">=", weekAgo)
        .count()
        .get();
      return s.data().count;
    }),
    // Volume = sum of all milestone_release tx amounts across known
    // contracts. Heavier than a count() but tolerates per-contract
    // failures: each tx fetch lives in its own try/catch.
    safeCount("totalVolume", async () => {
      const contractsSnap = await adminDb
        .collection(COLLECTIONS.contracts)
        .limit(2000)
        .get();
      let total = 0;
      await Promise.all(
        contractsSnap.docs.map(async (doc) => {
          try {
            const _c = doc.data() as Contract;
            void _c;
            const txSnap = await doc.ref
              .collection("transactions")
              .where("type", "==", "milestone_release")
              .get();
            for (const t of txSnap.docs) {
              const tx = t.data() as ContractTransaction;
              total += tx.amount || 0;
            }
          } catch (err) {
            console.warn(
              `[admin-dashboard] tx scan failed for contract ${doc.id}:`,
              err
            );
          }
        })
      );
      return total;
    }),
  ]);

  return {
    pendingKyc,
    openFraudAlerts,
    activeDisputes,
    totalUsers,
    totalVolume,
    newUsersThisWeek,
    gigsPublishedThisWeek,
    contractsThisWeek,
  };
}

// Re-export so callers that already imported `toMillis` from this barrel
// don't need a separate import path. Mostly defensive — not used yet.
export { toMillis };
