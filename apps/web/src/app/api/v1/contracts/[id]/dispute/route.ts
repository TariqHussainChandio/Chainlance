import { handleApi } from "@/lib/server/auth";
import { disputeMilestone } from "@/app/actions/contracts";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = (await request.json()) as {
    milestoneId: string;
    reason: string;
    evidenceUrl?: string | null;
    evidenceName?: string | null;
  };
  return handleApi(() =>
    disputeMilestone(id, body.milestoneId, body.reason, body.evidenceUrl, body.evidenceName)
  );
}
