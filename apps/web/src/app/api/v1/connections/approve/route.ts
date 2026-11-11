import { handleApi } from "@/lib/server/auth";
import { approveConnectionAction } from "@/app/actions/connections";

export async function POST(request: Request) {
  const body = (await request.json()) as { connectionId: string };
  return handleApi(() => approveConnectionAction(body.connectionId));
}
