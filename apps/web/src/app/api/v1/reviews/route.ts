import { handleApi } from "@/lib/server/auth";
import { submitReview } from "@/app/actions/reviews";
import type { ReviewInput } from "@chainwork/shared";

export async function POST(request: Request) {
  const body = (await request.json()) as ReviewInput;
  return handleApi(() => submitReview(body));
}
