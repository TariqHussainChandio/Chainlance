import { handleApi } from "@/lib/server/auth";
import { updateUserProfile } from "@/app/actions/profile";
import type { ProfileUpdateInput } from "@chainwork/shared";

export async function PATCH(request: Request) {
  const body = (await request.json()) as ProfileUpdateInput;
  return handleApi(() => updateUserProfile(body));
}
