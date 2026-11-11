/**
 * Fire-and-forget POST to the internal fraud-check trigger. Callers should
 * NOT await this — the goal is zero added latency on user-facing flows.
 * Any error is swallowed; the admin dashboard will reflect the latest
 * fraudScore the next time the user takes an action that triggers a re-check.
 */
export function triggerFraudCheck(userId?: string): void {
  if (typeof window === "undefined") return;
  void fetch("/api/internal/fraud-check-trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(userId ? { userId } : {}),
    keepalive: true,
  }).catch(() => {
    /* intentionally ignored */
  });
}
