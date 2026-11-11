import { handleApi } from "@/lib/server/auth";
import { submitKyc } from "@/app/actions/kyc";
import type { KycSubmissionInput } from "@chainwork/shared";

export async function POST(request: Request) {
  const body = (await request.json()) as KycSubmissionInput;
  return handleApi(() => submitKyc(body));
}
