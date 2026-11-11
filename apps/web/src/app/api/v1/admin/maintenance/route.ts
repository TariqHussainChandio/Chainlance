import { handleApi } from "@/lib/server/auth";
import { clearDismissedFraudAlerts } from "@/app/actions/admin-maintenance";

export async function POST() {
  return handleApi(() => clearDismissedFraudAlerts());
}
