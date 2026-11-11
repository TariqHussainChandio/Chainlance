import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type UserRole } from "@/lib/firebase/schema";
import {
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/lib/firebase/server-auth";
import { buildNewUserDoc, nameFromEmail } from "@/lib/firebase/user-doc";

export const runtime = "nodejs";

interface PendingSignupPayload {
  name?: unknown;
  role?: unknown;
}

/** Narrows an untrusted role value to a self-signup role, or null. */
function asSignupRole(value: unknown): "freelancer" | "client" | null {
  return value === "freelancer" || value === "client" ? value : null;
}

/**
 * Ensures `users/{uid}` exists, creating it if the email-link signup
 * never managed to (e.g. the confirm page lost its localStorage). Runs
 * in the same request that mints the session cookie, so a session can
 * never exist without a backing profile doc. Returns the user's role.
 */
async function ensureUserDoc(
  uid: string,
  email: string | undefined,
  pending: PendingSignupPayload | null
): Promise<UserRole> {
  const ref = adminDb.collection(COLLECTIONS.users).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    const role = snap.data()?.role;
    return (role as UserRole) ?? "client";
  }

  const pendingRole = pending ? asSignupRole(pending.role) : null;
  const pendingName =
    pending && typeof pending.name === "string" && pending.name.trim()
      ? pending.name.trim()
      : null;

  // Pending signup data → honor the role the user picked at /register.
  // Otherwise fall back to a minimal client doc built from the verified
  // Firebase Auth identity.
  const role: "freelancer" | "client" = pendingRole ?? "client";
  const name = pendingName ?? nameFromEmail(email);

  try {
    await ref.create(buildNewUserDoc({ uid, email: email ?? "", name, role }));
  } catch {
    // A concurrent request may have created it first; re-read the role
    // rather than failing the session.
    const again = await ref.get();
    return ((again.data()?.role as UserRole) ?? role) as UserRole;
  }
  return role;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const idToken =
    typeof body === "object" && body !== null && "idToken" in body
      ? (body as { idToken?: unknown }).idToken
      : undefined;

  const pending =
    typeof body === "object" && body !== null && "pendingSignup" in body
      ? ((body as { pendingSignup?: unknown }).pendingSignup as
          | PendingSignupPayload
          | null
          | undefined)
      : undefined;

  if (typeof idToken !== "string" || idToken.length === 0) {
    return NextResponse.json({ error: "missing_id_token" }, { status: 400 });
  }

  try {
    // Verify the token first so we trust the uid/email before any write.
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Guarantee the Firestore profile exists before the session cookie
    // is minted — this is the fix for "account exists in Auth but has no
    // profile document."
    const role = await ensureUserDoc(
      decoded.uid,
      decoded.email,
      pending ?? null
    );

    const expiresInMs = SESSION_COOKIE_MAX_AGE_SECONDS * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: expiresInMs,
    });

    const store = await cookies();
    store.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });

    return NextResponse.json({ ok: true, role });
  } catch {
    return NextResponse.json({ error: "invalid_id_token" }, { status: 401 });
  }
}

export async function DELETE(): Promise<Response> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
