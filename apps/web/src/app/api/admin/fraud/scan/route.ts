import { NextResponse } from "next/server";

import { runFraudCheckOnAllUsers } from "@/app/actions/fraud";
import { getCurrentUser } from "@/lib/firebase/server-auth";

export async function POST() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const result = await runFraudCheckOnAllUsers();
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Fraud scan failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
