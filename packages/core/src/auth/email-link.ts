"use client";

import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  type ActionCodeSettings,
  type UserCredential,
} from "firebase/auth";

import { auth } from "@chainwork/firebase-client";
import { ports } from "../ports";

const EMAIL_STORAGE_KEY = "emailForSignIn";

function actionCodeSettings(): ActionCodeSettings {
  return {
    url: ports.link.getAppUrl("/auth/confirm"),
    handleCodeInApp: true,
  };
}

/**
 * Fires Firebase's hosted email-link signin email to `email`. The email
 * is also stashed (web: localStorage; mobile: AsyncStorage mirror) so the
 * confirm screen can recover it silently when the user clicks the link on
 * the same device. On a different device, the confirm screen prompts for
 * the email manually.
 */
export async function sendVerificationLink(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const settings = actionCodeSettings();
  try {
    await sendSignInLinkToEmail(auth, email, settings);
    ports.kvStorage.set(EMAIL_STORAGE_KEY, email);
    return { ok: true };
  } catch (err) {
    const code = (err as { code?: string }).code ?? "unknown";
    const message =
      err instanceof Error ? err.message : "Failed to send verification email.";
    console.error("[sendVerificationLink] Full error:", code, message, err);
    return { ok: false, error: `${code}: ${message}` };
  }
}

export function checkIsSignInLink(url: string): boolean {
  return isSignInWithEmailLink(auth, url);
}

export async function completeSignInWithLink(
  email: string,
  url: string
): Promise<UserCredential> {
  return signInWithEmailLink(auth, email, url);
}

export function readStoredEmail(): string | null {
  return ports.kvStorage.get(EMAIL_STORAGE_KEY);
}

export function clearStoredEmail(): void {
  ports.kvStorage.remove(EMAIL_STORAGE_KEY);
}

export interface PendingSignup {
  name: string;
  role: "freelancer" | "client";
  password: string;
  /** Initial skills entered during registration (alphabetical only). */
  skills?: string[];
}

const PENDING_KEY = "pendingSignup";

export function stashPendingSignup(data: PendingSignup): void {
  ports.kvStorage.set(PENDING_KEY, JSON.stringify(data));
}

export function readPendingSignup(): PendingSignup | null {
  const raw = ports.kvStorage.get(PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingSignup>;
    if (
      typeof parsed.name === "string" &&
      typeof parsed.password === "string" &&
      (parsed.role === "freelancer" || parsed.role === "client")
    ) {
      return {
        name: parsed.name,
        role: parsed.role,
        password: parsed.password,
        skills: Array.isArray(parsed.skills) ? (parsed.skills as string[]) : [],
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearPendingSignup(): void {
  ports.kvStorage.remove(PENDING_KEY);
}
