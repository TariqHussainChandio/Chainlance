import { handleApi } from "@/lib/server/auth";
import { fundContractEscrow } from "@/app/actions/contracts";

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  return handleApi(() => fundContractEscrow(id));
}
