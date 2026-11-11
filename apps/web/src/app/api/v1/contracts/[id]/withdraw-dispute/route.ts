import { handleApi } from "@/lib/server/auth";
import { resolveOrWithdrawDispute } from "@/app/actions/contracts";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { reasonNote?: string };
  return handleApi(() => resolveOrWithdrawDispute(id, body.reasonNote));
}
