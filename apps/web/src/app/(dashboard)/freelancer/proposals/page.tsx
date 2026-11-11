"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  DollarSign,
  FileText,
  Filter,
  Search,
  Eye,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}
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
  listFreelancerProposals,
  updateProposalStatus,
} from "@/lib/firebase/proposals";
import type { ProposalStatus, SerializedProposal } from "@/lib/firebase/schema";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 8;

const statusBadges: Record<ProposalStatus, { label: string; variant: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending Review", variant: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: Clock },
  under_review: { label: "Under Review", variant: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: AlertCircle },
  accepted: { label: "Accepted & Hired", variant: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
  rejected: { label: "Declined", variant: "bg-red-500/15 text-red-600 border-red-500/30", icon: XCircle },
  withdrawn: { label: "Withdrawn", variant: "bg-gray-500/15 text-gray-500 border-gray-500/30", icon: XCircle },
};

export default function FreelancerProposalsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [proposals, setProposals] = React.useState<SerializedProposal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedProposal, setSelectedProposal] = React.useState<SerializedProposal | null>(null);

  const fetchProposals = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await listFreelancerProposals(user.uid);
      setProposals(data);
    } catch (err) {
      console.warn("Failed to load proposals:", err);
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

  const handleWithdraw = async (proposalId: string) => {
    try {
      await updateProposalStatus(proposalId, "withdrawn");
      toast.success("Proposal withdrawn.");
      setSelectedProposal(null);
      await fetchProposals();
    } catch (err) {
      toast.error("Failed to withdraw proposal.");
    }
  };

  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const filteredProposals = proposals.filter((p) => {
    const matchesTab = activeTab === "all" || p.status === activeTab;
    const matchesSearch =
      p.gigTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  if (!user || user.role !== "freelancer") {
    return (
      <GlassCard className="p-8 text-sm">
        Only freelancers can view submitted proposals.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Proposals</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Track and manage your submitted pitches, bids, and custom offers.
          </p>
        </div>
        <AzureButton asChild size="md" className="w-full sm:w-auto">
          <Link href="/client/browse">
            <Briefcase className="size-4" />
            Browse Gigs to Apply
          </Link>
        </AzureButton>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap shrink-0 max-w-full pb-1 sm:pb-0">
          {["all", "pending", "accepted", "rejected", "withdrawn"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="capitalize text-xs shrink-0"
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

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-foreground/50" />
          <Input
            placeholder="Search proposals..."
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
              ? "You haven't submitted any proposals yet."
              : "No proposals match your current filter."}
          </p>
          <div className="mt-6">
            <AzureButton asChild size="sm">
              <Link href="/client/browse">Explore Gigs & Submit Pitch</Link>
            </AzureButton>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pagedProposals.map((p) => {
              const badge = statusBadges[p.status] || statusBadges.pending;
              const BadgeIcon = badge.icon;
              return (
                <GlassCard
                  key={p.id}
                  className="flex flex-col justify-between p-5 hover:border-[var(--azure-500)]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-foreground/60">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                      <Badge className={`text-[10px] font-medium border ${badge.variant}`}>
                        <BadgeIcon className="size-3 mr-1" />
                        {badge.label}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-2.5">
                      <Avatar className="size-7 ring-1 ring-emerald-500/20">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-[10px] font-bold">
                          {initials(p.clientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-bold leading-snug line-clamp-1">{p.gigTitle}</h3>
                        <p className="text-[11px] font-semibold text-foreground/70">
                          Client: <span className="font-bold text-foreground">{p.clientName}</span>
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-foreground/80 line-clamp-3 bg-[var(--glass-bg)] p-2.5 rounded-lg border border-[var(--glass-border)]">
                      &ldquo;{p.coverLetter}&rdquo;
                    </p>
                  </div>

                  <div className="mt-5 border-t border-[var(--glass-border)] pt-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase text-foreground/50 font-semibold">
                        Your Bid
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
                        Details
                      </Button>
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

      {/* Proposal Detail Dialog */}
      <Dialog
        open={!!selectedProposal}
        onOpenChange={(open) => !open && setSelectedProposal(null)}
      >
        {selectedProposal && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2 pr-6">
                <DialogTitle className="text-xl">
                  Proposal: {selectedProposal.gigTitle}
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
                Submitted on {new Date(selectedProposal.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
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
                    {selectedProposal.milestones.map((m, idx) => (
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

              <div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)]">
                {selectedProposal.status === "pending" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleWithdraw(selectedProposal.id)}
                  >
                    <XCircle className="size-4 mr-1" />
                    Withdraw Proposal
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProposal(null)}
                  className="ml-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
