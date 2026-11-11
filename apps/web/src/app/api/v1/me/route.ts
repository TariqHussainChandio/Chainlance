import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";

/** Session bootstrap for mobile: who am I, per cookie OR bearer token. */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  return NextResponse.json({ user });
}
