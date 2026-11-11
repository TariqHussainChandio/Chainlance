import { NextResponse } from "next/server";
import { handleApi } from "@/lib/server/auth";
import {
  getUserGigsAndContracts,
  getUserProfileStats,
} from "@/app/actions/admin-users";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const uid = url.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "uid is required" }, { status: 400 });
  }
  return handleApi(async () => {
    const [stats, snapshot] = await Promise.all([
      getUserProfileStats(uid),
      getUserGigsAndContracts(uid),
    ]);
    return { stats, snapshot };
  });
}
