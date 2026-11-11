import { handleApi } from "@/lib/server/auth";
import {
  adminAuthorizePayment,
  adminClearMilestonePayout,
  adminHoldPayment,
  adminReleaseHold,
  getAdminPaymentsData,
} from "@/app/actions/admin-payments";
import {
  adminHoldMilestonePayment,
  adminReleaseMilestoneHold,
} from "@/app/actions/contracts";

export async function GET() {
  return handleApi(() => getAdminPaymentsData());
}

type AdminPaymentsRequest = {
  action:
    | "clear"
    | "authorize"
    | "hold"
    | "release-hold"
    | "milestone-hold"
    | "milestone-release-hold";
  contractId: string;
  milestoneId: string;
  note?: string;
  reason?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AdminPaymentsRequest;
  return handleApi(async () => {
    switch (body.action) {
      case "clear":
        return adminClearMilestonePayout(body.contractId, body.milestoneId);
      case "authorize":
        return adminAuthorizePayment(body.contractId, body.milestoneId, body.note);
      case "hold":
        return adminHoldPayment(body.contractId, body.milestoneId, body.reason ?? "");
      case "release-hold":
        return adminReleaseHold(body.contractId, body.milestoneId);
      case "milestone-hold":
        return adminHoldMilestonePayment(body.contractId, body.milestoneId, body.reason ?? "");
      case "milestone-release-hold":
        return adminReleaseMilestoneHold(body.contractId, body.milestoneId);
      default:
        throw new Error("Unknown admin payments action.");
    }
  });
}
