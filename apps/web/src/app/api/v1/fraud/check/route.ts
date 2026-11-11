import { handleApi } from "@/lib/server/auth";
import { runFraudCheckForUser } from "@/app/actions/fraud";

export async function POST(request: Request) {
  const body = (await request.json()) as { userId: string };
  return handleApi(() => runFraudCheckForUser(body.userId));
}
