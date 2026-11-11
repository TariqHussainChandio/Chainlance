"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  createGig,
  publishGig,
  updateGig,
} from "@/lib/firebase/gigs";
import { uploadToCloudinary } from "@/lib/cloudinary/upload-helpers";
import { triggerFraudCheck } from "@/lib/ai/fraud-trigger";

import {
  GigForm,
  type GigFormIntent,
} from "../_components/gig-form";

export default function NewGigPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  async function handleSubmit(
    values: Parameters<Parameters<typeof GigForm>[0]["onSubmit"]>[0],
    file: File | null,
    intent: GigFormIntent
  ) {
    if (!user) {
      toast.error("You must be signed in to create a gig.");
      return;
    }
    try {
      const gigId = await createGig(user, values);

      if (file) {
        try {
          const { url } = await uploadToCloudinary(file, "gigs");
          await updateGig(gigId, user.uid, { thumbnailUrl: url });
          toast.success("Gig thumbnail uploaded successfully.");
        } catch (uploadErr) {
          console.warn("Gig thumbnail upload error:", uploadErr);
          toast.error("Could not process thumbnail, but gig saved successfully.");
        }
      }

      if (intent === "publish") {
        await publishGig(gigId, user.uid);
        toast.success("Gig published.");
      } else {
        toast.success("Draft saved.");
      }

      // Fire-and-forget fraud check on the freelancer.
      triggerFraudCheck(user.uid);

      router.push("/freelancer/gigs");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not save your gig. Please try again.";
      toast.error(msg);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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

  if (!user) {
    return (
      <GlassCard className="p-8 text-sm">
        You need to be signed in to create a gig.
      </GlassCard>
    );
  }

  if (user.role !== "freelancer") {
    return (
      <GlassCard className="p-8 text-sm">
        Only freelancers can create gigs.
      </GlassCard>
    );
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
          Create a new gig
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Fill in the details, preview on the right, then save as draft or
          publish.
        </p>
      </div>

      <GigForm mode="create" user={user} onSubmit={handleSubmit} />
    </div>
  );
}
