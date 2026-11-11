import "server-only";

import { FieldValue } from "firebase-admin/firestore";

/**
 * Roles a brand-new account can be created with. Admin/banned are only
 * ever assigned later by an admin, never at signup.
 */
export type NewUserRole = "freelancer" | "client";

export interface NewUserDocInput {
  uid: string;
  email: string;
  name: string;
  role: NewUserRole;
  /** Initial skills provided at registration. Stored for recommendation engine. */
  skills?: string[];
}

/**
 * Builds the Firestore `users/{uid}` document for a freshly-verified
 * account, including the role-specific fields the rest of the app
 * expects (skills/rating for freelancers, companyName for clients).
 * Shared by the `createUserDoc` server action and the session route so
 * both produce identical, schema-complete docs.
 */
export function buildNewUserDoc(
  input: NewUserDocInput
): Record<string, unknown> {
  const email = input.email.trim().toLowerCase();

  const doc: Record<string, unknown> = {
    uid: input.uid,
    email,
    name: input.name,
    role: input.role,
    walletAddress: null,
    kycStatus: "pending",
    fraudScore: 0,
    profileImage: null,
    bio: null,
    emailVerified: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.role === "freelancer") {
    doc.skills = input.skills?.length ? input.skills : [];
    doc.rating = 0;
    doc.completionRate = 0;
    doc.portfolioUrls = [];
  } else {
    doc.companyName = null;
    doc.preferredBudget = null;
    // Clients can also have interest tags via skills for recommendation engine
    doc.skills = input.skills?.length ? input.skills : [];
  }

  return doc;
}

/** Derives a reasonable display name from an email when none is known. */
export function nameFromEmail(email: string | undefined | null): string {
  if (!email) return "New user";
  const local = email.split("@")[0]?.trim();
  return local && local.length > 0 ? local : "New user";
}
