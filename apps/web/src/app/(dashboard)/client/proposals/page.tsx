"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  MessageSquare,
  Search,
  Star,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  acceptProposalAndCreateContract,
  listClientProposals,
  updateProposalStatus,
} from "@/lib/firebase/proposals";
import { Pagination } from "@/components/ui/pagination";
import type { ProposalStatus, SerializedProposal } from "@/lib/firebase/schema";

const PAGE_SIZE = 8;

const statusBadges: Record<ProposalStatus, { label: string; variant: string }> = {
  pending: { label: "Needs Review", variant: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  under_review: { label: "Under Review", variant: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  accepted: { label: "Accepted & Hired", variant: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  rejected: { label: "Declined", variant: "bg-red-500/15 text-red-600 border-red-500/30" },
  withdrawn: { label: "Withdrawn by Freelancer", variant: "bg-gray-500/15 text-gray-500 border-gray-500/30" },
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export default function ClientProposalsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [proposals, setProposals] = React.useState<SerializedProposal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedProposal, setSelectedProposal] = React.useState<SerializedProposal | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchProposals = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await listClientProposals(user.uid);
      setProposals(data);
    } catch (err) {
      console.warn("Failed to load client proposals:", err);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (userLoading) return;
    if (user) {
      void fetchProposals();
    } else {
      setLoading(false);
    }
  }, [user, userLoading, fetchProposals]);

  const handleAcceptProposal = async (proposal: SerializedProposal) => {
    if (!user) return;
    setProcessingId(proposal.id);
    try {
      const contractId = await acceptProposalAndCreateContract(
        proposal,
        user.uid,
        user.name,
        user.profileImage
      );
      toast.success(`Hired ${proposal.freelancerName}! Contract created.`);
      setSelectedProposal(null);
      router.push(`/client/contracts/${contractId}`);
    } catch (err) {
      console.error("Accept proposal error:", err);
      toast.error("Failed to accept proposal and create contract.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineProposal = async (proposalId: string) => {
    setProcessingId(proposalId);
    try {
      await updateProposalStatus(proposalId, "rejected");
      toast.info("Proposal declined.");
      setSelectedProposal(null);
      await fetchProposals();
    } catch (err) {
      toast.error("Failed to decline proposal.");
    } finally {
      setProcessingId(null);
    }
  };

  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const filteredProposals = proposals.filter((p) => {
    const matchesTab = activeTab === "all" || p.status === activeTab;
    const matchesSearch =
      p.freelancerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.gigTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.coverLetter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / PAGE_SIZE));
  const pagedProposals = React.useMemo(
    () => filteredProposals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredProposals, page]
  );

  if (userLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== "client") {
    return (
      <GlassCard className="p-8 text-sm">
        Only clients/hirers can view received proposals.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Received Proposals</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Review applicant bids, compare rates & timelines, and hire top talent.
          </p>
        </div>
        <AzureButton asChild size="md">
          <Link href="/client/browse">Browse Freelancers</Link>
        </AzureButton>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "accepted", "rejected"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="capitalize text-xs"
            >
              {tab === "all" ? "All Proposals" : tab.replace("_", " ")}
              <span className="ml-1.5 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px]">
                {tab === "all"
                  ? proposals.length
                  : proposals.filter((p) => p.status === tab).length}
              </span>
            </Button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-foreground/50" />
          <Input
            placeholder="Search freelancers or gigs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Proposals Grid */}
      {filteredProposals.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <FileText className="mx-auto size-12 text-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">No proposals found</h3>
          <p className="mt-1 text-sm text-foreground/60">
            {proposals.length === 0
              ? "You haven't received any proposals yet."
              : "No proposals match your current filter."}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pagedProposals.map((p) => {
              const badge = statusBadges[p.status] || statusBadges.pending;
              return (
                <GlassCard
                  key={p.id}
                  className="flex flex-col justify-between p-5 hover:border-[var(--azure-500)]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Badge className={`text-[10px] font-medium border ${badge.variant}`}>
                        {badge.label}
                      </Badge>
                      <span className="text-xs text-foreground/60">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <Avatar className="size-10">
                        {p.freelancerAvatar ? (
                          <AvatarImage src={p.freelancerAvatar} alt={p.freelancerName} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-xs">
                          {initials(p.freelancerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-sm">{p.freelancerName}</h4>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                          <Star className="size-3 fill-amber-400" />
                          {(p.freelancerRating || 5.0).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <h3 className="mt-3 text-xs font-semibold text-foreground/80 line-clamp-1">
                      Gig: {p.gigTitle}
                    </h3>

                    <p className="mt-2 text-xs text-foreground/70 line-clamp-3 bg-[var(--glass-bg)] p-2.5 rounded-lg border border-[var(--glass-border)]">
                      &ldquo;{p.coverLetter}&rdquo;
                    </p>
                  </div>

                  <div className="mt-5 border-t border-[var(--glass-border)] pt-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase text-foreground/50 font-semibold">
                        Proposed Price
                      </div>
                      <div className="text-lg font-bold">
                        <GradientText>${p.bidAmount.toLocaleString()}</GradientText>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProposal(p)}
                        className="text-xs h-8"
                      >
                        <Eye className="size-3.5 mr-1" />
                        Review
                      </Button>
                      {p.status === "pending" && (
                        <AzureButton
                          size="sm"
                          onClick={() => handleAcceptProposal(p)}
                          disabled={processingId === p.id}
                          className="text-xs h-8"
                        >
                          <UserCheck className="size-3.5 mr-1" />
                          Hire
                        </AzureButton>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredProposals.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      {/* Proposal Detail & Hiring Dialog */}
      <Dialog
        open={!!selectedProposal}
        onOpenChange={(open) => !open && setSelectedProposal(null)}
      >
        {selectedProposal && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2 pr-6">
                <DialogTitle className="text-xl">
                  Proposal from {selectedProposal.freelancerName}
                </DialogTitle>
                <Badge
                  className={`text-xs border ${
                    statusBadges[selectedProposal.status]?.variant
                  }`}
                >
                  {statusBadges[selectedProposal.status]?.label}
                </Badge>
              </div>
              <DialogDescription>
                For project: {selectedProposal.gigTitle}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                <Avatar className="size-12">
                  {selectedProposal.freelancerAvatar ? (
                    <AvatarImage src={selectedProposal.freelancerAvatar} alt={selectedProposal.freelancerName} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white">
                    {initials(selectedProposal.freelancerName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base">{selectedProposal.freelancerName}</h3>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                    <Star className="size-3 fill-amber-400" />
                    {(selectedProposal.freelancerRating || 5.0).toFixed(1)} Rating
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-sm">
                <div>
                  <span className="text-xs text-foreground/50 uppercase">Bid Amount</span>
                  <div className="text-xl font-bold text-[var(--azure-500)]">
                    ${selectedProposal.bidAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-foreground/50 uppercase">Delivery Time</span>
                  <div className="text-base font-semibold">
                    {selectedProposal.deliveryDays} Days
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Cover Letter</h4>
                <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-sm whitespace-pre-wrap text-foreground/90">
                  {selectedProposal.coverLetter}
                </div>
              </div>

              {selectedProposal.milestones && selectedProposal.milestones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Proposed Milestones</h4>
                  <div className="space-y-2">
                    {selectedProposal.milestones.map((m: { description: string; deadlineDays: number; amount: number }, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] p-3 text-xs"
                      >
                        <div>
                          <span className="font-medium text-foreground">{m.description}</span>
                          <span className="ml-2 text-foreground/50">({m.deadlineDays} days)</span>
                        </div>
                        <span className="font-bold text-[var(--azure-500)]">${m.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)] gap-2">
                {selectedProposal.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeclineProposal(selectedProposal.id)}
                      disabled={processingId === selectedProposal.id}
                    >
                      <XCircle className="size-4 mr-1" />
                      Decline
                    </Button>
                    <AzureButton
                      size="sm"
                      onClick={() => handleAcceptProposal(selectedProposal)}
                      disabled={processingId === selectedProposal.id}
                      className="ml-auto"
                    >
                      <UserCheck className="size-4 mr-1" />
                      Accept & Hire Freelancer
                    </AzureButton>
                  </>
                )}
                {selectedProposal.status !== "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProposal(null)}
                    className="ml-auto"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
