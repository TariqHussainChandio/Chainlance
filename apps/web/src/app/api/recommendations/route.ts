import { NextResponse, type NextRequest } from "next/server";
import { unstable_cache } from "next/cache";

import { getPublishedGigs } from "@/lib/firebase/admin-gigs";
import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type Contract,
  type Gig,
  type SerializedContract,
  type SerializedGig,
} from "@/lib/firebase/schema";
import {
  serializeContract,
  serializeGig,
} from "@/lib/firebase/serialize";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import { rankGigsForUser, type RankedGig } from "@/lib/ai/recommend";

/**
 * Caching note: the spec suggested `revalidate: 600` via Next's fetch
 * cache. That cache only applies to `fetch()` calls — we hit the admin
 * SDK directly. Wrapping the gig+contract fetch in `unstable_cache` gives
 * the same effect at MVP scale: per-process memoization. TTL reduced to
 * 30s after observing stale-empty cache symptoms during dev (newly
 * published gigs invisible until next eviction). At larger scale move to
 * Redis/Upstash with a stable cache key across instances.
 */
const getCachedGigs = unstable_cache(
  async (): Promise<SerializedGig[]> => {
    const raw = await getPublishedGigs(200);
    return raw.map(serializeGig);
  },
  ["recommendations:published-gigs"],
  { revalidate: 30, tags: ["gigs"] }
);

const getCachedClientContracts = unstable_cache(
  async (clientId: string): Promise<SerializedContract[]> => {
    const snap = await adminDb
      .collection(COLLECTIONS.contracts)
      .where("clientId", "==", clientId)
      .where("status", "in", ["completed", "active", "delivered"])
      .limit(50)
      .get();
    return snap.docs.map((d) => serializeContract(d.data() as Contract));
  },
  ["recommendations:client-contracts"],
  { revalidate: 30, tags: ["contracts"] }
);

function toRecencyFallback(
  gigs: SerializedGig[],
  limit: number
): RankedGig[] {
  return [...gigs]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map((gig) => ({ gig, score: 0, explanations: ["Sorted by recency"] }));
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const limitRaw = Number(searchParams.get("limit") ?? "24");
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 100
      ? Math.floor(limitRaw)
      : 24;

  let gigs: SerializedGig[];
  try {
    gigs = await getCachedGigs();
  } catch (err) {
    console.error("[recommendations] gig fetch failed:", err);
    return NextResponse.json({ results: [], fallback: true });
  }

  if (category) {
    gigs = gigs.filter((g): g is SerializedGig => g.category === category);
  }

  // No published gigs (or none matching the category filter) — return an
  // empty array cleanly so the client renders the empty state instead of
  // surfacing a 500.
  if (gigs.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const pastContracts =
    user.role === "client"
      ? await getCachedClientContracts(user.uid).catch(() => [])
      : [];

  try {
    const results = rankGigsForUser(
      user,
      gigs,
      { limit },
      { pastContracts }
    );
    return NextResponse.json({ results });
  } catch (err) {
    console.error(
      "[recommendations] ranking failed, returning recency fallback:",
      err
    );
    return NextResponse.json({
      results: toRecencyFallback(gigs, limit),
      fallback: true,
    });
  }
}

// Type assertion used to keep TS happy when satisfying `Gig` shape returned by
// admin-gigs (it returns `Gig` not `SerializedGig`). The serialize step above
// converts; the import here is just to keep type narrowing tight.
type _Unused = Gig;
void (null as unknown as _Unused);
