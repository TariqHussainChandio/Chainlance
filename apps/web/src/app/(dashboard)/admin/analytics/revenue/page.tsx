"use client";

import * as React from "react";
import {
  TrendingUp,
  Wallet,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  RefreshCw,
  DollarSign,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";

import {
  getAdminPaymentsData,
  type AdminPaymentsOverview,
} from "@/app/actions/admin-payments";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildCsvString, downloadCsv } from "@/lib/utils/csv-export";
import { formatDateTime } from "@/lib/format-time";
import {
  PLATFORM_FEE_PERCENTAGE,
  CLIENT_FEE_PERCENTAGE,
  FREELANCER_FEE_PERCENTAGE,
} from "@/lib/payment/platform-fees";

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RevenuePage() {
  const [data, setData] = React.useState<AdminPaymentsOverview | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const overview = await getAdminPaymentsData();
      setData(overview);
    } catch {
      toast.error("Failed to load revenue analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const exportCsv = () => {
    if (!data) {
      toast.error("No revenue data to export.");
      return;
    }
    const headers = ["Financial Metric", "Amount (USD)", "Description"];
    const rows = [
      ["Total Volume Processed", data.totalVolume, "Lifetime total across all contract transactions"],
      ["Active Escrow Balance", data.escrowBalance, "Current funds locked in active contract escrows"],
      ["Milestone Released Payouts", data.releasedAmount, "Total funds disbursed to freelancers"],
      ["Escrow Refunds", data.refundedAmount, "Total funds returned to clients"],
      ["Platform Fee Model", PLATFORM_FEE_PERCENTAGE, `${(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}% combined fee (${(CLIENT_FEE_PERCENTAGE * 100).toFixed(0)}% client + ${(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}% freelancer)`],
    ];

    data.transactions.forEach((tx) => {
      rows.push([`Transaction: ${tx.contractTitle}`, tx.amount, `Type: ${tx.type} | Client: ${tx.clientName} | Freelancer: ${tx.freelancerName}`]);
    });

    const csv = buildCsvString(headers, rows);
    downloadCsv(`chainwork-revenue-analytics-${Date.now()}.csv`, csv);
    toast.success("Revenue analytics exported to CSV.");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <TrendingUp className="size-7 text-emerald-500" />
            Revenue & Volume Analytics
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Platform gross volume, active escrow balances, milestone payout releases, and fee tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={loading || !data}
            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="space-y-3 p-5 border-emerald-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Gross Volume</span>
            <Wallet className="size-4 text-emerald-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums">
              <GradientText>{formatUsd(data?.totalVolume ?? 0)}</GradientText>
            </div>
          )}
          <div className="text-[11px] text-foreground/60">Across all processed contracts</div>
        </GlassCard>

        <GlassCard className="space-y-3 p-5 border-sky-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Active Escrow Balance</span>
            <Lock className="size-4 text-sky-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
              {formatUsd(data?.escrowBalance ?? 0)}
            </div>
          )}
          <div className="text-[11px] text-foreground/60">{data?.activeEscrows.length ?? 0} active contracts locked</div>
        </GlassCard>

        <GlassCard className="space-y-3 p-5 border-teal-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Released Payouts</span>
            <ArrowUpRight className="size-4 text-teal-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
              {formatUsd(data?.releasedAmount ?? 0)}
            </div>
          )}
          <div className="text-[11px] text-foreground/60">Disbursed to freelancers</div>
        </GlassCard>

        <GlassCard className="space-y-3 p-5 border-amber-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Escrow Refunds</span>
            <ArrowDownLeft className="size-4 text-amber-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {formatUsd(data?.refundedAmount ?? 0)}
            </div>
          )}
          <div className="text-[11px] text-foreground/60">Returned to clients</div>
        </GlassCard>
      </div>

      {/* Fee Structure Information */}
      <GlassCard className="p-5 border-emerald-500/30 bg-emerald-500/5 space-y-2">
        <div className="flex items-center gap-2">
          <DollarSign className="size-5 text-emerald-500" />
          <h2 className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
            Platform Fee Structure ({(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%)
          </h2>
        </div>
        <p className="text-xs text-foreground/70">
          ChainWork charges a {(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}% combined platform fee ({(CLIENT_FEE_PERCENTAGE * 100).toFixed(0)}% service fee from clients, {(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}% from freelancers). Escrow milestone payments are released to freelancers upon client approval.
        </p>
      </GlassCard>

      {/* Recent High-Volume Transactions */}
      <GlassCard className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Recent Financial Volume Audit
          </h2>
          <span className="text-xs text-foreground/50">{data?.transactions.length ?? 0} transactions</span>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data || data.transactions.length === 0 ? (
          <p className="text-xs text-foreground/60">No financial transactions recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--glass-border)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.slice(0, 15).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs font-medium max-w-[200px] truncate">{tx.contractTitle}</TableCell>
                    <TableCell className="text-[11px] font-semibold uppercase text-sky-500">{tx.type}</TableCell>
                    <TableCell className="text-xs">{tx.clientName}</TableCell>
                    <TableCell className="text-xs">{tx.freelancerName}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatUsd(tx.amount)}</TableCell>
                    <TableCell className="text-xs text-foreground/60">{formatDateTime(tx.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
