"use client";

import * as React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bitcoin,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileCheck,
  Lock,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminAuthorizePayment,
  adminHoldPayment,
  adminReleaseHold,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
  getAdminPaymentsData,
  type AdminContractEscrow,
  type AdminMilestoneEscrowItem,
  type AdminPaymentsOverview,
  type AdminPaymentTransaction,
  type AdminPendingWithdrawal,
} from "@/app/actions/admin-payments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime, formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

const BTC_PRICE_USD = 67500;
const PAGE_SIZE = 10;

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatBtc(usd: number): string {
  if (!usd) return "0.00000000 BTC";
  return `${(usd / BTC_PRICE_USD).toFixed(6)} BTC`;
}

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

export default function AdminPaymentsPage() {
  const [data, setData] = React.useState<AdminPaymentsOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"escrows" | "withdrawals" | "transactions">("escrows");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [txPage, setTxPage] = React.useState(1);
  const [escrowPage, setEscrowPage] = React.useState(1);
  const [selectedTx, setSelectedTx] = React.useState<AdminPaymentTransaction | null>(null);

  // Authorization modal state
  const [authorizingMilestone, setAuthorizingMilestone] = React.useState<{
    contractId: string;
    contractTitle: string;
    milestone: AdminMilestoneEscrowItem;
  } | null>(null);
  const [authNote, setAuthNote] = React.useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = React.useState(false);

  // Hold modal state
  const [holdingMilestone, setHoldingMilestone] = React.useState<{
    contractId: string;
    contractTitle: string;
    milestone: AdminMilestoneEscrowItem;
  } | null>(null);
  const [holdReason, setHoldReason] = React.useState("");
  const [isSubmittingHold, setIsSubmittingHold] = React.useState(false);

  // Reject withdrawal modal state
  const [rejectingWd, setRejectingWd] = React.useState<AdminPendingWithdrawal | null>(null);
  const [wdRejectReason, setWdRejectReason] = React.useState("");
  const [isSubmittingWdReject, setIsSubmittingWdReject] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const overview = await getAdminPaymentsData();
      setData(overview);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load payment overview.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    setTxPage(1);
    setEscrowPage(1);
  }, [search, typeFilter, activeTab]);

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

  const totalTxPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const pagedTransactions = React.useMemo(
    () => filteredTransactions.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE),
    [filteredTransactions, txPage]
  );

  const filteredEscrows = React.useMemo(() => {
    if (!data) return [];
    const needle = search.toLowerCase().trim();
    return data.activeEscrows.filter((e) => {
      return (
        !needle ||
        e.title.toLowerCase().includes(needle) ||
        e.clientName.toLowerCase().includes(needle) ||
        e.freelancerName.toLowerCase().includes(needle)
      );
    });
  }, [data, search]);

  const totalEscrowPages = Math.max(1, Math.ceil(filteredEscrows.length / PAGE_SIZE));
  const pagedEscrows = React.useMemo(
    () => filteredEscrows.slice((escrowPage - 1) * PAGE_SIZE, escrowPage * PAGE_SIZE),
    [filteredEscrows, escrowPage]
  );

  // Authorize payment to go forward
  async function handleConfirmAuthorize() {
    if (!authorizingMilestone) return;
    setIsSubmittingAuth(true);
    try {
      const res = await adminAuthorizePayment(
        authorizingMilestone.contractId,
        authorizingMilestone.milestone.id,
        authNote
      );
      toast.success(
        `Payment authorized & sent forward! Tx: ${res.txHash.slice(0, 10)}...`
      );
      setAuthorizingMilestone(null);
      setAuthNote("");
      void loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to authorize payment.");
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  // Put payment on admin hold
  async function handleConfirmHold() {
    if (!holdingMilestone) return;
    if (holdReason.trim().length < 4) {
      toast.error("Please enter a reason for the payment hold.");
      return;
    }
    setIsSubmittingHold(true);
    try {
      await adminHoldPayment(
        holdingMilestone.contractId,
        holdingMilestone.milestone.id,
        holdReason
      );
      toast.success("Payment placed on Admin Hold.");
      setHoldingMilestone(null);
      setHoldReason("");
      void loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place payment on hold.");
    } finally {
      setIsSubmittingHold(false);
    }
  }

  // Release admin hold
  async function handleReleaseHold(contractId: string, milestoneId: string) {
    try {
      await adminReleaseHold(contractId, milestoneId);
      toast.success("Admin hold released. Payment can now proceed.");
      void loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to release hold.");
    }
  }

  // Approve withdrawal
  async function handleApproveWithdrawal(id: string) {
    try {
      await adminApproveWithdrawal(id);
      toast.success("Withdrawal approved & funds sent forward.");
      void loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve withdrawal.");
    }
  }

  // Reject withdrawal
  async function handleConfirmRejectWithdrawal() {
    if (!rejectingWd) return;
    setIsSubmittingWdReject(true);
    try {
      await adminRejectWithdrawal(rejectingWd.id, wdRejectReason);
      toast.success("Withdrawal declined.");
      setRejectingWd(null);
      setWdRejectReason("");
      void loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject withdrawal.");
    } finally {
      setIsSubmittingWdReject(false);
    }
  }

  function exportCsv() {
    if (!data || data.transactions.length === 0) {
      toast.error("No transactions to export.");
      return;
    }
    const headers = ["Transaction ID", "Contract Title", "Type", "Client", "Freelancer", "Amount (USD)", "Tx Hash", "Date"];
    const rows = data.transactions.map((tx) => [
      tx.id,
      `"${tx.contractTitle.replace(/"/g, '""')}"`,
      tx.type,
      `"${tx.clientName.replace(/"/g, '""')}"`,
      `"${tx.freelancerName.replace(/"/g, '""')}"`,
      tx.amount,
      tx.mockHash,
      new Date(tx.createdAt).toISOString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chainwork-transactions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transaction report exported to CSV.");
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard.`);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              <CreditCard className="size-7 text-[color:var(--azure-500)]" />
              Payments & Escrow Authority
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              <ShieldAlert className="size-3" />
              Admin Authority Active
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-foreground/60">
            Platform control center: review Bitcoin and USD escrows, authorize when payments should go forward, or place payments on hold.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadData()}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={loading || !data || data.transactions.length === 0}
            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="space-y-2.5 p-5 border-emerald-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Volume</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="size-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums">
              <GradientText>{formatUsd(data?.totalVolume ?? 0)}</GradientText>
            </div>
          )}
          <div className="text-[11px] text-foreground/60 font-mono">
            ≈ {formatBtc(data?.totalVolume ?? 0)}
          </div>
        </GlassCard>

        <GlassCard className="space-y-2.5 p-5 border-sky-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Active Escrows Locked</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
              <Lock className="size-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
              {formatUsd(data?.escrowBalance ?? 0)}
            </div>
          )}
          <div className="text-[11px] text-foreground/60 font-mono">
            ≈ {formatBtc(data?.escrowBalance ?? 0)} · {data?.activeEscrows.length ?? 0} active
          </div>
        </GlassCard>

        <GlassCard className="space-y-2.5 p-5 border-teal-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Released to Freelancers</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-teal-500/10 text-teal-500">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
              {formatUsd(data?.releasedAmount ?? 0)}
            </div>
          )}
          <div className="text-[11px] text-foreground/60 font-mono">
            ≈ {formatBtc(data?.releasedAmount ?? 0)}
          </div>
        </GlassCard>

        <GlassCard className="space-y-2.5 p-5 border-amber-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Payment Authority Alerts</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <ShieldAlert className="size-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {data?.pendingAuthorizationsCount ?? 0}
              </div>
              <span className="text-xs text-foreground/60 font-medium">Ready</span>
              <span className="text-foreground/30">/</span>
              <div className="text-2xl font-bold tabular-nums text-red-500">
                {data?.heldPaymentsCount ?? 0}
              </div>
              <span className="text-xs text-foreground/60 font-medium">On Hold</span>
            </div>
          )}
          <div className="text-[11px] text-foreground/60">
            {data?.pendingWithdrawals.length ?? 0} withdrawal(s) pending clearance
          </div>
        </GlassCard>
      </div>

      {/* Filter and Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <TabsTrigger value="escrows" className="gap-1.5 text-xs font-semibold">
              <Lock className="size-3.5 text-sky-500" />
              Payment Authority & Escrows ({data?.activeEscrows.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-1.5 text-xs font-semibold">
              <ArrowDownLeft className="size-3.5 text-amber-500" />
              Pending Withdrawals ({data?.pendingWithdrawals.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1.5 text-xs font-semibold">
              <Wallet className="size-3.5 text-emerald-500" />
              Transactions ({filteredTransactions.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem]">
            <Search className="absolute left-2.5 top-2.5 size-4 text-foreground/50" />
            <Input
              placeholder="Search contract, user, or hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {activeTab === "transactions" && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[11rem] text-xs">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All transaction types</SelectItem>
                <SelectItem value="escrow_fund">Escrow Deposits</SelectItem>
                <SelectItem value="milestone_release">Milestone Releases</SelectItem>
                <SelectItem value="refund">Escrow Refunds</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : activeTab === "escrows" ? (
        /* TAB 1: Payment Authority & Contract Escrows */
        filteredEscrows.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center p-12 text-center text-sm text-foreground/60">
            <Lock className="size-10 text-foreground/30 mb-2" />
            <p className="font-semibold text-foreground/80">No active contract escrows</p>
            <p className="text-xs text-foreground/60 mt-1">Contracts funded by clients will appear here for review & authorization.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {pagedEscrows.map((escrow) => (
              <GlassCard key={escrow.id} className="p-5 space-y-4 border border-[var(--glass-border)]">
                {/* Contract Summary Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--glass-border)] pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-foreground">{escrow.title}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                        <Lock className="size-2.5" />
                        {escrow.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-foreground/60">
                      <span>Client: <strong className="text-foreground">{escrow.clientName}</strong></span>
                      <span>•</span>
                      <span>Freelancer: <strong className="text-foreground">{escrow.freelancerName}</strong></span>
                      <span>•</span>
                      <span>Created: {formatDateTime(escrow.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm sm:text-base font-extrabold font-mono text-sky-600 dark:text-sky-400">
                      {formatUsd(escrow.totalAmount)}
                    </div>
                    <div className="text-[11px] font-mono text-amber-500 flex items-center justify-end gap-1 font-semibold">
                      <Bitcoin className="size-3" />
                      {formatBtc(escrow.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Milestones & Admin Authority Actions */}
                <div className="space-y-2">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-foreground/50">
                    Contract Milestones & Payment Authority Controls ({escrow.milestones.length})
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {escrow.milestones.map((m, idx) => (
                      <div
                        key={m.id}
                        className={cn(
                          "rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors",
                          m.adminHold
                            ? "border-red-500/50 bg-red-500/10"
                            : m.status === "completed"
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : m.status === "delivered"
                                ? "border-amber-500/40 bg-amber-500/10"
                                : "border-[var(--glass-border)] bg-background/50"
                        )}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-foreground">
                              #{idx + 1}: {m.description}
                            </span>

                            {/* Milestone Status Badges */}
                            {m.status === "completed" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                                <CheckCircle className="size-3" /> Paid & Completed
                              </span>
                            )}

                            {m.status === "delivered" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/25 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold animate-pulse">
                                <Clock className="size-3" /> Work Delivered (Ready for Payment)
                              </span>
                            )}

                            {m.status === "pending" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 text-foreground/60 px-2 py-0.5 text-[10px]">
                                In Progress
                              </span>
                            )}

                            {/* Admin Hold Badge */}
                            {m.adminHold && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 text-[10px] font-bold">
                                <Pause className="size-3" /> Held by Admin
                              </span>
                            )}

                            {/* Admin Cleared Badge */}
                            {m.adminCleared && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 px-2 py-0.5 text-[10px] font-semibold">
                                <Zap className="size-3" /> Admin Authorized
                              </span>
                            )}
                          </div>

                          {/* Reason or Authorization Details */}
                          {m.adminHold && m.adminHoldReason && (
                            <div className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                              ⚠️ Hold Reason: {m.adminHoldReason}
                            </div>
                          )}

                          {m.adminAuthorizedByName && (
                            <div className="text-[10px] text-foreground/50">
                              Authorized by {m.adminAuthorizedByName}
                            </div>
                          )}
                        </div>

                        {/* Amount & Admin Authority Controls */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="font-mono font-bold text-foreground">
                              {formatUsd(m.amount)}
                            </div>
                            <div className="font-mono text-[10px] text-amber-500 font-medium">
                              ≈ {formatBtc(m.amount)}
                            </div>
                          </div>

                          {/* Admin Authority Buttons */}
                          <div className="flex items-center gap-1.5">
                            {m.status !== "completed" ? (
                              <>
                                {/* Release / Push Forward button */}
                                <Button
                                  type="button"
                                  size="xs"
                                  onClick={() =>
                                    setAuthorizingMilestone({
                                      contractId: escrow.id,
                                      contractTitle: escrow.title,
                                      milestone: m,
                                    })
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] gap-1 shadow-sm"
                                >
                                  <Play className="size-3 fill-current" />
                                  Authorize & Go Forward
                                </Button>

                                {/* Hold / Pause button */}
                                {!m.adminHold ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() =>
                                      setHoldingMilestone({
                                        contractId: escrow.id,
                                        contractTitle: escrow.title,
                                        milestone: m,
                                      })
                                    }
                                    className="border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-[11px] font-semibold gap-1"
                                  >
                                    <Pause className="size-3" />
                                    Hold
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleReleaseHold(escrow.id, m.id)}
                                    className="border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 text-[11px] font-semibold gap-1"
                                  >
                                    <Play className="size-3" />
                                    Clear Hold
                                  </Button>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle className="size-3.5" /> Settled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}

            <Pagination
              currentPage={escrowPage}
              totalPages={totalEscrowPages}
              onPageChange={setEscrowPage}
              totalItems={filteredEscrows.length}
              pageSize={PAGE_SIZE}
            />
          </div>
        )
      ) : activeTab === "withdrawals" ? (
        /* TAB 2: Pending Withdrawals Authority Queue */
        !data?.pendingWithdrawals || data.pendingWithdrawals.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center p-12 text-center text-sm text-foreground/60">
            <CheckCircle className="size-10 text-emerald-500/50 mb-2" />
            <p className="font-semibold text-foreground/80">No pending withdrawals</p>
            <p className="text-xs text-foreground/60 mt-1">All user payouts and withdrawals have been cleared and processed.</p>
          </GlassCard>
        ) : (
          <GlassCard className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount (USD)</TableHead>
                  <TableHead>Bitcoin Equivalent</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead className="text-right">Admin Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pendingWithdrawals.map((wd) => (
                  <TableRow key={wd.id}>
                    <TableCell className="font-medium text-xs">
                      {wd.userName}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {formatUsd(wd.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-amber-500 font-semibold">
                      {formatBtc(wd.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground/60">
                      {formatUsd(wd.feeAmount)}
                    </TableCell>
                    <TableCell className="text-xs text-foreground/80">
                      {wd.paymentMethod}
                    </TableCell>
                    <TableCell className="text-xs text-foreground/60">
                      {formatRelativeTime(wd.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="xs"
                          onClick={() => handleApproveWithdrawal(wd.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] gap-1"
                        >
                          <CheckCircle className="size-3" />
                          Approve Payout
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => setRejectingWd(wd)}
                          className="border-red-500/40 text-red-600 hover:bg-red-500/10 text-[11px]"
                        >
                          <XCircle className="size-3" />
                          Decline
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        )
      ) : (
        /* TAB 3: Transactions History & Receipts */
        filteredTransactions.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center p-12 text-center text-sm text-foreground/60">
            <CreditCard className="size-10 text-foreground/30 mb-2" />
            <p className="font-semibold text-foreground/80">No transaction records found</p>
            <p className="text-xs text-foreground/60 mt-1">
              {search || typeFilter !== "all" ? "Try clearing search filters." : "Transactions will appear as contract milestones are funded and released."}
            </p>
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
                    <TableHead>Bitcoin Eq.</TableHead>
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
                          <div className="font-medium text-xs max-w-[180px] truncate" title={tx.contractTitle}>
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
                            <span className="truncate max-w-[90px]">{tx.clientName}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Avatar className="size-5">
                              <AvatarFallback className="bg-emerald-500/20 text-[9px] text-emerald-700 dark:text-emerald-300">
                                {initials(tx.freelancerName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[90px]">{tx.freelancerName}</span>
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-xs font-bold text-foreground/90">
                          {formatUsd(tx.amount)}
                        </TableCell>

                        <TableCell className="font-mono text-[10px] text-amber-500 font-semibold">
                          {formatBtc(tx.amount)}
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
              currentPage={txPage}
              totalPages={totalTxPages}
              onPageChange={setTxPage}
              totalItems={filteredTransactions.length}
              pageSize={PAGE_SIZE}
            />
          </div>
        )
      )}

      {/* MODAL 1: Authorize Payment to Go Forward */}
      <Dialog
        open={!!authorizingMilestone}
        onOpenChange={(o) => (!o ? setAuthorizingMilestone(null) : null)}
      >
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Zap className="size-5" />
              Authorize Payment to Go Forward
            </DialogTitle>
            <DialogDescription className="text-xs">
              As an administrator, you have full authority to clear and push this milestone payment forward to the freelancer.
            </DialogDescription>
          </DialogHeader>

          {authorizingMilestone && (
            <div className="space-y-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-xs">
              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Contract</span>
                <span className="font-semibold text-foreground truncate max-w-[220px]">
                  {authorizingMilestone.contractTitle}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Milestone</span>
                <span className="font-medium text-foreground">
                  {authorizingMilestone.milestone.description}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Payout Amount</span>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {formatUsd(authorizingMilestone.milestone.amount)}
                  </div>
                  <div className="font-mono text-[10px] text-amber-500 font-semibold">
                    ≈ {formatBtc(authorizingMilestone.milestone.amount)}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold uppercase text-foreground/60">
                  Authorization Note (Optional)
                </label>
                <Input
                  placeholder="e.g. Verified deliverables & approved for payout"
                  value={authNote}
                  onChange={(e) => setAuthNote(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAuthorizingMilestone(null)}
              disabled={isSubmittingAuth}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmAuthorize}
              disabled={isSubmittingAuth}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
            >
              {isSubmittingAuth ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" /> Authorizing…
                </>
              ) : (
                <>
                  <Play className="size-3.5 fill-current" /> Confirm & Push Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Place Payment on Hold */}
      <Dialog
        open={!!holdingMilestone}
        onOpenChange={(o) => (!o ? setHoldingMilestone(null) : null)}
      >
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Pause className="size-5" />
              Place Payment on Admin Hold
            </DialogTitle>
            <DialogDescription className="text-xs">
              Temporarily freeze this milestone payout. Neither client nor auto-release can release the funds until you clear this hold.
            </DialogDescription>
          </DialogHeader>

          {holdingMilestone && (
            <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs">
              <div className="flex justify-between items-center border-b border-red-500/20 pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Milestone</span>
                <span className="font-semibold text-foreground">
                  {holdingMilestone.milestone.description} ({formatUsd(holdingMilestone.milestone.amount)})
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold uppercase text-foreground/70">
                  Reason for Hold (Required)
                </label>
                <Textarea
                  placeholder="e.g. Deliverable verification required / Fraud safety check"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHoldingMilestone(null)}
              disabled={isSubmittingHold}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleConfirmHold}
              disabled={isSubmittingHold || holdReason.trim().length < 4}
              className="font-bold gap-1.5"
            >
              {isSubmittingHold ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" /> Holding…
                </>
              ) : (
                <>
                  <Pause className="size-3.5" /> Place on Hold
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Decline Withdrawal Dialog */}
      <Dialog
        open={!!rejectingWd}
        onOpenChange={(o) => (!o ? setRejectingWd(null) : null)}
      >
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="size-5" />
              Decline Withdrawal Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Specify the reason for declining this withdrawal payout.
            </DialogDescription>
          </DialogHeader>

          {rejectingWd && (
            <div className="space-y-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-xs">
              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">User</span>
                <span className="font-semibold text-foreground">{rejectingWd.userName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                <span className="text-foreground/60 uppercase font-semibold text-[10px]">Amount</span>
                <span className="font-mono font-bold text-foreground">{formatUsd(rejectingWd.amount)}</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold uppercase text-foreground/70">
                  Decline Reason
                </label>
                <Input
                  placeholder="e.g. Account verification required"
                  value={wdRejectReason}
                  onChange={(e) => setWdRejectReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectingWd(null)}
              disabled={isSubmittingWdReject}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmRejectWithdrawal}
              disabled={isSubmittingWdReject}
              className="font-bold gap-1.5"
            >
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Transaction Verification Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(o) => (!o ? setSelectedTx(null) : null)}>
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <FileCheck className="size-5" />
              Transaction Verification Detail
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
                <div className="text-right">
                  <div className="font-mono font-bold text-sm">{formatUsd(selectedTx.amount)}</div>
                  <div className="font-mono text-[10px] text-amber-500 font-semibold">{formatBtc(selectedTx.amount)}</div>
                </div>
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
