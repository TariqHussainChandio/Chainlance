/**
 * Typed fetch wrapper for the ChainWork server API (apps/web route handlers).
 *
 * Web pages normally use server actions directly; this client exists for
 * platforms without cookies — React Native authenticates every call with a
 * Firebase ID token Bearer header. A 401 is retried once with a
 * force-refreshed token before failing.
 */

export interface ApiClientConfig {
  /** e.g. "http://192.168.1.20:3000" in dev, the deployed origin in prod. */
  baseUrl: string;
  /** Returns the current Firebase ID token, or null when signed out. */
  getToken(): Promise<string | null>;
  /** Returns a force-refreshed ID token (RN: user.getIdToken(true)). */
  forceRefreshToken?(): Promise<string | null>;
}

let config: ApiClientConfig | null = null;

export function configureApiClient(cfg: ApiClientConfig): void {
  config = cfg;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(
  path: string,
  init: RequestInit,
  token: string | null
): Promise<Response> {
  if (!config) {
    throw new Error(
      "API client not configured. Call configureApiClient({ baseUrl, getToken }) at startup."
    );
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${config.baseUrl}${path}`, { ...init, headers });
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!config) {
    throw new Error(
      "API client not configured. Call configureApiClient({ baseUrl, getToken }) at startup."
    );
  }

  let res = await request(path, init, await config.getToken());

  // ID tokens expire hourly; retry exactly once with a forced refresh.
  if (res.status === 401 && config.forceRefreshToken) {
    const fresh = await config.forceRefreshToken();
    if (fresh) {
      res = await request(path, init, fresh);
    }
  }

  const body = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!res.ok) {
    throw new ApiError(res.status, body?.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
