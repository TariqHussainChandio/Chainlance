import { handleApi } from "@/lib/server/auth";
import { updateContactInfo, type UpdateContactInfoInput } from "@/app/actions/profile";

export async function POST(request: Request) {
  const body = (await request.json()) as UpdateContactInfoInput;
  return handleApi(() => updateContactInfo(body));
}
