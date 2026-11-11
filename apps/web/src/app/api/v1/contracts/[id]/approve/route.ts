import { handleApi } from "@/lib/server/auth";
import { approveMilestone } from "@/app/actions/contracts";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = (await request.json()) as { milestoneId: string };
  return handleApi(() => approveMilestone(id, body.milestoneId));
}
