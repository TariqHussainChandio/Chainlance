import { handleApi } from "@/lib/server/auth";
import { reviewKyc } from "@/app/actions/kyc";
import type { KycReviewInput } from "@chainwork/shared";

export async function POST(request: Request) {
  const body = (await request.json()) as KycReviewInput;
  return handleApi(() => reviewKyc(body));
}
