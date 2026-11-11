"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  // Log to console in dev so the developer can inspect the stack. In
  // production we keep the user-facing surface clean — the raw error
  // message can leak internal details.
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalError]", error);
    }
  }, [error]);

  const showDetails = process.env.NODE_ENV !== "production";

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <GlassCard
        variant="elevated"
        className="w-full max-w-md space-y-4 border-red-500/30 p-8 text-center shadow-[0_0_24px_rgba(239,68,68,0.18)]"
      >
        <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-red-500/15 text-red-500">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="text-sm text-foreground/60">
          {showDetails && error.message
            ? error.message
            : "An unexpected error occurred. Try refreshing — if it keeps happening, contact support."}
        </p>
        {showDetails && error.digest ? (
          <p className="font-mono text-[10px] text-foreground/40">
            digest: {error.digest}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={() => reset()}
            className="bg-[var(--azure-500)] text-white hover:bg-[var(--azure-600)]"
          >
            <RefreshCw className="size-4" />
            Try again
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </GlassCard>
    </main>
  );
}
