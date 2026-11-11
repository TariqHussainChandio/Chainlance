import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/firebase/server-auth";
import { getUserNotificationsAction } from "@/app/actions/notifications";

/** Returns the signed-in user's notifications (newest first). */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);

  const notifications = await getUserNotificationsAction(user.uid);
  return NextResponse.json({ notifications: notifications.slice(0, limit) });
}
