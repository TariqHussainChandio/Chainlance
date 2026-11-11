"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  FileCheck,
  FileCode,
  FolderArchive,
  Loader2,
  Lock,
  Paperclip,
  Receipt,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Undo,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  approveMilestone,
  checkAndAutoReleaseDeliveredMilestones,
  disputeMilestone,
  markMilestoneDelivered,
  requestMilestoneRevision,
  resolveOrWithdrawDispute,
} from "@/app/actions/contracts";
import {
  formatFileSize,
  uploadDeliveryFile,
  uploadFileGuarantee,
} from "@/lib/cloudinary/upload-helpers";
import { ContractMessages } from "@/components/contract/contract-messages";
import { ContractReviewPanel } from "@/components/contract/contract-review-panel";
import { OrderCountdownTimer } from "@/components/contract/order-countdown-timer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  subscribeContract,
  subscribeMilestones,
  subscribeTransactions,
} from "@/lib/firebase/contracts";
import type {
  ContractTransactionType,
  MilestoneStatus,
  SerializedContract,
  SerializedContractTransaction,
  SerializedMilestone,
} from "@/lib/firebase/schema";
import {
  formatDateShort,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/format-time";
import { cn } from "@/lib/utils";

type Role = "client" | "freelancer";

interface ContractDetailProps {
  contractId: string;
  role: Role;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

function truncateHash(hash: string): string {
  if (!hash) return "";
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function ContractDetail({ contractId, role }: ContractDetailProps) {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [contract, setContract] = React.useState<SerializedContract | null>(null);
  const [milestones, setMilestones] = React.useState<SerializedMilestone[]>([]);
  const [transactions, setTransactions] = React.useState<SerializedContractTransaction[]>([]);
  const [contractReady, setContractReady] = React.useState(false);
  const [milestonesReady, setMilestonesReady] = React.useState(false);
  const [transactionsReady, setTransactionsReady] = React.useState(false);
  const [resolvingDispute, setResolvingDispute] = React.useState(false);

  React.useEffect(() => {
    const unsubC = subscribeContract(contractId, (c) => {
      setContract(c);
      setContractReady(true);
    });
    const unsubM = subscribeMilestones(contractId, (ms) => {
      setMilestones(ms);
      setMilestonesReady(true);
    });
    const unsubT = subscribeTransactions(contractId, (ts) => {
      setTransactions(ts);
      setTransactionsReady(true);
    });
    return () => {
      unsubC();
      unsubM();
      unsubT();
    };
  }, [contractId]);

  React.useEffect(() => {
    if (contract?.id) {
      void checkAndAutoReleaseDeliveredMilestones(contract.id);
    }
  }, [contract?.id]);

  const loading =
    userLoading || !contractReady || !milestonesReady || !transactionsReady;

  if (loading) {
    return <DetailSkeleton />;
  }

  if (
    !contract ||
    !user ||
    (user.uid !== contract.clientId && user.uid !== contract.freelancerId)
  ) {
    return (
      <GlassCard className="p-10 text-center space-y-4">
        <h2 className="text-lg font-bold">Contract Not Found</h2>
        <p className="text-xs text-foreground/60 font-semibold">
          It may have been removed, or you don't have permission to access it.
        </p>
        <div>
          <Button asChild type="button" variant="outline" className="font-bold text-xs">
            <Link href={`/${role}/contracts`}>
              <ArrowLeft className="size-4 mr-1" />
              Back to Contracts
            </Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  const counterpartyName =
    role === "client" ? contract.freelancerName : contract.clientName;
  const counterpartyAvatar =
    role === "client" ? contract.freelancerAvatar : contract.clientAvatar;
  const counterpartyRoleLabel = role === "client" ? "Freelancer" : "Client";

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const activeMilestone = milestones.find(
    (m) => m.status === "pending" || m.status === "delivered" || m.status === "disputed"
  );

  const orderId = `CW-ORD-${contract.id.slice(0, 8).toUpperCase()}`;

  function copyOrderId() {
    void navigator.clipboard.writeText(orderId);
    toast.success("Order ID copied to clipboard.");
  }

  function copyTxHash() {
    if (!contract?.mockTxHash) return;
    void navigator.clipboard
      .writeText(contract.mockTxHash)
      .then(() => toast.success("Tx hash copied."))
      .catch(() => toast.error("Could not copy."));
  }

  async function handleWithdrawDispute() {
    setResolvingDispute(true);
    try {
      await resolveOrWithdrawDispute(contractId, "Parties reached an agreement.");
      toast.success("Dispute resolved & contract restored to active status!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve dispute.");
    } finally {
      setResolvingDispute(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/${role}/contracts`}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 hover:text-emerald-400"
        >
          <ArrowLeft className="size-4" />
          Back to Contracts
        </Link>
        <div className="inline-flex items-center gap-2 rounded-xl bg-black/10 dark:bg-white/10 px-3 py-1 text-xs font-mono font-bold">
          <span>Order ID: {orderId}</span>
          <button type="button" onClick={copyOrderId} className="text-foreground/60 hover:text-emerald-400">
            <Copy className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Live Order Countdown Timer Header */}
      {activeMilestone && (contract.status === "active" || contract.status === "draft") && (
        <OrderCountdownTimer deadlineMs={activeMilestone.deadline} />
      )}

      {/* Urgent Freelancer Overdue Delivery Banner */}
      {role === "freelancer" && contract.status === "active" && activeMilestone?.status === "pending" && activeMilestone.deadline > 0 && activeMilestone.deadline < Date.now() && (
        <GlassCard className="p-5 border-red-500/50 bg-red-500/10 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-red-500 text-sm">
                <AlertCircle className="size-5 shrink-0" />
                <span>URGENT: Milestone #{milestones.indexOf(activeMilestone) + 1} Delivery Deadline Reached</span>
              </div>
              <p className="text-xs font-semibold text-foreground/80">
                The deadline for this milestone has passed. Please submit your completed deliverables (ZIP file up to 5GB, project link, or work notes) immediately to avoid client dispute.
              </p>
            </div>
            <DeliverAction
              contractId={contractId}
              milestoneId={activeMilestone.id}
              buttonText="Deliver Work Now (ZIP / Link)"
              variant="urgent"
            />
          </div>
        </GlassCard>
      )}

      {/* Freelancer Active Delivery Portal Banner */}
      {role === "freelancer" && contract.status === "active" && activeMilestone?.status === "pending" && (activeMilestone.deadline === 0 || activeMilestone.deadline >= Date.now()) && (
        <GlassCard className="p-5 border-emerald-500/40 bg-emerald-500/10 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-emerald-400 text-sm">
                <Sparkles className="size-5 shrink-0 text-emerald-400" />
                <span>Freelancer Work Delivery Portal Ready</span>
              </div>
              <p className="text-xs font-semibold text-foreground/80">
                Ready to turn in your work? Upload your project files (ZIP up to 5GB), external links (GitHub, Figma, Google Drive), and completion notes for client review.
              </p>
            </div>
            <DeliverAction
              contractId={contractId}
              milestoneId={activeMilestone.id}
              buttonText="Submit Deliverables (ZIP / Link)"
              variant="default"
            />
          </div>
        </GlassCard>
      )}

      {/* Disputed Resolution Banner */}
      {contract.status === "disputed" && (
        <GlassCard className="p-5 border-amber-500/40 bg-amber-500/10 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-amber-500 text-sm">
                <AlertTriangle className="size-5" />
                <span>Dispute Under Admin SLA Review</span>
              </div>
              <p className="text-xs font-semibold text-foreground/80">
                You can withdraw or resolve this dispute at any time if the other party satisfies your requirements.
              </p>
            </div>
            <AzureButton
              type="button"
              size="sm"
              onClick={handleWithdrawDispute}
              disabled={resolvingDispute}
            >
              {resolvingDispute ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <RotateCcw className="size-4 mr-1" />
              )}
              Withdraw & Resolve Dispute
            </AzureButton>
          </div>
        </GlassCard>
      )}

      {/* Contract Header Card */}
      <GlassCard variant="elevated" className="p-6 border-emerald-500/30">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 lg:max-w-md">
            <div className="flex items-center gap-2">
              <StatusPill
                status={contract.status}
                glow={contract.status === "active" || contract.status === "disputed"}
              />
              <span className="text-xs font-mono font-bold text-foreground/60">
                {orderId}
              </span>
            </div>
            <h2 className="line-clamp-2 text-2xl font-extrabold tracking-tight">
              {contract.title}
            </h2>
            <p className="text-xs font-semibold text-foreground/60">
              Created {formatRelativeTime(contract.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="size-11 ring-2 ring-emerald-500/40">
              {counterpartyAvatar ? (
                <AvatarImage src={counterpartyAvatar} alt={counterpartyName} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-xs font-bold">
                {initials(counterpartyName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-extrabold text-sm">{counterpartyName}</div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                {counterpartyRoleLabel}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold">
              <GradientText>${contract.totalAmount.toLocaleString()}</GradientText>
            </div>
            {contract.mockTxHash ? (
              <div className="flex items-center sm:justify-end gap-2">
                <code className="font-mono text-xs font-semibold text-foreground/70">
                  {truncateHash(contract.mockTxHash)}
                </code>
                <button
                  type="button"
                  onClick={copyTxHash}
                  aria-label="Copy tx hash"
                  className="inline-flex size-6 items-center justify-center rounded text-foreground/60 hover:text-emerald-400"
                >
                  <Copy className="size-3" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <ContractReviewPanel
            contractId={contractId}
            contractStatus={contract.status}
            reviewerId={user.uid}
            revieweeId={
              role === "client" ? contract.freelancerId : contract.clientId
            }
            revieweeName={counterpartyName}
          />

          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-extrabold">Milestone Schedule</h3>
            <p className="text-xs font-bold text-foreground/60">
              {completedCount} of {milestones.length} Completed
            </p>
          </div>

          {milestones.map((m, idx) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              orderIndex={idx + 1}
              contractId={contractId}
              contractStatus={contract.status}
              role={role}
            />
          ))}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <GlassCard className="p-5 space-y-3 border-emerald-500/20">
            <h3 className="inline-flex items-center gap-2 text-sm font-extrabold">
              <Receipt className="size-4 text-emerald-500" />
              Transaction History
            </h3>
            {transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--glass-border)] p-6 text-center text-xs font-semibold text-foreground/50">
                <Receipt className="mx-auto mb-2 size-5 text-emerald-500/60" />
                No transaction records yet
              </div>
            ) : (
              <ul className="space-y-2">
                {transactions.map((t) => (
                  <TransactionRow key={t.id} tx={t} />
                ))}
              </ul>
            )}
          </GlassCard>

          <ContractMessages
            contractId={contractId}
            currentUser={user}
            counterparty={{
              id:
                role === "client"
                  ? contract.freelancerId
                  : contract.clientId,
              name: counterpartyName,
              avatar: counterpartyAvatar,
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-28" />
        </div>
      </div>
    </div>
  );
}

interface MilestoneCardProps {
  milestone: SerializedMilestone;
  orderIndex: number;
  contractId: string;
  contractStatus: SerializedContract["status"];
  role: Role;
}

function MilestoneCard({
  milestone,
  orderIndex,
  contractId,
  contractStatus,
  role,
}: MilestoneCardProps) {
  const overdue =
    milestone.status !== "completed" &&
    milestone.status !== "disputed" &&
    milestone.deadline > 0 &&
    milestone.deadline < Date.now();

  return (
    <GlassCard className="p-5 space-y-4 border-emerald-500/20">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-xs font-extrabold text-emerald-400">
          0{orderIndex}
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold leading-snug">
            {milestone.description}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-base font-extrabold">
              <GradientText>
                ${milestone.amount.toLocaleString()}
              </GradientText>
            </span>
            <span className="text-[11px] font-mono text-amber-500 font-semibold">
              ≈ {(milestone.amount / 67500).toFixed(6)} BTC
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                overdue ? "text-red-500 font-bold" : "text-foreground/60"
              )}
            >
              Due {formatDateShort(milestone.deadline)}
              {overdue ? " (Overdue)" : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThreeDayReviewWindowBadge
            reviewWindowExpiresAt={milestone.reviewWindowExpiresAt}
            status={milestone.status}
            adminCleared={milestone.adminCleared}
          />
          {Boolean(milestone.revisionCount && milestone.revisionCount > 0) && (
            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold uppercase">
              Revision #{milestone.revisionCount}
            </Badge>
          )}
          <StatusPill status={milestone.status} />
        </div>
      </div>

      {milestone.revisionNote && milestone.status === "pending" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-amber-500 font-extrabold uppercase tracking-wider text-[10px]">
            <RotateCcw className="size-3.5" />
            <span>Active Revision Request Notes</span>
          </div>
          <p className="text-foreground/90 font-medium whitespace-pre-wrap">
            &ldquo;{milestone.revisionNote}&rdquo;
          </p>
        </div>
      )}

      {(milestone.deliveryEvidence || milestone.deliveryFileUrl || milestone.deliveryLink) ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-500">
              <FileCheck className="size-4" />
              <span>Submitted Milestone Work & Deliverables</span>
            </div>
            {milestone.deliveredAt && (
              <span className="text-[11px] font-semibold text-foreground/60">
                Delivered {formatDateShort(milestone.deliveredAt)}
              </span>
            )}
          </div>

          {/* File Download Card if Zip/File present */}
          {milestone.deliveryFileUrl && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-emerald-500/40 bg-black/10 dark:bg-white/5 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <FileArchive className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-foreground">
                    {milestone.deliveryFileName || "Project_Deliverable_Work.zip"}
                  </div>
                  <div className="text-[10px] font-semibold text-foreground/60 flex items-center gap-2">
                    <span>{formatFileSize(milestone.deliveryFileSize)}</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-bold uppercase">ZIP / Deliverable File</span>
                  </div>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs shrink-0"
              >
                <a href={milestone.deliveryFileUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="size-3.5 mr-1" />
                  Download Deliverable File
                </a>
              </Button>
            </div>
          )}

          {/* External Link Card if Link present */}
          {milestone.deliveryLink && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-teal-500/40 bg-black/10 dark:bg-white/5 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                  <ExternalLink className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-foreground">
                    {milestone.deliveryLink}
                  </div>
                  <div className="text-[10px] font-semibold text-foreground/60">
                    External Repository / Drive / Live Demo Link
                  </div>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-teal-500/50 text-teal-400 hover:bg-teal-500/10 font-bold text-xs shrink-0"
              >
                <a href={milestone.deliveryLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5 mr-1" />
                  Open Deliverable Link
                </a>
              </Button>
            </div>
          )}

          {/* Delivery Notes */}
          {milestone.deliveryEvidence && (
            <p className="whitespace-pre-wrap text-xs font-medium text-foreground/90 leading-relaxed bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-[var(--glass-border)]">
              {milestone.deliveryEvidence}
            </p>
          )}
        </div>
      ) : null}

      <MilestoneActions
        milestone={milestone}
        contractId={contractId}
        contractStatus={contractStatus}
        role={role}
      />
    </GlassCard>
  );
}

function MilestoneActions({
  milestone,
  contractId,
  contractStatus,
  role,
}: {
  milestone: SerializedMilestone;
  contractId: string;
  contractStatus: SerializedContract["status"];
  role: Role;
}) {
  if (milestone.status === "completed") {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
        <CheckCircle className="size-4" />
        Payment released on {formatDateShort(milestone.updatedAt)}
      </div>
    );
  }

  if (milestone.status === "disputed" || contractStatus === "disputed") {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs font-bold">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Dispute active on this milestone. You can withdraw or remove it at any time.</span>
        </div>
        <RemoveDisputeButton contractId={contractId} />
      </div>
    );
  }

  if (milestone.adminHold) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-red-500/50 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
        <AlertTriangle className="size-4 shrink-0" />
        <div>
          <span className="font-bold">Payment Placed on Admin Hold: </span>
          <span>{milestone.adminHoldReason || "Security review in progress. Payment will resume once cleared by administration."}</span>
        </div>
      </div>
    );
  }

  if (
    role === "freelancer" &&
    (milestone.status === "pending" || milestone.status === "delivered") &&
    contractStatus === "active"
  ) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {milestone.status === "pending" && (
          <DeliverAction contractId={contractId} milestoneId={milestone.id} />
        )}
        <DisputeDialogButton contractId={contractId} milestoneId={milestone.id} role="freelancer" />
      </div>
    );
  }

  if (role === "client" && milestone.status === "delivered") {
    return (
      <ClientReviewActions
        contractId={contractId}
        milestoneId={milestone.id}
      />
    );
  }

  if (role === "client" && milestone.status === "pending" && contractStatus === "active") {
    return (
      <DisputeDialogButton contractId={contractId} milestoneId={milestone.id} role="client" />
    );
  }

  return null;
}

function DeliverAction({
  contractId,
  milestoneId,
  buttonText = "Mark Work as Delivered",
  variant = "default",
}: {
  contractId: string;
  milestoneId: string;
  buttonText?: string;
  variant?: "default" | "urgent";
}) {
  const [open, setOpen] = React.useState(false);
  const [evidence, setEvidence] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const presets = [
    { label: "GitHub Repo", prefix: "https://github.com/" },
    { label: "Google Drive", prefix: "https://drive.google.com/" },
    { label: "Figma Design", prefix: "https://figma.com/file/" },
    { label: "Live Demo", prefix: "https://" },
  ];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error("File size exceeds the maximum 5 GB limit.");
      return;
    }
    setSelectedFile(file);
    toast.success(`Selected file: ${file.name} (${formatFileSize(file.size)})`);
  }

  async function submit() {
    if (!evidence.trim() && !linkUrl.trim() && !selectedFile) {
      toast.error("Please attach a work file (ZIP), project link, or delivery notes.");
      return;
    }

    setUploading(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      if (selectedFile) {
        setUploadProgress(20);
        const uploaded = await uploadDeliveryFile(selectedFile, (p) => setUploadProgress(p));
        fileUrl = uploaded.url;
        fileName = uploaded.fileName;
        fileSize = uploaded.fileSize;
      }

      const finalNotes =
        evidence.trim() ||
        (selectedFile
          ? `Delivered work file: ${selectedFile.name}`
          : `Delivered project link: ${linkUrl}`);

      await markMilestoneDelivered(
        contractId,
        milestoneId,
        finalNotes,
        fileUrl,
        fileName,
        fileSize,
        linkUrl.trim() || null
      );

      toast.success("Milestone work delivered! Client notified for 3-day review.");
      setOpen(false);
      setEvidence("");
      setLinkUrl("");
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not deliver milestone.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {variant === "urgent" ? (
        <Button
          type="button"
          size="sm"
          onClick={() => setOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg animate-bounce"
        >
          <Upload className="size-4 mr-1.5" />
          {buttonText}
        </Button>
      ) : (
        <AzureButton type="button" size="sm" onClick={() => setOpen(true)}>
          <Upload className="size-3.5 mr-1.5" />
          {buttonText}
        </AzureButton>
      )}

      <Dialog open={open} onOpenChange={(o) => (!uploading ? setOpen(o) : null)}>
        <DialogContent className="max-w-lg space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-500">
              <Upload className="size-5" />
              Submit Milestone Deliverables
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload your project zip/files (up to 5GB), provide external repository/demo links, and add completion documentation for client review.
            </DialogDescription>
          </DialogHeader>

          {/* Deliverable File Upload Box (ZIP, RAR, Code, Docs up to 5GB) */}
          <div className="space-y-2 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <FileArchive className="size-4" />
                Upload Project Zip / Deliverable File
              </span>
              <span className="text-[10px] text-foreground/60 font-mono font-bold">Max 5 GB</span>
            </div>

            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-500/30 bg-black/10 dark:bg-white/5 p-4 hover:bg-emerald-500/10 cursor-pointer transition-colors text-center">
              <Upload className="size-6 text-emerald-400" />
              <div className="text-xs font-bold text-foreground">
                {selectedFile ? selectedFile.name : "Click or drag & drop project file (ZIP, RAR, 7Z, PDF, MP4)"}
              </div>
              <div className="text-[10px] text-foreground/60 font-semibold">
                {selectedFile
                  ? `Size: ${formatFileSize(selectedFile.size)} · Ready to upload`
                  : "Supports archives, code bundles, and media up to 5 GB"}
              </div>
              <input
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                accept=".zip,.rar,.7z,.tar.gz,.pdf,.mp4,.png,.jpg,.jpeg,.docx,.txt,.js,.ts,.py,.json"
                className="hidden"
              />
            </label>

            {selectedFile && (
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-400">
                <div className="flex items-center gap-2 truncate">
                  <FileArchive className="size-4 shrink-0" />
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="text-[10px] opacity-80">({formatFileSize(selectedFile.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                  className="text-xs text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* External Project Link */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ExternalLink className="size-3.5 text-teal-400" />
                Project Link / Live Demo / Repository URL
              </span>
              <span className="text-[10px] text-foreground/50">Optional</span>
            </label>

            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://github.com/username/repository or https://drive.google.com/..."
              disabled={uploading}
              className="w-full rounded-xl border border-[var(--glass-border)] bg-black/10 dark:bg-white/5 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />

            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => !linkUrl && setLinkUrl(p.prefix)}
                  className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400 hover:bg-teal-500/20"
                >
                  + {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Evidence / Documentation Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Delivery Notes & Work Documentation:
            </label>
            <Textarea
              rows={3}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Describe what you delivered, setup instructions, or summary of work completed for client approval..."
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span>Uploading deliverables...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/20 dark:bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${Math.max(uploadProgress, 10)}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <AzureButton type="button" onClick={submit} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Uploading & Delivering…
                </>
              ) : (
                <>
                  <Check className="size-4 mr-1" />
                  Submit Milestone Work
                </>
              )}
            </AzureButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DisputeDialogButton({
  contractId,
  milestoneId,
  role,
}: {
  contractId: string;
  milestoneId: string;
  role: Role;
}) {
  const [disputeOpen, setDisputeOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [evidenceFile, setEvidenceFile] = React.useState<File | null>(null);
  const [evidenceUrl, setEvidenceUrl] = React.useState<string | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = React.useState(false);
  const [submittingDispute, setSubmittingDispute] = React.useState(false);

  const presets = role === "freelancer" ? [
    "Client requesting extra tasks out of agreed scope",
    "Client refusing fair milestone approval / payment",
    "Client unresponsive / unreasonable revision demands"
  ] : [
    "Delivered work does not match project specifications",
    "Incomplete features / unresolved bugs in delivery",
    "Freelancer missed contract requirements"
  ];

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFile(file);
    setUploadingEvidence(true);
    try {
      const url = await uploadFileGuarantee(file, "dispute-evidence");
      setEvidenceUrl(url);
      toast.success(`Evidence attachment uploaded: ${file.name}`);
    } catch (err) {
      toast.error("Evidence upload failed. Will submit reason without attachment.");
    } finally {
      setUploadingEvidence(false);
    }
  }

  async function submitDispute() {
    if (reason.trim().length < 8) {
      toast.error("Reason must be at least 8 characters.");
      return;
    }
    setSubmittingDispute(true);
    try {
      await disputeMilestone(
        contractId,
        milestoneId,
        reason.trim(),
        evidenceUrl,
        evidenceFile?.name ?? (evidenceUrl ? "Evidence File" : null)
      );
      toast.success("Dispute raised with evidence. Admin team notified.");
      setDisputeOpen(false);
      setReason("");
      setEvidenceFile(null);
      setEvidenceUrl(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not raise dispute.";
      toast.error(msg);
    } finally {
      setSubmittingDispute(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setDisputeOpen(true)}
        className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-bold text-xs"
      >
        <AlertTriangle className="size-3.5 mr-1" />
        Raise Dispute
      </Button>

      <Dialog
        open={disputeOpen}
        onOpenChange={(o) => (!submittingDispute ? setDisputeOpen(o) : null)}
      >
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-5" />
              Raise Milestone Dispute
            </DialogTitle>
            <DialogDescription className="text-xs">
              {role === "freelancer"
                ? "Provide detailed reason and upload the work evidence on which dispute occurs for human admin review."
                : "Provide detailed reason and attach work evidence showing contract specification mismatches."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/70">Common reasons (click to select):</label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(p)}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-left transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">Dispute Reason (Required):</label>
            <Textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the detailed reason for dispute and describe the work issues..."
              disabled={submittingDispute}
            />
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
            <label className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
              <span>Work Evidence / Attachment:</span>
              <span className="text-[10px] text-foreground/50 font-normal">Optional / Recommended</span>
            </label>
            
            <div className="flex items-center gap-3">
              <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer transition-colors">
                {uploadingEvidence ? (
                  <Loader2 className="size-4 animate-spin text-amber-500" />
                ) : (
                  <Upload className="size-4 text-amber-500" />
                )}
                <span>{uploadingEvidence ? "Uploading evidence..." : "Upload Disputed Work File"}</span>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploadingEvidence || submittingDispute}
                  className="hidden"
                />
              </label>
            </div>

            {evidenceFile && (
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Paperclip className="size-3.5 shrink-0" />
                  <span className="truncate">{evidenceFile.name}</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Attached</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisputeOpen(false)}
              disabled={submittingDispute || uploadingEvidence}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={submitDispute}
              disabled={submittingDispute || uploadingEvidence}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {submittingDispute ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Submitting…
                </>
              ) : (
                "Submit Dispute & Evidence"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RemoveDisputeButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleRemoveDispute() {
    setSubmitting(true);
    try {
      await resolveOrWithdrawDispute(contractId, note.trim() || undefined);
      toast.success("Dispute removed & resolved! Contract status restored to active.");
      setOpen(false);
      setNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove dispute.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AzureButton
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        className="font-bold text-xs shrink-0"
      >
        <RotateCcw className="size-3.5 mr-1" />
        Remove / Withdraw Dispute
      </AzureButton>

      <Dialog open={open} onOpenChange={(o) => (!submitting ? setOpen(o) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove &amp; Withdraw Dispute</DialogTitle>
            <DialogDescription>
              This will cancel the active dispute and return the contract and milestones back to active status.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (e.g. Agreement reached with freelancer/client)..."
            disabled={submitting}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <AzureButton
              type="button"
              onClick={handleRemoveDispute}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Removing…
                </>
              ) : (
                "Confirm & Remove Dispute"
              )}
            </AzureButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClientReviewActions({
  contractId,
  milestoneId,
}: {
  contractId: string;
  milestoneId: string;
}) {
  const router = useRouter();
  const [approving, setApproving] = React.useState(false);
  const [revisionOpen, setRevisionOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");
  const [extensionDays, setExtensionDays] = React.useState<number>(3);
  const [requestingRevision, setRequestingRevision] = React.useState(false);

  async function approve() {
    setApproving(true);
    try {
      await approveMilestone(contractId, milestoneId);
      toast.success("Milestone approved & payment released!");
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not release payment.";
      toast.error(msg);
    } finally {
      setApproving(false);
    }
  }

  async function handleRequestRevision() {
    if (feedback.trim().length < 5) {
      toast.error("Please explain what revisions are required (at least 5 chars).");
      return;
    }
    setRequestingRevision(true);
    try {
      await requestMilestoneRevision(contractId, milestoneId, feedback.trim(), extensionDays);
      toast.success(`Revision requested${extensionDays > 0 ? ` (+${extensionDays} days extension granted)` : ""}. Milestone reset for re-delivery.`);
      setRevisionOpen(false);
      setFeedback("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request revision.");
    } finally {
      setRequestingRevision(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AzureButton
        type="button"
        size="sm"
        onClick={approve}
        disabled={approving}
      >
        {approving ? (
          <>
            <Loader2 className="size-4 animate-spin mr-1" />
            Releasing Payment…
          </>
        ) : (
          <>
            <CheckCircle className="size-4 mr-1" />
            Approve &amp; Release Payout
          </>
        )}
      </AzureButton>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRevisionOpen(true)}
        className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-bold text-xs"
      >
        <RotateCcw className="size-3.5 mr-1" />
        Request Revision
      </Button>
      <DisputeDialogButton contractId={contractId} milestoneId={milestoneId} role="client" />

      <Dialog open={revisionOpen} onOpenChange={(o) => (!requestingRevision ? setRevisionOpen(o) : null)}>
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <RotateCcw className="size-5" />
              Request Milestone Revision
            </DialogTitle>
            <DialogDescription className="text-xs">
              Specify required changes and optionally grant an extended delivery timeline for the freelancer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/80">Revision Notes / Instructions *</label>
            <Textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Explain what changes, design fixes, or code updates are needed for re-delivery..."
              disabled={requestingRevision}
              className="text-xs font-medium"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <label className="text-xs font-bold text-amber-500 flex items-center justify-between">
              <span>Grant Extended Delivery Timeline:</span>
              <span className="text-[10px] uppercase bg-amber-500/20 px-2 py-0.5 rounded-full font-extrabold">Fiverr Standard</span>
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2, 3, 5, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExtensionDays(days)}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-xs font-bold transition-all border",
                    extensionDays === days
                      ? "bg-amber-500 text-black border-amber-400 font-extrabold shadow-sm"
                      : "bg-black/10 dark:bg-white/5 border-amber-500/20 text-foreground/70 hover:text-foreground hover:bg-amber-500/20"
                  )}
                >
                  {days === 0 ? "No Extension" : `+${days} ${days === 1 ? "Day" : "Days"}`}
                </button>
              ))}
            </div>

            <p className="text-[11px] font-semibold text-foreground/70 leading-relaxed pt-1">
              ⭐ Granting extra time ensures the freelancer can implement revisions properly without deadline stress.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevisionOpen(false)}
              disabled={requestingRevision}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <AzureButton
              type="button"
              onClick={handleRequestRevision}
              disabled={requestingRevision}
              size="md"
            >
              {requestingRevision ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Submitting Revision…
                </>
              ) : (
                "Issue Revision & Extend Timeline"
              )}
            </AzureButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TransactionRowProps {
  tx: SerializedContractTransaction;
}

const TX_TYPE_VISUAL: Record<
  ContractTransactionType,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
  }
> = {
  escrow_fund: {
    label: "Escrow funded",
    Icon: Lock,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  milestone_release: {
    label: "Milestone released",
    Icon: Send,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  refund: {
    label: "Refund",
    Icon: Undo,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
};

function TransactionRow({ tx }: TransactionRowProps) {
  const visual = TX_TYPE_VISUAL[tx.type];
  const { Icon } = visual;
  return (
    <li>
      <a
        href={`https://sepolia.etherscan.io/tx/${tx.mockHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-[var(--glass-border)] hover:bg-black/5 dark:hover:bg-white/5"
        title={formatDateTime(tx.createdAt)}
      >
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
            visual.iconBg,
            visual.iconColor
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-bold">
              {visual.label}
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              ${tx.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px] text-foreground/50 font-semibold">
            <code className="truncate font-mono">
              {truncateHash(tx.mockHash)}
            </code>
          </div>
        </div>
      </a>
    </li>
  );
}

function ThreeDayReviewWindowBadge({
  reviewWindowExpiresAt,
  status,
  adminCleared,
}: {
  reviewWindowExpiresAt?: number | null;
  status: string;
  adminCleared?: boolean | null;
}) {
  const [timeLeft, setTimeLeft] = React.useState<string | null>(null);
  const [isExpired, setIsExpired] = React.useState(false);

  React.useEffect(() => {
    if (status !== "delivered" || !reviewWindowExpiresAt) {
      setTimeLeft(null);
      return;
    }

    function calculate() {
      const diff = (reviewWindowExpiresAt as number) - Date.now();
      if (diff <= 0) {
        setTimeLeft("3-Day Window Expired (Auto-Cleared Payout)");
        setIsExpired(true);
      } else {
        const totalMinutes = Math.floor(diff / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        setTimeLeft(`${days > 0 ? `${days}d ` : ""}${remHours}h ${mins}m remaining for client review`);
        setIsExpired(false);
      }
    }

    calculate();
    const interval = setInterval(calculate, 30000);
    return () => clearInterval(interval);
  }, [reviewWindowExpiresAt, status]);

  if (status === "approved" || status === "completed") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold text-emerald-400">
        <CheckCircle className="size-3 text-emerald-400" />
        <span>Stripe Payout Paid &amp; Cleared {adminCleared ? "(Admin Approved)" : ""}</span>
      </div>
    );
  }

  if (status !== "delivered" || !timeLeft) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xl",
        isExpired
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
          : "border-amber-500/40 bg-amber-500/15 text-amber-300"
      )}
    >
      <Clock className="size-3" />
      <span>Stripe Secured · {timeLeft}</span>
    </div>
  );
}

export type { MilestoneStatus };
