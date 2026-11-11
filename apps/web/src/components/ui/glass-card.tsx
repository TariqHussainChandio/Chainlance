import * as React from "react";

import { cn } from "@/lib/utils";

type GlassCardVariant = "default" | "elevated" | "neon";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  asChild?: never;
}

const variantClasses: Record<GlassCardVariant, string> = {
  default:
    "bg-[var(--glass-bg)] border-[var(--glass-border)] shadow-[var(--glass-shadow)] hover:border-emerald-500/40 hover:shadow-[0_20px_48px_rgba(16,185,129,0.18)] hover:scale-[1.008]",
  elevated:
    "bg-[var(--glass-bg)] border-emerald-500/35 ring-1 ring-emerald-500/30 shadow-[0_20px_52px_rgba(16,185,129,0.25)] hover:ring-emerald-400/60 hover:shadow-[0_28px_64px_rgba(16,185,129,0.35)] hover:scale-[1.01]",
  neon:
    "bg-[var(--glass-bg)] border-[var(--cyan-accent)]/40 ring-1 ring-[var(--cyan-accent)]/30 shadow-[0_0_30px_rgba(0,245,160,0.2)] hover:shadow-[0_0_45px_rgba(0,245,160,0.4)] hover:scale-[1.01]",
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard({ className, variant = "default", ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "backdrop-blur-xl rounded-2xl border transition-all duration-300 ease-out",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
