"use client";

import * as React from "react";
import { CheckCircle, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { submitReview } from "@/app/actions/reviews";
import { triggerFraudCheck } from "@/lib/ai/fraud-trigger";
import { AzureButton } from "@/components/ui/azure-button";
import { GlassCard } from "@/components/ui/glass-card";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { findMyReviewForContract } from "@/lib/firebase/reviews";
import type { SerializedReview } from "@/lib/firebase/schema";

interface ContractReviewPanelProps {
  contractId: string;
  contractStatus: string;
  reviewerId: string;
  revieweeId: string;
  revieweeName: string;
}

export function ContractReviewPanel({
  contractId,
  contractStatus,
  reviewerId,
  revieweeId,
  revieweeName,
}: ContractReviewPanelProps) {
  const [existing, setExisting] = React.useState<SerializedReview | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (contractStatus !== "completed") {
      setChecking(false);
      return;
    }
    setChecking(true);
    findMyReviewForContract(contractId, reviewerId)
      .then((found) => {
        if (!cancelled) {
          setExisting(found);
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contractId, contractStatus, reviewerId]);

  if (contractStatus !== "completed") return null;
  if (checking) return null;
  if (existing) return null;

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("Pick a star rating.");
      return;
    }
    if (comment.trim().length < 20) {
      toast.error("Share at least 20 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({
        contractId,
        revieweeId,
        rating,
        comment: comment.trim(),
      });
      toast.success("Review submitted.");
      // Check both the reviewer (sock-puppet patterns) and reviewee
      // (review-bombing patterns).
      triggerFraudCheck();
      triggerFraudCheck(revieweeId);
      // Mark locally so the panel disappears even before any refetch.
      setExisting({
        id: "local",
        reviewerId,
        reviewerName: "",
        reviewerAvatar: null,
        revieweeId,
        revieweeName,
        revieweeAvatar: null,
        contractId,
        contractTitle: "",
        gigId: null,
        rating,
        comment: comment.trim(),
        createdAt: Date.now(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not submit review.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard
      variant="elevated"
      className="border-emerald-500/30 p-5 space-y-4 shadow-[0_0_24px_rgba(16,185,129,0.15)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="inline-flex items-center gap-2 text-base font-semibold">
            <Star className="size-4 text-emerald-500" />
            Leave a review for {revieweeName}
          </h3>
          <p className="mt-1 text-xs text-foreground/60">
            Public reviews help others on the platform decide who to work with.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="size-3" />
          Contract complete
        </span>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-foreground/50">
          Your rating
        </div>
        <div className="mt-2">
          <StarRating
            value={rating}
            onChange={setRating}
            size="lg"
          />
        </div>
      </div>

      <div>
        <Textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience — communication, quality of work, deadlines met…"
          disabled={submitting}
          maxLength={1000}
        />
        <div className="mt-1 text-[11px] text-foreground/50">
          {comment.trim().length} / 1000 · minimum 20 characters
        </div>
      </div>

      <div className="flex justify-end">
        <AzureButton
          type="button"
          onClick={() => void handleSubmit()}
          disabled={
            submitting || rating === 0 || comment.trim().length < 20
          }
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit review"
          )}
        </AzureButton>
      </div>
    </GlassCard>
  );
}
