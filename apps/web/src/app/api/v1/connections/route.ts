import { NextResponse } from "next/server";
import { handleApi } from "@/lib/server/auth";
import {
  checkConnectionAction,
  establishConnectionAction,
  type EstablishConnectionInput,
} from "@/app/actions/connections";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const freelancerId = url.searchParams.get("freelancerId");
  if (!freelancerId) {
    return NextResponse.json({ error: "freelancerId is required" }, { status: 400 });
  }
  return handleApi(() => checkConnectionAction(freelancerId));
}

export async function POST(request: Request) {
  const body = (await request.json()) as EstablishConnectionInput;
  return handleApi(() => establishConnectionAction(body));
}
