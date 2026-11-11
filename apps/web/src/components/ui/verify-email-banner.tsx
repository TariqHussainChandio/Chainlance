"use client";

import * as React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Loader2, MailWarning, X } from "lucide-react";
import { toast } from "sonner";

import { auth } from "@/lib/firebase/client";
import { resendEmailVerification } from "@/lib/firebase/auth-helpers";
import { cn } from "@/lib/utils";

interface VerifyEmailBannerProps {
  userRole: "freelancer" | "client" | "admin" | "banned";
}

/**
 * Thin top-of-page bar that shows on dashboard routes while the signed-in
 * user's email is unverified. Hidden entirely for admin (and banned)
 * roles — they don't need verification prompts.
 */
export function VerifyEmailBanner({ userRole }: VerifyEmailBannerProps) {
  const [user, loading] = useAuthState(auth);
  const [dismissed, setDismissed] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  if (userRole !== "freelancer" && userRole !== "client") return null;
  if (loading || !user || user.emailVerified || dismissed) return null;

  async function resend() {
    setSending(true);
    try {
      await resendEmailVerification();
      toast.success(`Verification email sent to ${user?.email ?? ""}.`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not send email.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-200"
      )}
    >
      <div className="inline-flex items-center gap-2">
        <MailWarning className="size-4" />
        <span>
          Please verify your email. We sent a link to{" "}
          <span className="font-medium">{user.email}</span>.
        </span>
      </div>
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => void resend()}
          disabled={sending}
          className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-1 font-medium transition-colors hover:bg-amber-500/25 disabled:opacity-60"
        >
          {sending ? <Loader2 className="size-3 animate-spin" /> : null}
          Resend
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="inline-flex size-6 items-center justify-center rounded-md hover:bg-amber-500/20"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
