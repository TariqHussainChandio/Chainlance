"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import {
  CLIENT_FEE_PERCENTAGE,
  FREELANCER_FEE_PERCENTAGE,
  calculateTransactionFee,
} from "@/lib/payment/platform-fees";
import { cn } from "@/lib/utils";

interface FeeDisplayProps {
  amount: number;
  role?: "client" | "freelancer" | "both";
  showBreakdown?: boolean;
  className?: string;
  compact?: boolean;
  variant?: "default" | "elevated";
}

export function FeeDisplay({
  amount,
  role = "both",
  showBreakdown = true,
  className,
  compact = false,
  variant = "default",
}: FeeDisplayProps) {
  const fees = calculateTransactionFee(amount);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        {role === "client" ? (
          <>
            <span className="text-foreground/60">Service Fee ({CLIENT_FEE_PERCENTAGE * 100}%):</span>
            <span className="font-mono text-emerald-500">+${fees.clientFee.toFixed(2)}</span>
          </>
        ) : role === "freelancer" ? (
          <>
            <span className="text-foreground/60">Platform Fee ({FREELANCER_FEE_PERCENTAGE * 100}%):</span>
            <span className="font-mono text-red-500">-${fees.freelancerFee.toFixed(2)}</span>
          </>
        ) : (
          <>
            <span className="text-foreground/60">Platform Fees:</span>
            <span className="font-mono">${fees.platformFee.toFixed(2)}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <GlassCard variant={variant} className={cn("p-4 space-y-2", className)}>
      <div className="flex justify-between text-sm font-medium">
        <span className="text-foreground/60">Base Order Subtotal</span>
        <span className="font-semibold">${amount.toFixed(2)}</span>
      </div>

      {showBreakdown && amount > 0 && (
        <>
          {(role === "client" || role === "both") && (
            <div className="flex justify-between text-xs text-foreground/75 border-t border-[var(--glass-border)] pt-2">
              <span>Client Service Fee ({CLIENT_FEE_PERCENTAGE * 100}%)</span>
              <span className="font-semibold text-emerald-500">+${fees.clientFee.toFixed(2)}</span>
            </div>
          )}

          {(role === "freelancer" || role === "both") && (
            <div className="flex justify-between text-xs text-foreground/75 border-t border-[var(--glass-border)] pt-1">
              <span>Freelancer Service Fee ({FREELANCER_FEE_PERCENTAGE * 100}%)</span>
              <span className="font-semibold text-amber-500">-${fees.freelancerFee.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold pt-2 border-t border-[var(--glass-border)]">
            <span className="text-foreground/80">
              {role === "client"
                ? "Total Charged to Client"
                : role === "freelancer"
                ? "Net Freelancer Earnings"
                : "Net Freelancer Payout"}
            </span>
            <span className="text-emerald-500">
              <GradientText>
                $
                {role === "client"
                  ? fees.clientTotal.toFixed(2)
                  : fees.freelancerEarnings.toFixed(2)}
              </GradientText>
            </span>
          </div>
        </>
      )}
    </GlassCard>
  );
}