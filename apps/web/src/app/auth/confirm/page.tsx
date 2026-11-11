"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertOctagon, Loader2, MailCheck } from "lucide-react";
import { updatePassword, updateProfile } from "firebase/auth";

import { AzureButton } from "@/components/ui/azure-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import {
  checkIsSignInLink,
  clearPendingSignup,
  clearStoredEmail,
  completeSignInWithLink,
  readPendingSignup,
  readStoredEmail,
} from "@/lib/firebase/email-link";

type Status = "loading" | "email_needed" | "error";

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<Status>("loading");
  const [manualEmail, setManualEmail] = React.useState("");
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    // Guard against React 18 StrictMode double-effect, which would
    // otherwise call signInWithEmailLink twice and burn the link.
    if (startedRef.current) return;
    startedRef.current = true;
    void runConfirmFlow();
    // Mount-only: reads browser-only state (URL + localStorage) exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runConfirmFlow() {
    const url = window.location.href;
    if (!checkIsSignInLink(url)) {
      setStatus("error");
      return;
    }
    const stored = readStoredEmail();
    if (!stored) {
      setStatus("email_needed");
      return;
    }
    await handleConfirm(stored, url);
  }

  async function handleConfirm(emailToUse: string, url: string) {
    setStatus("loading");
    try {
      const credential = await completeSignInWithLink(
        emailToUse.trim().toLowerCase(),
        url
      );
      clearStoredEmail();

      const pending = readPendingSignup();
      if (pending) {
        // New signup on this browser: set display name + password on the
        // just-created auth user. Both are best-effort — the Firestore
        // doc itself is written server-side in /api/session below.
        try {
          await updateProfile(credential.user, { displayName: pending.name });
        } catch (err) {
          console.warn("[auth/confirm] updateProfile failed:", err);
        }
        try {
          await updatePassword(credential.user, pending.password);
        } catch (err) {
          // Requires recent login on some configs; user can set one
          // later from /profile. Don't block the signup.
          console.warn("[auth/confirm] updatePassword failed:", err);
        }
      }

      // Hand the signup details to the session route, which verifies the
      // token and GUARANTEES the Firestore user doc exists before the
      // session cookie is set. Only name + role are needed server-side;
      // the password never leaves the client.
      const idToken = await credential.user.getIdToken();
      const sessionRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          pendingSignup: pending
            ? { name: pending.name, role: pending.role }
            : null,
        }),
      });
      if (!sessionRes.ok) {
        throw new Error("Could not establish session.");
      }
      clearPendingSignup();

      const data = (await sessionRes.json().catch(() => null)) as
        | { role?: string }
        | null;
      const role = data?.role ?? null;

      toast.success("Email verified! Welcome to ChainWork.");
      router.push(role ? `/${role}` : "/");
    } catch (err) {
      console.error("[auth/confirm] failed:", err);
      const msg = err instanceof Error ? err.message : "Verification failed.";
      toast.error(msg);
      setStatus("error");
    }
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <GlassCard
          variant="elevated"
          className="w-full max-w-md space-y-4 p-8 text-center"
        >
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[color:var(--azure-500)]/15 text-[color:var(--azure-500)]">
            <MailCheck className="size-7" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            <GradientText>Verifying your email</GradientText>
          </h1>
          <p className="text-sm text-foreground/60">
            Hang tight while we confirm your identity.
          </p>
          <Loader2 className="mx-auto size-6 animate-spin text-[var(--azure-500)]" />
        </GlassCard>
      </main>
    );
  }

  if (status === "email_needed") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <GlassCard
          variant="elevated"
          className="w-full max-w-md space-y-5 p-8"
        >
          <div className="text-center">
            <div className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[color:var(--azure-500)]/15 text-[color:var(--azure-500)]">
              <MailCheck className="size-7" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              <GradientText>Confirm your email</GradientText>
            </h1>
            <p className="mt-1 text-sm text-foreground/70">
              It looks like you opened this link on a different device.
              Enter your email to complete verification.
            </p>
          </div>
          <Input
            type="email"
            placeholder="you@example.com"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
          />
          <AzureButton
            type="button"
            size="lg"
            className="w-full"
            onClick={() =>
              void handleConfirm(manualEmail, window.location.href)
            }
            disabled={!manualEmail.trim()}
          >
            Verify email
          </AzureButton>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <GlassCard
        variant="elevated"
        className="w-full max-w-md space-y-4 border-red-500/30 p-8 text-center"
      >
        <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-red-500/15 text-red-500">
          <AlertOctagon className="size-7" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Verification failed
        </h1>
        <p className="text-sm text-foreground/60">
          This link is invalid or has expired. Please try signing up again.
        </p>
        <AzureButton
          type="button"
          className="w-full"
          onClick={() => router.push("/register")}
        >
          Back to register
        </AzureButton>
      </GlassCard>
    </main>
  );
}
