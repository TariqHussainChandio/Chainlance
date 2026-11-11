import "server-only";

import { cookies, headers } from "next/headers";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type SerializedUser, type User } from "@/lib/firebase/schema";
import { serializeUser } from "@/lib/firebase/serialize";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

async function loadUser(uid: string): Promise<SerializedUser | null> {
  const snap = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
  if (!snap.exists) return null;
  return serializeUser(snap.data() as User);
}

/**
 * Dual-mode authentication, in order:
 *  1. `session` cookie (web) — verified session cookie with revocation check.
 *  2. `Authorization: Bearer <Firebase ID token>` (mobile / API clients) —
 *     verified ID token with revocation check.
 *
 * Both server actions and route handlers call this, so the whole action
 * layer accepts either transport.
 */
export async function getCurrentUser(): Promise<SerializedUser | null> {
  // 1) Web session cookie
  try {
    const store = await cookies();
    const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;
    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      const user = await loadUser(decoded.uid);
      if (user) return user;
    }
  } catch {
    /* fall through to bearer */
  }

  // 2) Bearer ID token (mobile)
  try {
    const h = await headers();
    const authorization = h.get("authorization");
    if (!authorization?.toLowerCase().startsWith("bearer ")) return null;

    const idToken = authorization.slice(7).trim();
    if (!idToken) return null;

    const decoded = await adminAuth.verifyIdToken(idToken, true);
    return await loadUser(decoded.uid);
  } catch {
    return null;
  }
}
