import { handleApi } from "@/lib/server/auth";
import { resolveDispute, type ResolveDisputeInput } from "@/app/actions/disputes";

export async function POST(request: Request) {
  const body = (await request.json()) as ResolveDisputeInput;
  return handleApi(() => resolveDispute(body));
}
