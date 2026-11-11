"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  deleteGig,
  getGigById,
  updateGig,
} from "@/lib/firebase/gigs";
import type { Gig } from "@/lib/firebase/schema";
import { uploadToCloudinary } from "@/lib/cloudinary/upload-helpers";
import type { GigInput } from "@/lib/schemas/gig-schema";

import {
  GigForm,
  type GigFormIntent,
} from "../../_components/gig-form";

function gigToFormDefaults(gig: Gig): Partial<GigInput> {
  return {
    title: gig.title,
    description: gig.description,
    category: gig.category as GigInput["category"],
    skills: gig.skills,
    pricingBasic: gig.pricingBasic,
    pricingStandard: gig.pricingStandard,
    pricingPremium: gig.pricingPremium,
    deliveryDays: gig.deliveryDays,
  };
}

export default function EditGigPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const gigId = params?.id;
  const { user, loading: userLoading } = useCurrentUser();

  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const fetchGig = useCallback(async () => {
    if (!gigId) return;
    setLoading(true);
    try {
      const result = await getGigById(gigId);
      if (!result) {
        setNotFound(true);
        setGig(null);
        return;
      }
      setGig(result);
    } catch (err) {
      console.warn("fetchGig error:", err);
      toast.error("Network issue loading gig. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [gigId]);

  useEffect(() => {
    void fetchGig();
  }, [fetchGig]);

  // Ownership guard (defense in depth — rules also enforce).
  useEffect(() => {
    if (loading || userLoading) return;
    if (!gig || !user) return;
    if (gig.freelancerId !== user.uid) {
      toast.error("You can only edit your own gigs.");
      router.replace("/freelancer/gigs");
    }
  }, [loading, userLoading, gig, user, router]);

  async function handleSubmit(
    values: GigInput,
    file: File | null,
    _intent: GigFormIntent
  ) {
    void _intent;
    if (!user || !gigId) return;
    try {
      await updateGig(gigId, user.uid, values);
      if (file) {
        try {
          const { url } = await uploadToCloudinary(file, "gigs");
          await updateGig(gigId, user.uid, { thumbnailUrl: url });
          toast.success("Thumbnail updated successfully.");
        } catch (uploadErr) {
          console.warn("Gig thumbnail upload error:", uploadErr);
          toast.error("Could not process thumbnail image.");
        }
      }
      toast.success("Gig updated.");
      router.push("/freelancer/gigs");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not save changes. Please try again.";
      toast.error(msg);
    }
  }

  async function handleDelete() {
    if (!user || !gigId) return;
    setDeleting(true);
    try {
      await deleteGig(gigId, user.uid);
      toast.success("Gig deleted.");
      router.push("/freelancer/gigs");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not delete gig.";
      toast.error(msg);
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  }

  if (loading || userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (notFound || !gig) {
    return (
      <GlassCard className="p-8 text-sm">
        <h2 className="text-lg font-semibold">Gig not found</h2>
        <p className="mt-1 text-foreground/60">
          It may have been deleted, or the link is wrong.
        </p>
        <div className="mt-4">
          <Link
            href="/freelancer/gigs"
            className="text-sm text-[var(--azure-600)] hover:text-[var(--azure-500)]"
          >
            Back to my gigs
          </Link>
        </div>
      </GlassCard>
    );
  }

  if (!user || gig.freelancerId !== user.uid) {
    // Render nothing while the redirect in useEffect runs.
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/freelancer/gigs"
          className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to my gigs
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Edit gig
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Changes go live as soon as you save. Status &rarr; {gig.status}.
        </p>
      </div>

      <GigForm
        mode="edit"
        user={user}
        defaultValues={gigToFormDefaults(gig)}
        initialThumbnailUrl={gig.thumbnailUrl}
        onSubmit={handleSubmit}
      />

      <GlassCard className="border-destructive/30 p-6">
        <h2 className="text-base font-semibold text-destructive">
          Danger zone
        </h2>
        <p className="mt-1 text-xs text-foreground/60">
          Deleting a gig is permanent. Any in-flight contracts referencing it
          will keep working, but the listing disappears from the marketplace.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={deleting}
          >
            <Trash2 className="size-4" />
            Delete this gig
          </Button>
        </div>
      </GlassCard>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this gig?</DialogTitle>
            <DialogDescription>
              &ldquo;{gig.title}&rdquo; will be permanently removed along with
              its thumbnail. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete gig"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
