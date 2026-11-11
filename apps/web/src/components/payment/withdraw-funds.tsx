"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Loader2,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { AzureButton } from "@/components/ui/azure-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMyPaymentsOverview } from "@/app/actions/payments";
import {
  DEFAULT_WITHDRAWAL_LIMITS,
  getWithdrawalFee,
} from "@/lib/payment/withdrawal-limits";
import type { WalletTransaction, PaymentsStats } from "@/lib/payment/balance";

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_META: Record<
  string,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: "Pending approval", className: "text-amber-500", Icon: Clock },
  completed: { label: "Paid out", className: "text-emerald-500", Icon: CheckCircle },
  cancelled: { label: "Rejected", className: "text-red-500", Icon: XCircle },
  failed: { label: "Failed", className: "text-red-500", Icon: XCircle },
};

export function WithdrawFunds({ role }: { role: "freelancer" | "client" }) {
  const router = useRouter();
  const [stats, setStats] = React.useState<PaymentsStats | null>(null);
  const [withdrawalRows, setWithdrawalRows] = React.useState<WalletTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("stripe");
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyPaymentsOverview();
      setStats(data.stats);
      setWithdrawalRows(data.transactions.filter((t) => t.type === "withdrawal"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load balance.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const numericAmount = parseFloat(amount) || 0;
  const fee = numericAmount > 0 ? getWithdrawalFee(numericAmount) : 0;
  const available = stats?.availableBalance ?? 0;

  async function handleWithdraw() {
    if (numericAmount < DEFAULT_WITHDRAWAL_LIMITS.minAmount) {
      toast.error(`Minimum withdrawal is ${formatUsd(DEFAULT_WITHDRAWAL_LIMITS.minAmount)}.`);
      return;
    }
    if (numericAmount > available) {
      toast.error(`Insufficient balance. Maximum available: ${formatUsd(available)}.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount, paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Withdrawal request failed.");
      }
      toast.success(
        `Withdrawal of ${formatUsd(numericAmount)} requested (fee ${formatUsd(
          data.fee
        )}). It will be paid out once an admin approves it.`
      );
      setAmount("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/${role}/payments`)}
        className="inline-flex items-center gap-1 font-bold text-xs"
      >
        <ArrowLeft className="size-4" />
        Back to {role === "freelancer" ? "Earnings" : "Payments"}
      </Button>

      <div>
        <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Wallet className="size-7 text-emerald-500" />
          Withdraw Funds
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          {role === "freelancer"
            ? "Withdraw your released milestone earnings. Requests are reviewed by an administrator before payout."
            : "Withdraw your unused wallet balance (deposits and refunds). Requests are reviewed by an administrator before payout."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GlassCard className="p-5 border-emerald-500/30">
          <div className="text-xs uppercase tracking-wider font-semibold text-foreground/60">
            Available for Withdrawal
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 mt-2" />
          ) : (
            <div className="text-2xl font-bold mt-2 tabular-nums">
              <GradientText>{formatUsd(available)}</GradientText>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5 border-amber-500/30">
          <div className="text-xs uppercase tracking-wider font-semibold text-foreground/60">
            {role === "freelancer" ? "Pending in Escrow" : "Requested / In Review"}
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 mt-2" />
          ) : (
            <div className="text-2xl font-bold mt-2 tabular-nums text-amber-600 dark:text-amber-400">
              {formatUsd(
                role === "freelancer"
                  ? stats?.pendingEarningsNet ?? 0
                  : withdrawalRows
                      .filter((w) => w.status === "pending")
                      .reduce((s, w) => s + Math.abs(w.amount), 0)
              )}
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard variant="elevated" className="p-6 space-y-4">
        <div>
          <Label htmlFor="withdraw-amount" className="text-xs font-bold">
            Amount (USD) *
          </Label>
          <Input
            id="withdraw-amount"
            type="number"
            min={DEFAULT_WITHDRAWAL_LIMITS.minAmount}
            max={Math.min(DEFAULT_WITHDRAWAL_LIMITS.maxAmount, available)}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mt-1 text-lg font-bold"
          />
          <div className="mt-1 flex justify-between text-[11px] font-semibold text-foreground/50">
            <span>Min: {formatUsd(DEFAULT_WITHDRAWAL_LIMITS.minAmount)}</span>
            <span>
              Max: {formatUsd(Math.min(DEFAULT_WITHDRAWAL_LIMITS.maxAmount, available))}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold">Payout Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Payout method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stripe">Stripe Connect (bank payout)</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="bank_transfer">Direct bank transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {numericAmount > 0 && (
          <div className="p-3 rounded-lg bg-slate-500/5 border border-[var(--glass-border)]">
            <div className="flex justify-between text-sm">
              <span className="text-foreground/60">Withdrawal fee</span>
              <span className="text-foreground/70">{formatUsd(fee)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-[var(--glass-border)] pt-2 mt-2">
              <span>You&apos;ll receive</span>
              <span className="text-emerald-500">{formatUsd(Math.max(numericAmount - fee, 0))}</span>
            </div>
          </div>
        )}

        <AzureButton
          onClick={handleWithdraw}
          disabled={submitting || loading || numericAmount <= 0 || numericAmount > available}
          size="lg"
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Submitting request...
            </>
          ) : (
            <>
              <ArrowUpRight className="size-4" />
              Request Withdrawal
            </>
          )}
        </AzureButton>
      </GlassCard>

      <div>
        <h2 className="text-lg font-semibold mb-3">Withdrawal History</h2>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : withdrawalRows.length === 0 ? (
          <GlassCard className="p-6 text-center text-sm text-foreground/60">
            No withdrawals yet.
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {withdrawalRows.map((w) => {
              const meta = STATUS_META[w.status] ?? STATUS_META.pending;
              return (
                <GlassCard key={w.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatUsd(Math.abs(w.amount))}
                      {typeof w.feeAmount === "number" && w.feeAmount > 0 && (
                        <span className="ml-2 text-xs text-foreground/50">
                          (fee {formatUsd(w.feeAmount)})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-foreground/50">
                      {new Date(w.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${meta.className}`}>
                    <meta.Icon className="size-3.5" />
                    {meta.label}
                  </span>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
