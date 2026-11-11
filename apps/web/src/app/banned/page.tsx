"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertOctagon, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  deleteSessionCookie,
  signOut,
} from "@/lib/firebase/auth-helpers";

export default function BannedPage() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
      await deleteSessionCookie();
      router.push("/");
    } catch {
      toast.error("Could not sign out.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <GlassCard
        variant="elevated"
        className="w-full max-w-md space-y-5 p-8 text-center"
      >
        <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-red-500/15 text-red-500">
          <AlertOctagon className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Account restricted
          </h1>
          <p className="text-sm text-foreground/60">
            Your account has been suspended pending admin review. If you
            believe this is in error, contact{" "}
            <a
              href="mailto:support@chainwork.test"
              className="text-[color:var(--azure-500)] hover:underline"
            >
              support@chainwork.test
            </a>
            .
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleSignOut()}
          disabled={busy}
          className="w-full"
        >
          <LogOut className="size-4" />
          {busy ? "Signing out…" : "Sign out"}
        </Button>
      </GlassCard>
    </main>
  );
}
