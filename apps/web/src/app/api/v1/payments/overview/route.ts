import { handleApi } from "@/lib/server/auth";
import { getMyPaymentsOverview } from "@/app/actions/payments";

export async function GET() {
  return handleApi(() => getMyPaymentsOverview());
}
