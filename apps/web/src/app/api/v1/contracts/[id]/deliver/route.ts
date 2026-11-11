import { handleApi } from "@/lib/server/auth";
import { markMilestoneDelivered } from "@/app/actions/contracts";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = (await request.json()) as {
    milestoneId: string;
    evidence: string;
    deliveryFileUrl?: string | null;
    deliveryFileName?: string | null;
  };
  return handleApi(() =>
    markMilestoneDelivered(
      id,
      body.milestoneId,
      body.evidence,
      body.deliveryFileUrl,
      body.deliveryFileName
    )
  );
}
