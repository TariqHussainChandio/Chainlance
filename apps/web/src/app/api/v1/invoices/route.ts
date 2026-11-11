import { handleApi } from "@/lib/server/auth";
import { getFreelancerInvoices } from "@/app/actions/invoices";

export async function GET() {
  return handleApi(() => getFreelancerInvoices());
}
