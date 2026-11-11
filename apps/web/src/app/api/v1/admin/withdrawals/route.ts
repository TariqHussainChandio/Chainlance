import { handleApi } from "@/lib/server/auth";
import {
  adminApproveWithdrawal,
  adminRejectWithdrawal,
} from "@/app/actions/admin-payments";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action: "approve" | "reject";
    transactionId: string;
    reason?: string;
  };
  return handleApi(() =>
    body.action === "approve"
      ? adminApproveWithdrawal(body.transactionId)
      : adminRejectWithdrawal(body.transactionId, body.reason ?? "")
  );
}
