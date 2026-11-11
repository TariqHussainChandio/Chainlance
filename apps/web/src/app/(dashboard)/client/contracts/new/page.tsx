import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ContractWizard } from "@/components/contract/contract-wizard";
import { getGigByIdAdmin } from "@/lib/firebase/admin-gigs";
import { serializeGig } from "@/lib/firebase/serialize";

type Tier = "basic" | "standard" | "premium";
const VALID_TIERS = new Set<Tier>(["basic", "standard", "premium"]);

interface PageProps {
  searchParams: Promise<{ gigId?: string; tier?: string }>;
}

function coerceTier(input: string | undefined): Tier {
  if (input && VALID_TIERS.has(input as Tier)) return input as Tier;
  return "standard";
}

export default async function NewContractPage({ searchParams }: PageProps) {
  const { gigId, tier: rawTier } = await searchParams;
  if (!gigId) redirect("/client/browse");

  const rawGig = await getGigByIdAdmin(gigId);
  if (!rawGig || rawGig.status !== "published") {
    redirect("/client/browse");
  }

  const gig = serializeGig(rawGig);
  const tier = coerceTier(rawTier);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/gig/${gig.id}`}
          className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to gig
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create contract
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Define the scope, fund the escrow, and lock in the work.
        </p>
      </div>

      <ContractWizard gig={gig} tier={tier} />
    </div>
  );
}
