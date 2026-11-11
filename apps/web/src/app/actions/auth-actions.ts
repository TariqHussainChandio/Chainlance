"use server";

import { checkEmailExists } from "@/lib/firebase/admin";

/**
 * Returns `true` if no Firebase Auth account exists for this email.
 * Used by /register pre-flight before sending the verification link.
 * Intentionally anonymous — it runs before any credential exists.
 *
 * NOTE: the previous `createUserDoc` and `getUserRoleByUid` actions were
 * removed — they were unauthenticated (any caller could create a user doc
 * for an arbitrary uid or look up anyone's role) and had no callers; the
 * /api/session route owns user-doc bootstrap for email-link signups.
 */
export async function checkEmailAvailable(email: string): Promise<boolean> {
  const exists = await checkEmailExists(email.trim().toLowerCase());
  return !exists;
}
