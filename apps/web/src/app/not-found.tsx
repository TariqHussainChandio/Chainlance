import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { AzureButton } from "@/components/ui/azure-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <GlassCard
        variant="elevated"
        className="w-full max-w-md space-y-4 p-8 text-center"
      >
        <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[color:var(--azure-500)]/10 text-[var(--azure-500)]">
          <Compass className="size-7" />
        </div>
        <div className="text-7xl font-semibold tracking-tight">
          <GradientText>404</GradientText>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-foreground/60">
          The page you're looking for doesn't exist or you don't have
          access.
        </p>
        <AzureButton asChild className="w-full">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </AzureButton>
      </GlassCard>
    </main>
  );
}
