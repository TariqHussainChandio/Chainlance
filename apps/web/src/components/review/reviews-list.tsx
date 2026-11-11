"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  listReviewsByReviewer,
  listReviewsForUser,
} from "@/lib/firebase/reviews";
import type { SerializedReview } from "@/lib/firebase/schema";
import { formatRelativeTime } from "@/lib/format-time";

type Tab = "received" | "given";
type Role = "client" | "freelancer";

interface ReviewsListProps {
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

export function ReviewsList({ role }: ReviewsListProps) {
  const { user, loading: userLoading } = useCurrentUser();
  const [tab, setTab] = React.useState<Tab>("received");
  const [received, setReceived] = React.useState<SerializedReview[]>([]);
  const [given, setGiven] = React.useState<SerializedReview[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listReviewsForUser(user.uid),
      listReviewsByReviewer(user.uid),
    ])
      .then(([r, g]) => {
        if (cancelled) return;
        setReceived(r);
        setGiven(g);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, userLoading]);

  const list = tab === "received" ? received : given;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reviews</h1>
        <p className="mt-1 text-sm text-foreground/60">
          {role === "client"
            ? "What freelancers said about you, and your reviews of them."
            : "What clients said about you, and your reviews of them."}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="received" className="gap-2">
            Received
            <Count value={received.length} />
          </TabsTrigger>
          <TabsTrigger value="given" className="gap-2">
            Given
            <Count value={given.length} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading || userLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <ReviewCard key={r.id} review={r} tab={tab} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-[var(--glass-border)] bg-foreground/5 px-1.5 text-[10px] font-semibold text-foreground/60">
      {value}
    </span>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <GlassCard className="p-10 text-center space-y-3">
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[color:var(--azure-500)]/10 text-[color:var(--azure-500)]">
        <MessageSquare className="size-6" />
      </span>
      <div>
        <h3 className="text-base font-semibold">
          {tab === "received" ? "No reviews yet" : "You haven't reviewed anyone yet"}
        </h3>
        <p className="mt-1 text-sm text-foreground/60">
          {tab === "received"
            ? "Reviews appear once contracts complete and the other party submits one."
            : "Reviews are available on completed contracts."}
        </p>
      </div>
    </GlassCard>
  );
}

interface ReviewCardProps {
  review: SerializedReview;
  tab: Tab;
  role: Role;
}

function ReviewCard({ review, tab, role }: ReviewCardProps) {
  // On "Received" we display the reviewer; on "Given" we display the reviewee.
  const displayName =
    tab === "received" ? review.reviewerName : review.revieweeName;
  const displayAvatar =
    tab === "received" ? review.reviewerAvatar : review.revieweeAvatar;
  const displayRoleLabel =
    tab === "received" ? "From" : "To";

  return (
    <GlassCard className="p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            {displayAvatar ? (
              <AvatarImage src={displayAvatar} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-xs">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground/50">
              {displayRoleLabel}
            </div>
            <div className="text-sm font-medium leading-none">{displayName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} size="sm" readOnly />
          <span className="text-xs text-foreground/50">
            {formatRelativeTime(review.createdAt)}
          </span>
        </div>
      </div>

      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
        {review.comment}
      </p>

      <div className="flex items-center gap-2 text-xs text-foreground/50">
        <span>For contract:</span>
        <Link
          href={`/${role}/contracts/${review.contractId}`}
          className="inline-flex items-center gap-1 text-[color:var(--azure-600)] hover:text-[color:var(--azure-500)]"
        >
          <Star className="size-3" />
          {review.contractTitle || "View contract"}
        </Link>
      </div>
    </GlassCard>
  );
}
