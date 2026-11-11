"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Gavel,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { buildCsvString, downloadCsv } from "@/lib/utils/csv-export";

import { resolveDispute } from "@/app/actions/disputes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  getDisputeContext,
  subscribeDisputes,
  type DisputeContext,
  type DisputeFilter,
} from "@/lib/firebase/disputes";
import type {
  MilestoneStatus,
  SerializedContract,
  SerializedMilestone,
} from "@/lib/firebase/schema";
import { formatDateTime, formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

import { Pagination } from "@/components/ui/pagination";

const SLA_OVERDUE_MS = 5 * 24 * 60 * 60 * 1000;
const SLA_DUE_SOON_MS = 3 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 10;

const MILESTONE_STATUS_CHIP: Record<MilestoneStatus, string> = {
  pending:
    "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  delivered:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  approved:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  disputed:
    "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  completed:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

const STATUS_CHIP: Record<string, string> = {
  disputed: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  completed:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  cancelled:
    "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function SlaBadge({ openedAt }: { openedAt: number | null }) {
  if (!openedAt) return null;
  const age = Date.now() - openedAt;
  if (age >= SLA_OVERDUE_MS) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
        <AlertTriangle className="size-3" />
        Overdue
      </span>
    );
  }
  if (age >= SLA_DUE_SOON_MS) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
        Due soon
      </span>
    );
  }
  return null;
}

export default function AdminDisputesPage() {
  const [filter, setFilter] = React.useState<DisputeFilter>("active");
  const [contracts, setContracts] = React.useState<SerializedContract[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<SerializedContract | null>(
    null
  );

  React.useEffect(() => {
    setLoading(true);
    setPage(1);
    const unsub = subscribeDisputes(filter, (rows) => {
      setContracts(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(contracts.length / PAGE_SIZE));
  const pagedContracts = React.useMemo(
    () => contracts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [contracts, page]
  );

  const activeCount = React.useMemo(
    () =>
      filter === "active"
        ? contracts.length
        : contracts.filter((c) => c.status === "disputed").length,
    [contracts, filter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Gavel className="size-7 text-[color:var(--azure-500)]" />
            Disputes
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {activeCount} active · 5-day SLA from open
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (contracts.length === 0) {
                toast.error("No disputes to export.");
                return;
              }
              const headers = ["Contract ID", "Title", "Status", "Client Name", "Freelancer Name", "Amount (USD)", "Opened Date"];
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
              downloadCsv(`chainwork-disputes-${filter}-${Date.now()}.csv`, csv);
              toast.success("Disputes report exported to CSV.");
            }}
            disabled={loading || contracts.length === 0}
            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>

          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as DisputeFilter)}
          >
            <TabsList className="max-w-full overflow-x-auto touch-scroll">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : contracts.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              No {filter === "active" ? "active" : ""} disputes
            </h2>
            <p className="mt-1 text-sm text-foreground/60">Excellent.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <GlassCard className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedContracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {truncate(c.title, 48)}
                        </span>
                        {c.status === "disputed" ? (
                          <SlaBadge
                            openedAt={c.disputeOpenedAt ?? c.updatedAt}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          {c.clientAvatar ? (
                            <AvatarImage src={c.clientAvatar} alt={c.clientName} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-[10px] text-white">
                            {initials(c.clientName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{c.clientName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          {c.freelancerAvatar ? (
                            <AvatarImage
                              src={c.freelancerAvatar}
                              alt={c.freelancerName}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-[10px] text-white">
                            {initials(c.freelancerName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{c.freelancerName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      ${c.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                          STATUS_CHIP[c.status] ??
                            "bg-slate-500/15 text-slate-700 border-slate-500/30"
                        )}
                      >
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-foreground/60">
                      {formatRelativeTime(c.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(c)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={contracts.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-3xl sm:max-w-3xl">
          {selected ? <DisputeSlideOver contract={selected} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DisputeSlideOver({ contract }: { contract: SerializedContract }) {
  const [ctx, setCtx] = React.useState<DisputeContext | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [resolution, setResolution] = React.useState("");
  const [submitting, setSubmitting] = React.useState<
    "release" | "refund" | null
  >(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDisputeContext(contract.id)
      .then((c) => {
        if (cancelled) return;
        setCtx(c);
        const disputed = c.milestones.find((m) => m.status === "disputed");
        setSelectedMilestoneId(disputed?.id ?? c.milestones[0]?.id ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        toast.error("Could not load dispute context.");
      });
    return () => {
      cancelled = true;
    };
  }, [contract.id]);

  async function submit(decision: "release" | "refund") {
    if (!selectedMilestoneId) {
      toast.error("No milestone selected.");
      return;
    }
    if (resolution.trim().length < 8) {
      toast.error("Resolution must be at least 8 characters.");
      return;
    }
    setSubmitting(decision);
    try {
      await resolveDispute({
        contractId: contract.id,
        milestoneId: selectedMilestoneId,
        decision,
        resolution: resolution.trim(),
      });
      toast.success(
        decision === "release"
          ? "Milestone released to freelancer."
          : "Escrow refunded to client."
      );
      setResolution("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not resolve.";
      toast.error(msg);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <>
      <DialogTitle>{contract.title}</DialogTitle>
      <DialogDescription>
        ${contract.totalAmount.toLocaleString()} · {contract.clientName} →{" "}
        {contract.freelancerName} · opened{" "}
        {formatRelativeTime(contract.disputeOpenedAt ?? contract.updatedAt)}
      </DialogDescription>

      {loading ? (
        <Skeleton className="h-64" />
      ) : !ctx ? (
        <p className="text-sm text-foreground/60">Could not load context.</p>
      ) : (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-sm">
          <MilestoneList
            milestones={ctx.milestones}
            selectedId={selectedMilestoneId}
            onSelect={setSelectedMilestoneId}
          />

          {/* Dispute Reason & Work Evidence Section */}
          {(contract.disputeReason || contract.disputeEvidenceUrl) ? (
            <section className="space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
              <h3 className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-4 text-amber-500" />
                Submitted Dispute Details
              </h3>
              
              {contract.disputedByName && (
                <div className="text-xs font-semibold text-foreground/80">
                  Raised by: <span className="text-amber-600 dark:text-amber-400">{contract.disputedByName}</span>
                </div>
              )}

              {contract.disputeReason && (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">Reason:</div>
                  <div className="text-xs text-foreground/90 whitespace-pre-wrap rounded-lg bg-background/60 p-2.5 border border-amber-500/20">
                    {contract.disputeReason}
                  </div>
                </div>
              )}

              {contract.disputeEvidenceUrl && (
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">Disputed Work Evidence File:</div>
                  <div className="flex items-center justify-between rounded-lg bg-background/80 px-3 py-2 border border-amber-500/30">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground truncate">
                      <ShieldAlert className="size-4 text-amber-500 shrink-0" />
                      <span className="truncate">{contract.disputeEvidenceName || "Work_Evidence_Attachment"}</span>
                    </span>
                    <a
                      href={contract.disputeEvidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 transition-colors"
                    >
                      View Evidence ↗
                    </a>
                  </div>
                </div>
              )}
            </section>
          ) : ctx.systemMessages.length > 0 ? (
            <section className="space-y-2">
              <h3 className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                <ShieldAlert className="size-3.5" />
                Dispute reason
              </h3>
              {ctx.systemMessages
                .filter((m) =>
                  m.content.toLowerCase().includes("raised a dispute")
                )
                .slice(0, 2)
                .map((m) => (
                  <div
                    key={m.id}
                    className="rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs"
                  >
                    <div className="text-foreground/80">{m.content}</div>
                    <div className="mt-1 text-[10px] text-foreground/50">
                      {formatDateTime(m.createdAt)}
                    </div>
                  </div>
                ))}
            </section>
          ) : null}

          <section className="space-y-2">
            <h3 className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
              <MessageSquare className="size-3.5" />
              Recent messages
            </h3>
            <div className="space-y-1.5 rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
              {ctx.recentMessages.length === 0 ? (
                <p className="text-xs text-foreground/60">No messages.</p>
              ) : (
                ctx.recentMessages.slice(-20).map((m) => (
                  <div key={m.id} className="text-xs">
                    <span
                      className={cn(
                        "font-medium",
                        m.senderId === "system"
                          ? "text-[color:var(--azure-500)]"
                          : ""
                      )}
                    >
                      {m.senderName}
                    </span>
                    <span className="text-foreground/50">
                      {" "}
                      · {formatRelativeTime(m.createdAt)}
                    </span>
                    <div className="text-foreground/80">{m.content}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          {contract.status === "disputed" ? (
            <section className="space-y-2 border-t border-[var(--glass-border)] pt-3">
              <label
                htmlFor="resolution"
                className="text-xs font-semibold uppercase tracking-wider text-foreground/60"
              >
                Resolution explanation
              </label>
              <Textarea
                id="resolution"
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Explain why you're releasing or refunding…"
                disabled={!!submitting}
                maxLength={500}
              />
              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-300"
                  onClick={() => void submit("refund")}
                  disabled={!!submitting || resolution.trim().length < 8}
                >
                  {submitting === "refund" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Refund client
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-500 text-white hover:bg-emerald-600"
                  onClick={() => void submit("release")}
                  disabled={!!submitting || resolution.trim().length < 8}
                >
                  {submitting === "release" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  Release to freelancer
                </Button>
              </div>
            </section>
          ) : (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
              This contract is no longer in dispute.
            </p>
          )}
        </div>
      )}
    </>
  );
}

function MilestoneList({
  milestones,
  selectedId,
  onSelect,
}: {
  milestones: SerializedMilestone[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
        Milestones
      </h3>
      <div className="space-y-1.5">
        {milestones.map((m) => {
          const isSelected = m.id === selectedId;
          const isDisputed = m.status === "disputed";
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={cn(
                "flex w-full items-start justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors",
                isSelected
                  ? "border-[color:var(--azure-500)]/50 bg-[color:var(--azure-500)]/10"
                  : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[color:var(--azure-500)]/5",
                isDisputed && !isSelected
                  ? "border-red-500/30"
                  : ""
              )}
            >
              <div className="flex-1 space-y-0.5">
                <div className="font-medium">{m.description}</div>
                <div className="text-[10px] text-foreground/50">
                  ${m.amount.toLocaleString()}
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                  MILESTONE_STATUS_CHIP[m.status]
                )}
              >
                {m.status}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
