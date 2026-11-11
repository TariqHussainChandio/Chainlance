"use client";

import * as React from "react";
import { Clock, DollarSign, Plus, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

import { AzureButton } from "@/components/ui/azure-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProposal } from "@/lib/firebase/proposals";
import { StripeAccountSetupModal } from "@/components/payment/stripe-account-setup-modal";
import type { SerializedGig, SerializedUser } from "@/lib/firebase/schema";

interface SubmitProposalDialogProps {
  gig: SerializedGig;
  user: SerializedUser;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface MilestoneInput {
  description: string;
  amount: number;
  deadlineDays: number;
}

export function SubmitProposalDialog({
  gig,
  user,
  trigger,
  onSuccess,
}: SubmitProposalDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [coverLetter, setCoverLetter] = React.useState("");
  const [bidAmount, setBidAmount] = React.useState(gig.pricingBasic || 100);
  const [deliveryDays, setDeliveryDays] = React.useState(gig.deliveryDays || 3);
  const [milestones, setMilestones] = React.useState<MilestoneInput[]>([
    {
      description: "Initial Deliverable & Milestone 1",
      amount: gig.pricingBasic || 100,
      deadlineDays: gig.deliveryDays || 3,
    },
  ]);

  const [stripeConnected, setStripeConnected] = React.useState<boolean>(
    Boolean(user.stripeConnected || user.paymentMethodConnected)
  );

  const milestoneSum = milestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  const sumMatches = Math.abs(milestoneSum - (Number(bidAmount) || 0)) < 0.01;
  const isGibberish = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 30) return true;
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 4) return true;
    // Check for repetitive single-word or letter spam (e.g. dsdasdadsasdasdasdasd)
    const uniqueChars = new Set(trimmed.toLowerCase().replace(/[^a-z0-9]/g, "")).size;
    if (uniqueChars < 4) return true;
    return false;
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        description: `Milestone ${prev.length + 1}`,
        amount: 50,
        deadlineDays: 3,
      },
    ]);
  };

  const autoBalanceMilestones = () => {
    if (milestones.length === 0) return;
    if (milestones.length === 1) {
      setMilestones([{ ...milestones[0]!, amount: bidAmount }]);
      return;
    }
    const perMilestone = Math.floor((bidAmount / milestones.length) * 100) / 100;
    const remainder = Math.round((bidAmount - perMilestone * milestones.length) * 100) / 100;
    setMilestones(
      milestones.map((m, idx) => ({
        ...m,
        amount: idx === 0 ? perMilestone + remainder : perMilestone,
      }))
    );
    toast.success("Milestones auto-balanced to match bid amount!");
  };

  const removeMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (
    index: number,
    field: keyof MilestoneInput,
    value: string | number
  ) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGibberish(coverLetter)) {
      toast.error(
        "Please provide a meaningful cover letter pitch (at least 30 characters & 4 words describing your proposal)."
      );
      return;
    }
    if (bidAmount <= 0) {
      toast.error("Please enter a valid bid amount.");
      return;
    }
    if (!sumMatches) {
      toast.error(
        `Milestone sum ($${milestoneSum}) does not match total bid amount ($${bidAmount}). Please balance milestones.`
      );
      return;
    }
    if (deliveryDays <= 0) {
      toast.error("Delivery time must be at least 1 day.");
      return;
    }
    const invalidMilestoneDesc = milestones.find((m) => !m.description.trim() || m.description.trim().length < 5);
    if (invalidMilestoneDesc) {
      toast.error("Each milestone must have a clear description (at least 5 characters).");
      return;
    }
    if (!stripeConnected) {
      toast.error("Please connect your Stripe / Payment Account before submitting proposals.");
      return;
    }

    setSubmitting(true);
    try {
      await createProposal({
        gigId: gig.id,
        gigTitle: gig.title,
        freelancerId: user.role === "freelancer" ? user.uid : gig.freelancerId,
        freelancerName: user.role === "freelancer" ? user.name : gig.freelancerName,
        freelancerAvatar: user.role === "freelancer" ? user.profileImage : gig.freelancerAvatar,
        freelancerRating: user.role === "freelancer" ? (user.rating ?? 5.0) : gig.freelancerRating,
        clientId: user.role === "client" ? user.uid : "client_generic",
        clientName: user.role === "client" ? user.name : "Interested Client",
        coverLetter,
        bidAmount,
        deliveryDays,
        milestones,
      });

      toast.success("Proposal submitted successfully!");
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error("Proposal submission error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to submit proposal."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const [stripeSetupOpen, setStripeSetupOpen] = React.useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="w-full">
              <Send className="size-4 mr-2" />
              Submit Proposal
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Submit Proposal for {gig.title}</DialogTitle>
            <DialogDescription>
              Specify your cover letter, bid amount, timeline, and milestone breakdown.
            </DialogDescription>
          </DialogHeader>

          {/* Stripe Payment Connection Banner */}
          {!stripeConnected ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between text-amber-500 font-bold">
                <span>⚠️ Stripe / Payment Account Required</span>
                <span className="text-[10px] uppercase bg-amber-500/20 px-2 py-0.5 rounded-full">
                  Action Needed
                </span>
              </div>
              <p className="text-foreground/80">
                ChainWork requires a verified Stripe account with legal name, email, account ID, and payout routing details to process smart contract escrows.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => setStripeSetupOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs mt-1"
              >
                Enter Stripe Account Details & Connect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                Stripe Payment Account Connected & Verified ({user.stripeAccountEmail || user.email})
              </div>
              <button
                type="button"
                onClick={() => setStripeSetupOpen(true)}
                className="text-[11px] underline font-extrabold hover:text-emerald-300"
              >
                Update Details
              </button>
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Cover Letter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Cover Letter / Pitch *</label>
              <span
                className={`text-xs font-medium ${
                  coverLetter.trim().length < 30 ? "text-amber-500" : "text-emerald-500"
                }`}
              >
                {coverLetter.trim().length} / 30 min chars
              </span>
            </div>
            <Textarea
              placeholder="Describe your technical approach, timeline details, relevant experience, and how you will deliver this project..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              required
              className="text-xs font-medium leading-relaxed"
            />
            {coverLetter.trim().length > 0 && isGibberish(coverLetter) && (
              <p className="text-[11px] font-semibold text-destructive">
                Please enter a meaningful pitch (at least 30 characters and 4 words). Avoid random key repetition.
              </p>
            )}
          </div>

          {/* Pricing & Timeline */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Bid Amount ($) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 size-4 text-foreground/50" />
                <Input
                  type="number"
                  min={1}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="pl-9 text-sm font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Delivery Time (Days) *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 size-4 text-foreground/50" />
                <Input
                  type="number"
                  min={1}
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(Number(e.target.value))}
                  className="pl-9 text-sm font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Milestones Breakdown */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-sm font-semibold">Milestone Breakdown *</label>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span className="text-foreground/60">Milestone Sum:</span>
                  <span
                    className={`font-bold ${
                      sumMatches ? "text-emerald-500" : "text-destructive"
                    }`}
                  >
                    ${milestoneSum.toLocaleString()} / ${bidAmount.toLocaleString()}
                  </span>
                  {!sumMatches && (
                    <button
                      type="button"
                      onClick={autoBalanceMilestones}
                      className="text-[11px] underline font-bold text-amber-500 hover:text-amber-400"
                    >
                      Auto-Balance
                    </button>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addMilestone}
                className="text-xs text-[var(--azure-500)]"
              >
                <Plus className="size-3.5 mr-1" />
                Add Milestone
              </Button>
            </div>

            {!sumMatches && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-semibold">
                ⚠️ Milestone amounts (${milestoneSum}) must sum to the total bid amount (${bidAmount}).
              </div>
            )}

            <div className="space-y-2">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3"
                >
                  <Input
                    placeholder="Milestone scope description (min 5 chars)..."
                    value={m.description}
                    onChange={(e) =>
                      updateMilestone(idx, "description", e.target.value)
                    }
                    className="flex-1 min-w-[180px] h-9 text-xs"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground/60">$</span>
                    <Input
                      type="number"
                      min={1}
                      value={m.amount}
                      onChange={(e) =>
                        updateMilestone(idx, "amount", Number(e.target.value))
                      }
                      className="w-20 h-9 text-xs font-bold"
                      required
                    />
                    <Input
                      type="number"
                      min={1}
                      max={deliveryDays}
                      placeholder="Days"
                      value={m.deadlineDays}
                      onChange={(e) =>
                        updateMilestone(
                          idx,
                          "deadlineDays",
                          Number(e.target.value)
                        )
                      }
                      className="w-16 h-9 text-xs"
                      required
                    />
                    <span className="text-xs text-foreground/50">days</span>
                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMilestone(idx)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              type="submit"
              disabled={
                submitting ||
                !sumMatches ||
                isGibberish(coverLetter) ||
                !stripeConnected
              }
            >
              {submitting ? "Submitting..." : "Submit Proposal"}
            </AzureButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <StripeAccountSetupModal
      open={stripeSetupOpen}
      onOpenChange={setStripeSetupOpen}
      user={user}
      onSuccess={() => {
        setStripeConnected(true);
      }}
    />
    </>
  );
}
