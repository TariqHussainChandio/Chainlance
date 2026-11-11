"use client";

import * as React from "react";
import {
  CreditCard,
  Download,
  Filter,
  RefreshCw,
  Search,
  Copy,
  FileCheck,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  getAdminPaymentsData,
  type AdminPaymentsOverview,
  type AdminPaymentTransaction,
} from "@/app/actions/admin-payments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime, formatRelativeTime } from "@/lib/format-time";
import { buildCsvString, downloadCsv } from "@/lib/utils/csv-export";
import { cn } from "@/lib/utils";

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAGE_SIZE = 15;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

const TYPE_CHIP: Record<AdminPaymentTransaction["type"], { label: string; class: string }> = {
  escrow_fund: {
    label: "Escrow Deposit",
    class: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  milestone_release: {
    label: "Milestone Release",
    class: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  refund: {
    label: "Escrow Refund",
    class: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
};

export default function AdminTransactionsPage() {
  const [data, setData] = React.useState<AdminPaymentsOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [selectedTx, setSelectedTx] = React.useState<AdminPaymentTransaction | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const overview = await getAdminPaymentsData();
      setData(overview);
    } catch {
      toast.error("Failed to load transactions log.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const filteredTransactions = React.useMemo(() => {
    if (!data) return [];
    const needle = search.toLowerCase().trim();
    return data.transactions.filter((tx) => {
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      const matchesSearch =
        !needle ||
        tx.contractTitle.toLowerCase().includes(needle) ||
        tx.clientName.toLowerCase().includes(needle) ||
        tx.freelancerName.toLowerCase().includes(needle) ||
        tx.mockHash.toLowerCase().includes(needle);
      return matchesType && matchesSearch;
    });
  }, [data, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const pagedTransactions = React.useMemo(
    () => filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredTransactions, page]
  );

  const exportCsv = () => {
    if (!data || filteredTransactions.length === 0) {
      toast.error("No transactions available to export.");
      return;
    }
    const headers = ["Transaction ID", "Contract Title", "Type", "Client", "Freelancer", "Amount (USD)", "Tx Hash", "Date"];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.contractTitle,
      tx.type,
      tx.clientName,
      tx.freelancerName,
      tx.amount,
      tx.mockHash,
      new Date(tx.createdAt).toISOString(),
    ]);

    const csv = buildCsvString(headers, rows);
    downloadCsv(`chainwork-transactions-log-${Date.now()}.csv`, csv);
    toast.success("Transactions log exported to CSV.");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <CreditCard className="size-7 text-[color:var(--azure-500)]" />
            Transactions Audit Log
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Complete cryptographic transaction records, escrow deposits, milestone releases, and refunds.
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
            disabled={loading || filteredTransactions.length === 0}
            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-foreground/50" />
          <Input
            placeholder="Search contract, user, or transaction hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[12rem] text-xs">
            <SelectValue placeholder="All Transaction Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transaction Types</SelectItem>
            <SelectItem value="escrow_fund">Escrow Deposits</SelectItem>
            <SelectItem value="milestone_release">Milestone Releases</SelectItem>
            <SelectItem value="refund">Escrow Refunds</SelectItem>
          </SelectContent>
        </Select>
      </GlassCard>

      {/* Table */}
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : filteredTransactions.length === 0 ? (
        <GlassCard className="p-12 text-center text-sm text-foreground/60">
          No transactions match current filters.
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <GlassCard className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract / Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedTransactions.map((tx) => {
                  const typeMeta = TYPE_CHIP[tx.type];
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="font-medium text-xs max-w-[200px] truncate" title={tx.contractTitle}>
                          {tx.contractTitle}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            typeMeta.class
                          )}
                        >
                          {typeMeta.label}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Avatar className="size-5">
                            <AvatarFallback className="bg-sky-500/20 text-[9px] text-sky-700 dark:text-sky-300">
                              {initials(tx.clientName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[100px]">{tx.clientName}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Avatar className="size-5">
                            <AvatarFallback className="bg-emerald-500/20 text-[9px] text-emerald-700 dark:text-emerald-300">
                              {initials(tx.freelancerName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[100px]">{tx.freelancerName}</span>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-bold text-foreground/90">
                        {formatUsd(tx.amount)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[11px] text-foreground/60">
                            {tx.mockHash.slice(0, 8)}…{tx.mockHash.slice(-6)}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(tx.mockHash, "Transaction hash")}
                            className="text-foreground/40 hover:text-foreground p-0.5 transition-colors"
                            title="Copy hash"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-foreground/60">
                        {formatRelativeTime(tx.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedTx(tx)}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        >
                          Verify ↗
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </GlassCard>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredTransactions.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {/* Transaction Verification Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(o) => (!o ? setSelectedTx(null) : null)}>
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <FileCheck className="size-5" />
              Transaction Receipt Detail
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cryptographic escrow receipt and mock smart contract verification log.
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-xs">
              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Type</span>
                <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">{selectedTx.type}</span>
              </div>

              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Amount</span>
                <span className="font-mono font-bold text-sm">{formatUsd(selectedTx.amount)}</span>
              </div>

              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Contract</span>
                <span className="font-medium truncate max-w-[200px]">{selectedTx.contractTitle}</span>
              </div>

              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Client</span>
                <span className="font-medium">{selectedTx.clientName}</span>
              </div>

              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Freelancer</span>
                <span className="font-medium">{selectedTx.freelancerName}</span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Mock Tx Hash (Sepolia Testnet)</span>
                <div className="flex items-center justify-between rounded-lg bg-background p-2 font-mono text-[11px] border">
                  <span className="truncate mr-2">{selectedTx.mockHash}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedTx.mockHash, "Tx Hash")}
                    className="text-emerald-500 font-bold hover:underline shrink-0 text-[10px]"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                <CheckCircle className="size-3.5" />
                <span>Simulated Blockchain State: Confirmed on Sepolia Mock Escrow</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
