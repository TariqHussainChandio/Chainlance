import { handleApi } from "@/lib/server/auth";
import { requestMilestoneRevision } from "@/app/actions/contracts";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = (await request.json()) as {
    milestoneId: string;
    feedbackNote: string;
    extensionDays?: number;
  };
  return handleApi(() =>
    requestMilestoneRevision(id, body.milestoneId, body.feedbackNote, body.extensionDays)
  );
}
