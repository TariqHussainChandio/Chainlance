"use server";

import { Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Contract,
  type ContractStatus,
  type ContractTransaction,
  type Gig,
  type User,
  type UserRole,
} from "@/lib/firebase/schema";
import { toMillis } from "@/lib/firebase/serialize";
import { getCurrentUser } from "@/lib/firebase/server-auth";

export type ReportRange = "7d" | "30d" | "90d" | "all";

const DAY = 86_400_000;

function rangeStart(range: ReportRange): Timestamp | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return Timestamp.fromMillis(Date.now() - days * DAY);
}

export interface TopFreelancer {
  userId: string;
  name: string;
  avatar: string | null;
  earnings: number;
  contracts: number;
}

export interface TopCategory {
  category: string;
  count: number;
}

export interface PlatformReport {
  range: ReportRange;
  generatedAt: number;
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  newUsersInRange: number;
  totalGigs: number;
  newGigsInRange: number;
  totalContracts: number;
  contractsByStatus: Record<ContractStatus, number>;
  contractsInRange: number;
  totalVolume: number;
  volumeInRange: number;
  avgContractValue: number;
  topFreelancers: TopFreelancer[];
  topCategories: TopCategory[];
  activeDisputes: number;
  kycPending: number;
  highRiskUsers: number;
}

function emptyRoleCounts(): Record<UserRole, number> {
  return { freelancer: 0, client: 0, admin: 0, banned: 0 };
}

function emptyContractStatus(): Record<ContractStatus, number> {
  return {
    draft: 0,
    active: 0,
    delivered: 0,
    disputed: 0,
    completed: 0,
    cancelled: 0,
  };
}

/**
 * Aggregates platform-wide metrics for the admin reports page. Reads are
 * unindexed full-collection scans capped to keep latency reasonable at
 * MVP scale. Past ~50k users we'd want a daily aggregator job (Cloud
 * Function on a schedule) writing to a `metrics` collection instead of
 * computing on demand.
 */
export async function generatePlatformReport(args: {
  range: ReportRange;
}): Promise<PlatformReport> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Not signed in.");
  if (me.role !== "admin") throw new Error("Admins only.");

  const cutoff = rangeStart(args.range);
  const cutoffMs = cutoff?.toMillis() ?? 0;

  // Pull everything in parallel. We deliberately keep these as full
  // scans (limit 1000 each) rather than counted queries; at MVP volume
  // both round-trips are comparable in latency.
  const [usersSnap, gigsSnap, contractsSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.users).limit(2000).get(),
    adminDb
      .collection(COLLECTIONS.gigs)
      .where("status", "==", "published")
      .limit(2000)
      .get(),
    adminDb.collection(COLLECTIONS.contracts).limit(2000).get(),
  ]);

  // --- Users
  const usersByRole = emptyRoleCounts();
  let newUsersInRange = 0;
  let kycPending = 0;
  let highRiskUsers = 0;
  const userById = new Map<string, User>();
  for (const doc of usersSnap.docs) {
    const u = doc.data() as User;
    userById.set(doc.id, u);
    usersByRole[u.role] = (usersByRole[u.role] ?? 0) + 1;
    const createdMs = toMillis(u.createdAt);
    if (cutoffMs === 0 || createdMs >= cutoffMs) newUsersInRange += 1;
    if (u.kycStatus === "submitted" || u.kycStatus === "pending") {
      kycPending += 1;
    }
    if ((u.fraudScore ?? 0) >= 70) highRiskUsers += 1;
  }

  // --- Gigs
  let newGigsInRange = 0;
  const categoryCounts = new Map<string, number>();
  for (const doc of gigsSnap.docs) {
    const g = doc.data() as Gig;
    if (cutoffMs === 0 || toMillis(g.createdAt) >= cutoffMs) {
      newGigsInRange += 1;
    }
    if (g.category) {
      categoryCounts.set(g.category, (categoryCounts.get(g.category) ?? 0) + 1);
    }
  }
  const topCategories: TopCategory[] = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // --- Contracts
  const contractsByStatus = emptyContractStatus();
  let contractsInRange = 0;
  let activeDisputes = 0;
  let valueSum = 0;
  const contractsByFreelancer = new Map<string, number>();
  for (const doc of contractsSnap.docs) {
    const c = doc.data() as Contract;
    contractsByStatus[c.status] = (contractsByStatus[c.status] ?? 0) + 1;
    if (c.status === "disputed") activeDisputes += 1;
    if (cutoffMs === 0 || toMillis(c.createdAt) >= cutoffMs) {
      contractsInRange += 1;
    }
    valueSum += c.totalAmount || 0;
    contractsByFreelancer.set(
      c.freelancerId,
      (contractsByFreelancer.get(c.freelancerId) ?? 0) + 1
    );
  }
  const totalContracts = contractsSnap.size;
  const avgContractValue =
    totalContracts === 0 ? 0 : valueSum / totalContracts;

  // --- Volume + top freelancers via milestone_release transactions on
  // each contract. Volume sums across all completed milestone releases.
  // We restrict to contracts we already pulled to avoid a global
  // collection-group scan.
  let totalVolume = 0;
  let volumeInRange = 0;
  const earningsByFreelancer = new Map<string, number>();
  await Promise.all(
    contractsSnap.docs.map(async (doc) => {
      const c = doc.data() as Contract;
      const txSnap = await doc.ref
        .collection("transactions")
        .where("type", "==", "milestone_release")
        .get();
      for (const t of txSnap.docs) {
        const tx = t.data() as ContractTransaction;
        const amount = tx.amount || 0;
        totalVolume += amount;
        if (cutoffMs === 0 || toMillis(tx.createdAt) >= cutoffMs) {
          volumeInRange += amount;
        }
        earningsByFreelancer.set(
          c.freelancerId,
          (earningsByFreelancer.get(c.freelancerId) ?? 0) + amount
        );
      }
    })
  );

  const topFreelancers: TopFreelancer[] = [...earningsByFreelancer.entries()]
    .map<TopFreelancer>(([userId, earnings]) => {
      const user = userById.get(userId);
      return {
        userId,
        name: user?.name ?? userId,
        avatar: user?.profileImage ?? null,
        earnings,
        contracts: contractsByFreelancer.get(userId) ?? 0,
      };
    })
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  return {
    range: args.range,
    generatedAt: Date.now(),
    totalUsers: usersSnap.size,
    usersByRole,
    newUsersInRange,
    totalGigs: gigsSnap.size,
    newGigsInRange,
    totalContracts,
    contractsByStatus,
    contractsInRange,
    totalVolume,
    volumeInRange,
    avgContractValue,
    topFreelancers,
    topCategories,
    activeDisputes,
    kycPending,
    highRiskUsers,
  };
}
