import "server-only";

import type { User, SerializedUser } from "@/lib/firebase/schema";

/**
 * Fields that are sensitive / admin-only.
 * Standard users and clients will receive `undefined` for these.
 */
const ADMIN_ONLY_USER_FIELDS: ReadonlyArray<keyof User> = [
  "fraudScore",
  "kycStatus",
  "walletAddress",
  "stripeAccountId",
  "stripeAccountEmail",
  "stripeAccountName",
  "stripeAccountType",
  "stripeCountry",
  "stripeConnected",
  "paymentMethodConnected",
  "previousRole",
  "adminRole",
];

/**
 * Strips admin-only fields from a `User` object before passing it to a
 * non-admin caller.  Admins receive the full record unchanged.
 *
 * Use this on the server (Server Components, Server Actions, API routes)
 * before sending user data to the client.
 */
export function maskUserForRole(
  user: User,
  viewerRole: string | null | undefined
): Partial<User> {
  if (viewerRole === "admin") return user;

  const masked = { ...user } as Record<string, unknown>;
  for (const field of ADMIN_ONLY_USER_FIELDS) {
    delete masked[field as string];
  }
  return masked as Partial<User>;
}

/**
 * Same as `maskUserForRole` but operates on the serialized form
 * (Timestamps already converted to epoch ms).
 */
export function maskSerializedUserForRole(
  user: SerializedUser,
  viewerRole: string | null | undefined
): Partial<SerializedUser> {
  if (viewerRole === "admin") return user;

  const masked = { ...user } as Record<string, unknown>;
  for (const field of ADMIN_ONLY_USER_FIELDS) {
    delete masked[field as string];
  }
  return masked as Partial<SerializedUser>;
}

/**
 * Given an array of serialized users (e.g. from an admin listing), strip
 * admin-only fields for every entry unless the viewer is an admin.
 */
export function maskSerializedUsersForRole(
  users: SerializedUser[],
  viewerRole: string | null | undefined
): Partial<SerializedUser>[] {
  if (viewerRole === "admin") return users;
  return users.map((u) => maskSerializedUserForRole(u, viewerRole));
}
