import { handleApi } from "@/lib/server/auth";
import { getAdminDashboardStats } from "@/app/actions/admin-dashboard";

export async function GET() {
  return handleApi(() => getAdminDashboardStats());
}
