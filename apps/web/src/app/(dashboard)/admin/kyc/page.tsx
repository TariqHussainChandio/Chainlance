"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { buildCsvString, downloadCsv } from "@/lib/utils/csv-export";

import { reviewKyc } from "@/app/actions/kyc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";
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
import { listKycSubmissions } from "@/lib/firebase/kyc";
import type {
  KycSubmissionStatus,
  SerializedKycSubmission,
} from "@/lib/firebase/schema";
import { formatRelativeTime } from "@/lib/format-time";
import { KYC_DOC_TYPE_LABELS } from "@/lib/schemas/kyc-schema";
import { cn } from "@/lib/utils";

import { Pagination } from "@/components/ui/pagination";

type Tab = KycSubmissionStatus;
const TABS: { value: Tab; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];
const PAGE_SIZE = 10;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export default function AdminKycPage() {
  const [tab, setTab] = React.useState<Tab>("pending");
  const [submissions, setSubmissions] = React.useState<
    SerializedKycSubmission[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [reviewing, setReviewing] = React.useState<SerializedKycSubmission | null>(
    null
  );

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await listKycSubmissions(tab);
      setSubmissions(list);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  React.useEffect(() => {
    setPage(1);
    void refresh();
  }, [refresh, tab]);

  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const pagedSubmissions = React.useMemo(
    () => submissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [submissions, page]
  );

  const counts = React.useMemo(() => {
    const c: Record<Tab, number | "—"> = {
      pending: tab === "pending" ? submissions.length : "—",
      approved: tab === "approved" ? submissions.length : "—",
      rejected: tab === "rejected" ? submissions.length : "—",
    };
    return c;
  }, [submissions, tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <ShieldCheck className="size-7 text-[color:var(--azure-500)]" />
            KYC review queue
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {tab === "pending" && !loading
              ? `${submissions.length} pending submission${submissions.length === 1 ? "" : "s"}`
              : "Review identity documents and decide whether to verify the account."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (submissions.length === 0) {
              toast.error("No KYC submissions to export.");
              return;
            }
            const headers = ["Submission ID", "User Name", "Email", "Role", "Doc Type", "Status", "Fraud Score", "Submitted Date"];
            const rows = submissions.map((s) => [
              s.id,
              s.userName,
              s.userEmail,
              s.userRole,
              s.documentType,
              s.status,
              s.userFraudScore,
              new Date(s.createdAt).toISOString(),
            ]);
            const csv = buildCsvString(headers, rows);
            downloadCsv(`chainwork-kyc-submissions-${tab}-${Date.now()}.csv`, csv);
            toast.success("KYC submissions report exported to CSV.");
          }}
          disabled={loading || submissions.length === 0}
          className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
        >
          <Download className="size-3.5" />
          Export CSV
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="max-w-full overflow-x-auto touch-scroll">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2">
              {t.label}
              <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-[var(--glass-border)] bg-foreground/5 px-1.5 text-[10px] font-semibold text-foreground/60">
                {counts[t.value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <GlassCard className="overflow-hidden p-0">
          <div className="divide-y divide-[var(--glass-border)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 p-4">
                {Array.from({ length: 5 }).map((__, j) => (
                  <Skeleton key={j} className="h-5" />
                ))}
              </div>
            ))}
          </div>
        </GlassCard>
      ) : submissions.length === 0 ? (
        <GlassCard className="p-10 text-center text-sm text-foreground/60">
          {tab === "pending"
            ? "No pending submissions. Quiet day."
            : `No ${tab} submissions yet.`}
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <GlassCard className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Doc type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedSubmissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-[10px]">
                            {initials(s.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{s.userName}</div>
                          <div className="text-xs text-foreground/50 capitalize">
                            {s.userRole}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {KYC_DOC_TYPE_LABELS[s.documentType]}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/60">
                      {formatRelativeTime(s.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={s.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewing(s)}
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
            totalItems={submissions.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {reviewing ? (
        <ReviewDialog
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}

const STATUS_CHIP: Record<KycSubmissionStatus, string> = {
  pending:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  approved:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

function StatusChip({ status }: { status: KycSubmissionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize backdrop-blur-xl",
        STATUS_CHIP[status]
      )}
    >
      {status}
    </span>
  );
}

function ReviewDialog({
  submission,
  onClose,
  onDone,
}: {
  submission: SerializedKycSubmission;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState<"approve" | "reject" | null>(
    null
  );

  const isImage = !submission.documentUrl
    .toLowerCase()
    .endsWith(".pdf");

  async function approve() {
    setPending("approve");
    try {
      await reviewKyc({ submissionId: submission.id, decision: "approve" });
      toast.success(`Approved ${submission.userName}.`);
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not approve.";
      toast.error(msg);
    } finally {
      setPending(null);
    }
  }

  async function reject() {
    if (reason.trim().length < 8) {
      toast.error("Reason must be at least 8 characters.");
      return;
    }
    setPending("reject");
    try {
      await reviewKyc({
        submissionId: submission.id,
        decision: "reject",
        reason: reason.trim(),
      });
      toast.success(`Rejected ${submission.userName}.`);
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not reject.";
      toast.error(msg);
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(o) => (!pending && !o ? onClose() : null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review submission</DialogTitle>
            <DialogDescription>
              Verify the document matches the user&apos;s account details before
              approving.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <GlassCard className="p-4 space-y-2 text-sm">
              <div className="text-xs uppercase tracking-wider text-foreground/50">
                Account
              </div>
              <div>
                <span className="text-foreground/60">Name:</span>{" "}
                <span className="font-medium">{submission.userName}</span>
              </div>
              <div>
                <span className="text-foreground/60">Email:</span>{" "}
                <span className="font-mono text-xs">{submission.userEmail}</span>
              </div>
              <div className="capitalize">
                <span className="text-foreground/60">Role:</span>{" "}
                <span>{submission.userRole}</span>
              </div>
              <div>
                <span className="text-foreground/60">Fraud score:</span>{" "}
                <span
                  className={cn(
                    "font-mono",
                    submission.userFraudScore >= 70
                      ? "text-destructive"
                      : submission.userFraudScore >= 30
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {submission.userFraudScore}
                </span>
              </div>
              <div>
                <span className="text-foreground/60">Doc type:</span>{" "}
                {KYC_DOC_TYPE_LABELS[submission.documentType]}
              </div>
              <a
                href={submission.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[color:var(--azure-600)] hover:text-[color:var(--azure-500)]"
              >
                Open original <ExternalLink className="size-3" />
              </a>
            </GlassCard>

            <div className="overflow-hidden rounded-lg border border-[var(--glass-border)] bg-foreground/5">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={submission.documentUrl}
                  alt="KYC document"
                  className="h-72 w-full object-contain"
                />
              ) : (
                <iframe
                  src={submission.documentUrl}
                  title="KYC document PDF"
                  className="h-72 w-full"
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(true)}
              disabled={!!pending || submission.status !== "pending"}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <AlertTriangle className="size-4" />
              Reject
            </Button>
            <AzureButton
              type="button"
              onClick={approve}
              disabled={!!pending || submission.status !== "pending"}
            >
              {pending === "approve" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Approving…
                </>
              ) : (
                <>
                  <CheckCircle className="size-4" />
                  Approve
                </>
              )}
            </AzureButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectOpen}
        onOpenChange={(o) => (!pending ? setRejectOpen(o) : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject submission</DialogTitle>
            <DialogDescription>
              The user will see this reason and can re-submit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (min 8 characters)"
            disabled={!!pending}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={!!pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={reject}
              disabled={!!pending}
            >
              {pending === "reject" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Reject submission"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
