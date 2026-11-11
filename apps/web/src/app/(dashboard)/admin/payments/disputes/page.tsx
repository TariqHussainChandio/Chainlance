"use client";

import * as React from "react";
import {
  Gavel,
  Download,
  RefreshCw,
  AlertTriangle,
  Lock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import {
  subscribeDisputes,
  type DisputeFilter,
} from "@/lib/firebase/disputes";
import type { SerializedContract } from "@/lib/firebase/schema";
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
import { formatRelativeTime } from "@/lib/format-time";

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminDisputePaymentsPage() {
  const [contracts, setContracts] = React.useState<SerializedContract[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const unsub = subscribeDisputes("all", (rows) => {
      setContracts(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const activeDisputes = React.useMemo(() => {
    return contracts.filter((c) => c.status === "disputed");
  }, [contracts]);

  const totalDisputedEscrow = React.useMemo(() => {
    return activeDisputes.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  }, [activeDisputes]);

  const exportCsv = () => {
    if (contracts.length === 0) {
      toast.error("No dispute payment records to export.");
      return;
    }
    const headers = ["Contract ID", "Title", "Status", "Client", "Freelancer", "Disputed Amount (USD)", "Opened Date"];
    const rows = contracts.map((c) => [
      c.id,
      c.title,
      c.status,
      c.clientName,
      c.freelancerName,
      c.totalAmount,
      c.disputeOpenedAt ? new Date(c.disputeOpenedAt).toISOString() : new Date(c.updatedAt).toISOString(),
    ]);

    const csv = buildCsvString(headers, rows);
    downloadCsv(`chainwork-disputed-payments-${Date.now()}.csv`, csv);
    toast.success("Disputed payments log exported to CSV.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Gavel className="size-7 text-rose-500" />
            Disputed Escrow Payments
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Escrow funds frozen in contract disputes requiring admin adjudication and milestone settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={loading || contracts.length === 0}
            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>

          <Link href="/admin/disputes">
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Dispute Resolution Center
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GlassCard className="p-5 border-rose-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Active Disputed Contracts</span>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <div className="text-2xl font-bold mt-2 tabular-nums text-rose-600 dark:text-rose-400">
              {activeDisputes.length}
            </div>
          )}
          <div className="text-[11px] text-foreground/60 mt-1">Contracts requiring arbitration</div>
        </GlassCard>

        <GlassCard className="p-5 border-amber-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Locked Disputed Escrow</span>
            <Lock className="size-4 text-amber-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 mt-2" />
          ) : (
            <div className="text-2xl font-bold mt-2 tabular-nums text-amber-600 dark:text-amber-400">
              {formatUsd(totalDisputedEscrow)}
            </div>
          )}
          <div className="text-[11px] text-foreground/60 mt-1">Total escrow funds held in dispute</div>
        </GlassCard>

        <GlassCard className="p-5 border-sky-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Historical Disputes</span>
            <Gavel className="size-4 text-sky-500" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <div className="text-2xl font-bold mt-2 tabular-nums">
              <GradientText>{contracts.length}</GradientText>
            </div>
          )}
          <div className="text-[11px] text-foreground/60 mt-1">Active + resolved cases</div>
        </GlassCard>
      </div>

      {/* Disputed Payments Table */}
      <GlassCard className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Disputed Escrow Payment Log
          </h2>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : contracts.length === 0 ? (
          <p className="text-xs text-foreground/60">No payment disputes currently recorded.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--glass-border)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Escrow Value</TableHead>
                  <TableHead>Date Opened</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-semibold max-w-[200px] truncate">{c.title}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${c.status === 'disputed' ? 'bg-rose-500/15 text-rose-600 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{c.clientName}</TableCell>
                    <TableCell className="text-xs">{c.freelancerName}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{formatUsd(c.totalAmount)}</TableCell>
                    <TableCell className="text-xs text-foreground/60">{formatRelativeTime(c.disputeOpenedAt || c.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link href="/admin/disputes">
                        <Button size="xs" variant="outline" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Resolve ↗
                        </Button>
                      </Link>
                    </TableCell>
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
