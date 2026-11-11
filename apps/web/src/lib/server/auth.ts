import "server-only";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/firebase/server-auth";
import type { SerializedUser } from "@chainwork/shared";

/** Thrown by requireUser/requireRole; route handlers map it to a response. */
export class HttpAuthError extends Error {
  readonly status: 401 | 403;
  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "HttpAuthError";
    this.status = status;
  }
}

/** Cookie-or-bearer authenticated user (see lib/firebase/server-auth.ts). */
export { getCurrentUser as getAuthenticatedUser };

export async function requireUser(): Promise<SerializedUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpAuthError(401, "Not signed in.");
  if (user.role === "banned") throw new HttpAuthError(403, "Account suspended.");
  return user;
}

export async function requireRole(
  role: "freelancer" | "client" | "admin"
): Promise<SerializedUser> {
  const user = await requireUser();
  if (user.role !== role) {
    throw new HttpAuthError(403, `This operation requires the ${role} role.`);
  }
  return user;
}

export async function requireAdmin(): Promise<SerializedUser> {
  return requireRole("admin");
}

/**
 * Wraps a route-handler body: auth/validation errors become clean JSON
 * responses, everything else becomes a 400 with the thrown message (matching
 * how server actions surface errors to the web UI).
 */
export async function handleApi<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const result = await fn();
    return NextResponse.json(result ?? { success: true });
  } catch (err) {
    if (err instanceof HttpAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
