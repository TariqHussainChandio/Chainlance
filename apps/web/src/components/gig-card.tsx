"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import {
  deleteGig,
  publishGig,
  unpublishGig,
} from "@/lib/firebase/gigs";
import type { Gig, GigStatus } from "@/lib/firebase/schema";
import { cn } from "@/lib/utils";

export type GigCardVariant = "marketplace" | "manage";

export type GigCardGig = Omit<Gig, "createdAt" | "updatedAt">;

interface GigCardProps {
  gig: GigCardGig;
  variant?: GigCardVariant;
  currentUserId?: string;
  onChanged?: () => void;
  className?: string;
  disableLink?: boolean;
  aiMatch?: number;
  aiExplanation?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

function priceLabel(price: number): string {
  return `$${price.toLocaleString()}`;
}

const statusBadgeStyles: Record<GigStatus, string> = {
  draft:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  published:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  unpublished:
    "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
};

export function GigThumbnail({
  url,
  title,
  className,
}: {
  url: string | null;
  title: string;
  className?: string;
}) {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [url]);

  if (url && !imageError) {
    const isLocalOrData =
      url.startsWith("blob:") ||
      url.startsWith("data:") ||
      url.startsWith("http://localhost");
    if (isLocalOrData) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={title}
          onError={() => setImageError(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300",
            className
          )}
        />
      );
    }
    return (
      <Image
        src={url}
        alt={title}
        fill
        unoptimized
        onError={() => setImageError(true)}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className={cn(
          "object-cover group-hover:scale-105 transition-transform duration-300",
          className
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-[var(--cyan-accent)]/20 group-hover:scale-105 transition-transform duration-300",
        className
      )}
    >
      <span className="text-6xl font-extrabold leading-none">
        <GradientText>{title ? title.charAt(0).toUpperCase() : "?"}</GradientText>
      </span>
    </div>
  );
}

interface ManageMenuProps {
  gig: GigCardGig;
  currentUserId: string;
  onChanged?: () => void;
}

function ManageMenu({ gig, currentUserId, onChanged }: ManageMenuProps) {
  const [pending, setPending] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function run(action: () => Promise<void>, successMsg: string) {
    if (pending) return;
    setPending(true);
    try {
      await action();
      toast.success(successMsg);
      onChanged?.();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    await run(() => deleteGig(gig.id, currentUserId), "Gig deleted.");
    setConfirmOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Gig actions"
            className="inline-flex size-8 items-center justify-center rounded-lg backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-foreground/80 hover:text-foreground transition-all"
          >
            <MoreVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/freelancer/gigs/${gig.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          {gig.status === "published" ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void run(
                  () => unpublishGig(gig.id, currentUserId),
                  "Gig unpublished."
                );
              }}
            >
              <EyeOff className="size-4" />
              Unpublish
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void run(
                  () => publishGig(gig.id, currentUserId),
                  "Gig published."
                );
              }}
            >
              <Eye className="size-4" />
              Publish
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this gig?</DialogTitle>
            <DialogDescription>
              &ldquo;{gig.title}&rdquo; will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={pending}
            >
              {pending ? "Deleting…" : "Delete gig"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function GigCard({
  gig,
  variant = "marketplace",
  currentUserId,
  onChanged,
  className,
  disableLink = false,
  aiMatch,
  aiExplanation,
}: GigCardProps) {
  const verified = (gig.freelancerRating ?? 0) >= 4.5;
  const visibleSkills = gig.skills.slice(0, 3);
  const extraSkillCount = Math.max(gig.skills.length - 3, 0);
  const showAiBadge =
    variant === "marketplace" &&
    typeof aiMatch === "number" &&
    aiMatch >= 0.3;

  const body = (
    <GlassCard
      className={cn(
        "group flex h-full flex-col overflow-hidden p-0 transition-all duration-300 border-emerald-500/20 hover:border-emerald-500/50",
        "hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(16,185,129,0.22)]",
        className
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <GigThumbnail url={gig.thumbnailUrl} title={gig.title} />
        {variant === "manage" && (
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border capitalize backdrop-blur-xl text-xs font-semibold",
                statusBadgeStyles[gig.status]
              )}
            >
              {gig.status}
            </Badge>
          </div>
        )}
        {showAiBadge && (
          <span
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-xl shadow-[0_0_16px_rgba(16,185,129,0.4)]"
            title={`AI ranked: ${Math.round((aiMatch ?? 0) * 100)}% match`}
          >
            <Sparkles className="size-3 text-emerald-400" />
            AI Match {Math.round((aiMatch ?? 0) * 100)}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {variant === "marketplace" ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
            <Avatar className="size-6 ring-1 ring-emerald-500/30">
              {gig.freelancerAvatar ? (
                <AvatarImage
                  src={gig.freelancerAvatar}
                  alt={gig.freelancerName}
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-[10px] font-bold">
                {initials(gig.freelancerName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{gig.freelancerName}</span>
            {verified && (
              <BadgeCheck className="size-4 text-emerald-500" />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-500">
              {gig.category}
            </span>
            {currentUserId ? (
              <ManageMenu
                gig={gig}
                currentUserId={currentUserId}
                onChanged={onChanged}
              />
            ) : null}
          </div>
        )}

        <h3 className="line-clamp-2 text-base font-bold leading-snug group-hover:text-emerald-500 transition-colors">
          {gig.title}
        </h3>

        {variant === "marketplace" && aiExplanation ? (
          <p className="-mt-1 text-[11px] font-medium italic text-emerald-500/90">
            {aiExplanation}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300"
            >
              {s}
            </span>
          ))}
          {extraSkillCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground/60">
              +{extraSkillCount} more
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground/80">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span>{(gig.freelancerRating ?? 0).toFixed(1)}</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">
              Starting at
            </div>
            <div className="text-lg font-extrabold leading-tight">
              <GradientText>{priceLabel(gig.pricingBasic)}</GradientText>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  if (variant === "marketplace" && !disableLink) {
    return (
      <Link
        href={`/gig/${gig.id}`}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-2xl"
      >
        {body}
      </Link>
    );
  }

  return body;
}
