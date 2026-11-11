"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bitcoin,
  Check,
  CheckCircle,
  Clock,
  Coins,
  Copy,
  CreditCard,
  FileText,
  Lock,
  Pause,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  getFreelancerInvoices,
  type FreelancerInvoicesOverview,
  type InvoiceItem,
} from "@/app/actions/invoices";
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
import { formatDateShort } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { BitcoinQrCode } from "@/components/payment/bitcoin-qr-code";

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

const PAGE_SIZE = 8;

const STATUS_CHIPS: Record<
  InvoiceItem["status"],
  { label: string; class: string; icon: React.ComponentType<{ className?: string }> }
> = {
  paid: {
    label: "Paid & Settled",
    class: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: CheckCircle,
  },
  ready_for_release: {
    label: "Work Delivered (Ready for Payment)",
    class: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    icon: Clock,
  },
  held: {
    label: "On Admin Hold",
    class: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    icon: Pause,
  },
  in_progress: {
    label: "In Progress",
    class: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    icon: Lock,
  },
};

export default function FreelancerInvoicesPage() {
  const [data, setData] = React.useState<FreelancerInvoicesOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceItem | null>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedAddr, setCopiedAddr] = React.useState(false);

  const loadInvoices = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFreelancerInvoices();
      setData(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredInvoices = React.useMemo(() => {
    if (!data) return [];
    const needle = search.toLowerCase().trim();
    return data.invoices.filter((inv) => {
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      const matchesSearch =
        !needle ||
        inv.invoiceNumber.toLowerCase().includes(needle) ||
        inv.clientName.toLowerCase().includes(needle) ||
        inv.contractTitle.toLowerCase().includes(needle) ||
        inv.milestoneDescription.toLowerCase().includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const pagedInvoices = React.useMemo(
    () => filteredInvoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredInvoices, page]
  );

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  }

  function handlePrintInvoice() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              <CreditCard className="size-7 text-emerald-500" />
              Bitcoin & Escrow Invoicing
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Bitcoin className="size-3" />
              BIP-21 Ready
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-foreground/60">
            Generate and manage crypto-denominated invoices with real-time Bitcoin conversion, QR codes, and smart contract escrow settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadInvoices()}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Sync Invoices
          </Button>
        </div>
      </div>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="space-y-2.5 p-5 border-emerald-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Invoiced</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <FileText className="size-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums">
              <GradientText>{formatUsd(data?.totalInvoicedUsd ?? 0)}</GradientText>
            </div>
          )}
          <div className="text-[11px] text-foreground/60 font-mono">
            ≈ {data?.totalInvoicedBtc ?? 0} BTC
          </div>
        </GlassCard>

        <GlassCard className="space-y-2.5 p-5 border-teal-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Settled & Paid</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-teal-500/10 text-teal-500">
              <CheckCircle className="size-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
              {formatUsd(data?.paidUsd ?? 0)}
            </div>
          )}
          <div className="text-[11px] text-foreground/60 font-mono">
            ≈ {data?.paidBtc ?? 0} BTC released to wallet
          </div>
        </GlassCard>

        <GlassCard className="space-y-2.5 p-5 border-sky-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Locked in Escrow</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
              <Lock className="size-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
              {formatUsd(data?.pendingEscrowUsd ?? 0)}
            </div>
          )}
          <div className="text-[11px] text-foreground/60 font-mono">
            ≈ {data?.pendingEscrowBtc ?? 0} BTC awaiting milestone release
          </div>
        </GlassCard>

        <GlassCard className="space-y-2.5 p-5 border-amber-500/30">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs uppercase tracking-wider font-semibold">Admin Hold Status</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Pause className="size-4" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tabular-nums text-red-500">
              {formatUsd(data?.heldUsd ?? 0)}
            </div>
          )}
          <div className="text-[11px] text-foreground/60">
            {data?.heldUsd ? "Under admin security review" : "No active holds on your funds"}
          </div>
        </GlassCard>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[15rem]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-foreground/50" />
          <Input
            placeholder="Search invoice #, client, or contract..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[12rem] text-xs">
            <SelectValue placeholder="All invoices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="paid">Paid & Settled</SelectItem>
            <SelectItem value="ready_for_release">Ready for Release</SelectItem>
            <SelectItem value="held">On Admin Hold</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Table */}
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : filteredInvoices.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center p-12 text-center text-sm text-foreground/60">
          <FileText className="size-10 text-foreground/30 mb-2" />
          <p className="font-semibold text-foreground/80">No invoices found</p>
          <p className="text-xs text-foreground/60 mt-1">
            Invoices are automatically minted as you create contracts and deliver milestones.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <GlassCard className="overflow-hidden p-0 border border-[var(--glass-border)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Contract / Milestone</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount (USD)</TableHead>
                  <TableHead>Bitcoin Equivalent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedInvoices.map((inv) => {
                  const statusMeta = STATUS_CHIPS[inv.status];
                  const Icon = statusMeta.icon;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {inv.invoiceNumber}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5 max-w-[200px]">
                          <div className="font-bold text-xs truncate" title={inv.contractTitle}>
                            {inv.contractTitle}
                          </div>
                          <div className="text-[11px] text-foreground/60 truncate" title={inv.milestoneDescription}>
                            {inv.milestoneDescription}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Avatar className="size-5">
                            <AvatarFallback className="bg-sky-500/20 text-[9px] text-sky-700 dark:text-sky-300">
                              {initials(inv.clientName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[100px] font-medium">{inv.clientName}</span>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {formatUsd(inv.amountUsd)}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-amber-500 font-semibold">
                        <div className="flex items-center gap-1">
                          <Bitcoin className="size-3" />
                          <span>{inv.amountBtc.toFixed(6)} BTC</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            statusMeta.class
                          )}
                        >
                          <Icon className="size-3" />
                          {statusMeta.label}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-foreground/60">
                        {formatDateShort(inv.dueDate)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        >
                          View & Pay ↗
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
            totalItems={filteredInvoices.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {/* INVOICE DETAIL & BITCOIN QR PAYMENT MODAL */}
      <Dialog open={!!selectedInvoice} onOpenChange={(o) => (!o ? setSelectedInvoice(null) : null)}>
        <DialogContent className="max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                  ₿
                </span>
                <div>
                  <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                    <span>Invoice {selectedInvoice?.invoiceNumber}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-foreground/60">
                    ChainWork Cryptographic Escrow & Bitcoin Settlement Invoice
                  </DialogDescription>
                </div>
              </div>

              {selectedInvoice && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
                    STATUS_CHIPS[selectedInvoice.status].class
                  )}
                >
                  {STATUS_CHIPS[selectedInvoice.status].label}
                </span>
              )}
            </div>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 text-xs">
              {/* Parties Card */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-foreground/50">Billed To (Client)</span>
                  <div className="font-bold text-foreground text-sm">{selectedInvoice.clientName}</div>
                  <div className="text-[11px] text-foreground/60">Contract Participant</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-foreground/50">Issued By (Freelancer)</span>
                  <div className="font-bold text-foreground text-sm">{selectedInvoice.freelancerName}</div>
                  <div className="text-[11px] font-mono text-emerald-500 truncate" title={selectedInvoice.freelancerWallet}>
                    Wallet: {selectedInvoice.freelancerWallet}
                  </div>
                </div>
              </div>

              {/* Itemized Deliverable Table */}
              <div className="rounded-xl border border-[var(--glass-border)] bg-background/50 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-2.5 bg-foreground/5 font-bold text-[10px] uppercase text-foreground/60">
                  <div className="col-span-7">Description / Milestone</div>
                  <div className="col-span-2 text-right">USD Amount</div>
                  <div className="col-span-3 text-right">Bitcoin Amount</div>
                </div>
                <div className="grid grid-cols-12 gap-2 p-3 items-center border-t border-[var(--glass-border)] font-medium">
                  <div className="col-span-7 space-y-0.5">
                    <div className="font-bold text-foreground">{selectedInvoice.contractTitle}</div>
                    <div className="text-[11px] text-foreground/70">{selectedInvoice.milestoneDescription}</div>
                  </div>
                  <div className="col-span-2 text-right font-mono font-bold text-foreground">
                    {formatUsd(selectedInvoice.amountUsd)}
                  </div>
                  <div className="col-span-3 text-right font-mono font-bold text-amber-500">
                    {selectedInvoice.amountBtc.toFixed(8)} BTC
                  </div>
                </div>
              </div>

              {/* Bitcoin BIP-21 Payment & QR Code Section */}
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Coins className="size-4" />
                    BIP-21 Bitcoin Direct Payment
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 font-semibold">
                    {selectedInvoice.sats.toLocaleString()} Satoshis
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Code */}
                  <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0">
                    <BitcoinQrCode value={selectedInvoice.bitcoinPaymentUri} size={130} />
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-2 flex-1 min-w-0 w-full">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-foreground/50">
                        Bitcoin SegWit Address
                      </div>
                      <div className="flex items-center justify-between gap-1 rounded-lg border border-[var(--glass-border)] bg-background/60 p-2 font-mono text-[11px]">
                        <span className="truncate">{selectedInvoice.freelancerWallet}</span>
                        <button
                          type="button"
                          onClick={() => {
                            copyText(selectedInvoice.freelancerWallet, "Bitcoin Address");
                            setCopiedAddr(true);
                            setTimeout(() => setCopiedAddr(false), 2000);
                          }}
                          className="text-amber-500 hover:text-amber-400 p-1 shrink-0"
                          title="Copy address"
                        >
                          {copiedAddr ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-foreground/50">
                        BIP-21 Payment URI
                      </div>
                      <div className="flex items-center justify-between gap-1 rounded-lg border border-[var(--glass-border)] bg-background/60 p-2 font-mono text-[11px]">
                        <span className="truncate text-foreground/75">{selectedInvoice.bitcoinPaymentUri}</span>
                        <button
                          type="button"
                          onClick={() => {
                            copyText(selectedInvoice.bitcoinPaymentUri, "Payment Link");
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="text-amber-500 hover:text-amber-400 p-1 shrink-0"
                          title="Copy payment link"
                        >
                          {copiedLink ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement / Transaction Verification */}
              {selectedInvoice.mockTxHash && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <ShieldCheck className="size-4" />
                    <span>Cryptographic Escrow Settlement Verified</span>
                  </div>
                  <div className="font-mono text-[10px] text-foreground/70 truncate">
                    Tx Hash: {selectedInvoice.mockTxHash}
                  </div>
                </div>
              )}

              {/* Admin Hold Warning */}
              {selectedInvoice.adminHold && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 space-y-1 text-red-600 dark:text-red-400">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <Pause className="size-4" />
                    <span>Payment Placed on Admin Hold</span>
                  </div>
                  <p className="text-[11px] leading-tight">
                    Reason: {selectedInvoice.adminHoldReason || "Security review in progress. Payment will resume once cleared by administration."}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--glass-border)] pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintInvoice}
              className="gap-1.5 text-xs font-semibold"
            >
              <Printer className="size-3.5" />
              Print / Save PDF
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              {selectedInvoice && (
                <Button
                  type="button"
                  size="sm"
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                >
                  <Link href={`/freelancer/contracts/${selectedInvoice.contractId}`}>
                    Open Contract ↗
                  </Link>
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
