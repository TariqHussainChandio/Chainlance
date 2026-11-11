"use client";

import * as React from "react";
import { BadgeCheck, CheckCircle2, MessageSquare, Sparkles, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { StarRating } from "@/components/ui/star-rating";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type {
  SerializedGig,
  SerializedReview,
  SerializedUser,
} from "@/lib/firebase/schema";
import { formatRelativeTime } from "@/lib/format-time";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

interface GigDetailTabsProps {
  gig: SerializedGig;
  freelancer: SerializedUser | null;
  memberSinceLabel: string | null;
  reviews: SerializedReview[];
}

const whatsIncluded = [
  "Initial discovery call to scope the work",
  "Source files and full handoff documentation",
  "Up to 3 revisions during delivery",
];

const whatINeed = [
  "A brief describing your goals and constraints",
  "Brand assets, references, or examples (optional)",
  "Access to any third-party services if relevant",
];

export function GigDetailTabs({
  gig,
  freelancer,
  memberSinceLabel,
  reviews,
}: GigDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="about">About seller</TabsTrigger>
        <TabsTrigger value="reviews" className="gap-2">
          Reviews
          <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-[var(--glass-border)] bg-foreground/5 px-1.5 text-[10px] font-semibold text-foreground/60">
            {reviews.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <GlassCard className="p-6">
          <h2 className="text-base font-semibold">About this gig</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {gig.description}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-base font-semibold">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {gig.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full border border-[var(--glass-border)] bg-[color:var(--azure-500)]/10 px-3 py-1 text-sm font-medium text-[color:var(--azure-700)] dark:text-[color:var(--azure-300)] backdrop-blur-xl"
              >
                {skill}
              </span>
            ))}
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">What&apos;s included</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              {whatsIncluded.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--azure-500)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">What I need from you</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              {whatINeed.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--azure-500)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </TabsContent>

      <TabsContent value="about" className="space-y-4">
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-16">
              {gig.freelancerAvatar ? (
                <AvatarImage
                  src={gig.freelancerAvatar}
                  alt={gig.freelancerName}
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white">
                {initials(gig.freelancerName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{gig.freelancerName}</h3>
                {(gig.freelancerRating ?? 0) >= 4.5 && (
                  <BadgeCheck className="size-4 text-[var(--azure-500)]" />
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-foreground/70">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">
                  {(gig.freelancerRating ?? 0).toFixed(1)}
                </span>
                <span className="text-foreground/50">({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
              </div>
            </div>
          </div>

          {freelancer?.bio ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {freelancer.bio}
            </p>
          ) : (
            <p className="mt-4 text-sm italic text-foreground/50">
              This freelancer hasn&apos;t written a bio yet.
            </p>
          )}

          {freelancer?.skills && freelancer.skills.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-wider text-foreground/50">
                Top skills
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {freelancer.skills.slice(0, 8).map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-full border border-[var(--glass-border)] bg-[color:var(--azure-500)]/10 px-2.5 py-0.5 text-xs font-medium text-[color:var(--azure-700)] dark:text-[color:var(--azure-300)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-[var(--glass-border)] pt-4">
            <Stat
              label="Completion rate"
              value={
                typeof freelancer?.completionRate === "number"
                  ? `${Math.round(freelancer.completionRate * 100)}%`
                  : "—"
              }
            />
            <Stat label="Total contracts" value="0" />
            <Stat label="Member since" value={memberSinceLabel ?? "—"} />
          </div>
        </GlassCard>
      </TabsContent>

      <TabsContent value="reviews" className="space-y-4">
        {reviews.length === 0 ? (
          <GlassCard className="p-10 text-center space-y-2">
            <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[color:var(--azure-500)]/10 text-[color:var(--azure-500)]">
              <MessageSquare className="size-6" />
            </span>
            <h3 className="text-base font-semibold">No reviews yet</h3>
            <p className="text-sm text-foreground/60">
              Reviews appear here once contracts complete.
            </p>
          </GlassCard>
        ) : (
          reviews.map((r) => (
            <GlassCard key={r.id} className="p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    {r.reviewerAvatar ? (
                      <AvatarImage
                        src={r.reviewerAvatar}
                        alt={r.reviewerName}
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-[11px]">
                      {initials(r.reviewerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium leading-none">
                      {r.reviewerName}
                    </div>
                    <div className="mt-1 text-[11px] text-foreground/50">
                      {formatRelativeTime(r.createdAt)}
                    </div>
                  </div>
                </div>
                <StarRating value={r.rating} size="sm" readOnly />
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {r.comment}
              </p>
            </GlassCard>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-foreground/50">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
