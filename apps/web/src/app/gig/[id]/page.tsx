import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { GigCard, GigThumbnail } from "@/components/gig-card";
import {
  getGigByIdAdmin,
  getSimilarGigsAdmin,
} from "@/lib/firebase/admin-gigs";
import { getUserByIdAdmin } from "@/lib/firebase/admin-users";
import { getReviewsForUserAdmin } from "@/lib/firebase/admin-reviews";
import {
  serializeGig,
  serializeUser,
} from "@/lib/firebase/serialize";

import { GigDetailTabs } from "./_components/gig-detail-tabs";
import { PricingSidebar } from "./_components/pricing-sidebar";

interface PageProps {
  params: Promise<{ id: string }>;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

function formatMemberSince(createdAtMs: number | null): string | null {
  if (createdAtMs === null || createdAtMs === 0) return null;
  try {
    return new Date(createdAtMs).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  } catch {
    return null;
  }
}

export default async function GigDetailPage({ params }: PageProps) {
  const { id } = await params;

  const rawGig = await getGigByIdAdmin(id);
  if (!rawGig || rawGig.status !== "published") {
    notFound();
  }

  const [rawFreelancer, rawSimilarGigs, reviews] = await Promise.all([
    getUserByIdAdmin(rawGig.freelancerId),
    getSimilarGigsAdmin(rawGig.category, rawGig.id, 4),
    getReviewsForUserAdmin(rawGig.freelancerId, 50),
  ]);

  const gig = serializeGig(rawGig);
  const freelancer = rawFreelancer ? serializeUser(rawFreelancer) : null;
  const similarGigs = rawSimilarGigs.map(serializeGig);

  const verified = (gig.freelancerRating ?? 0) >= 4.5;
  const memberSince = freelancer
    ? formatMemberSince(freelancer.createdAt)
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-foreground/60">
        <Link href="/client/browse" className="hover:text-foreground">
          Browse
        </Link>
        <ChevronRight className="size-3" />
        <Link
          href={`/client/browse?category=${encodeURIComponent(gig.category)}`}
          className="hover:text-foreground"
        >
          {gig.category}
        </Link>
        <ChevronRight className="size-3" />
        <span className="truncate text-foreground/80">{gig.title}</span>
      </nav>

      {/* Title + freelancer */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {gig.title}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <Avatar className="size-10">
              {gig.freelancerAvatar ? (
                <AvatarImage
                  src={gig.freelancerAvatar}
                  alt={gig.freelancerName}
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-xs">
                {initials(gig.freelancerName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{gig.freelancerName}</span>
                {verified && (
                  <BadgeCheck className="size-4 text-[var(--azure-500)]" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-foreground/70">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">
                  {(gig.freelancerRating ?? 0).toFixed(1)}
                </span>
                <span className="text-foreground/50">
                  ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Image gallery */}
          <GlassCard className="overflow-hidden p-0">
            <div className="relative aspect-video w-full">
              <GigThumbnail url={gig.thumbnailUrl} title={gig.title} />
            </div>
          </GlassCard>

          {/* Tabs (client) */}
          <GigDetailTabs
            gig={gig}
            freelancer={freelancer}
            memberSinceLabel={memberSince}
            reviews={reviews}
          />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <PricingSidebar gig={gig} />
        </div>
      </div>

      {/* Similar gigs */}
      {similarGigs.length > 0 ? (
        <section className="mt-16">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Similar gigs
            </h2>
            <Link
              href={`/client/browse?category=${encodeURIComponent(gig.category)}`}
              className="text-sm text-[var(--azure-600)] hover:text-[var(--azure-500)]"
            >
              See all in {gig.category}
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarGigs.map((g) => (
              <GigCard key={g.id} gig={g} variant="marketplace" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
