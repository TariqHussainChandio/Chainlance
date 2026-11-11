import { NextResponse, type NextRequest } from "next/server";

import { runFraudCheckForUser } from "@/app/actions/fraud";
import { getCurrentUser } from "@/lib/firebase/server-auth";

/**
 * Fire-and-forget endpoint that recomputes a user's fraud score after a
 * notable client-side action (gig creation, contract funding, review).
 * The client should call this without awaiting — we want zero latency on
 * the happy path. Returns 202 once the scan kicks off.
 *
 * Authorization: caller must be the user being checked OR an admin. This
 * prevents random users from triggering scans on each other.
 */
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const targetUserId = body.userId ?? me.uid;
  if (targetUserId !== me.uid && me.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Kick off the scan but don't block on it. We swallow errors here so a
  // failed scan never surfaces to the user; admin dashboard will reflect
  // the latest fraudScore on next refresh.
  void runFraudCheckForUser(targetUserId).catch(() => {});
  return NextResponse.json({ ok: true }, { status: 202 });
}
