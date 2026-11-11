"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Lock, MessageSquare, RefreshCw, Send, Shield, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { AzureButton } from "@/components/ui/azure-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SubmitProposalDialog } from "@/components/proposal/submit-proposal-dialog";
import { ConnectFreelancerModal } from "@/components/connection/connect-freelancer-modal";
import { StripeAccountSetupModal } from "@/components/payment/stripe-account-setup-modal";
import { checkConnectionAction } from "@/app/actions/connections";
import type { SerializedGig } from "@/lib/firebase/schema";
import { cn } from "@/lib/utils";

type Tier = "basic" | "standard" | "premium";

interface PricingSidebarProps {
  gig: SerializedGig;
}

const tierIncludes: Record<Tier, string[]> = {
  basic: [
    "Core deliverable & base files",
    "1 Revision included",
    "Standard delivery speed",
    "Commercial use license",
  ],
  standard: [
    "Everything in Basic",
    "3 Revisions included",
    "Priority turnaround",
    "Source files & vector assets",
    "High resolution deliverables",
  ],
  premium: [
    "Everything in Standard",
    "Unlimited Revisions",
    "Express 24-48h delivery",
    "VIP dedicated support",
    "Complete commercial & IP rights",
    "Full raw source codebase & assets",
  ],
};

const tierDescriptions: Record<Tier, string> = {
  basic: "Essential package for small projects and individual tasks.",
  standard: "Most popular choice for growing businesses needing full scope.",
  premium: "Complete high-end package with priority support and unlimited revisions.",
};

export function PricingSidebar({ gig }: PricingSidebarProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [activeTier, setActiveTier] = React.useState<Tier>("standard");
  const [connectModalOpen, setConnectModalOpen] = React.useState(false);
  const [stripeSetupOpen, setStripeSetupOpen] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = React.useState(false);

  const prices: Record<Tier, number> = {
    basic: gig.pricingBasic,
    standard: gig.pricingStandard,
    premium: gig.pricingPremium,
  };

  const deliveryMultiplier: Record<Tier, number> = {
    basic: gig.deliveryDays,
    standard: Math.max(1, Math.floor(gig.deliveryDays * 0.8)),
    premium: Math.max(1, Math.floor(gig.deliveryDays * 0.5)),
  };

  const orderUrl = `/client/contracts/new?gigId=${encodeURIComponent(gig.id)}&tier=${activeTier}`;

  React.useEffect(() => {
    if (!user || user.role !== "client") {
      setIsConnected(false);
      return;
    }
    let isMounted = true;
    checkConnectionAction(gig.freelancerId)
      .then((res) => {
        if (isMounted) setIsConnected(res.connected);
      })
      .catch(() => {
        if (isMounted) setIsConnected(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user, gig.freelancerId]);

  const handleContinueClick = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "client") {
      toast.error("Only clients can place orders.");
      return;
    }

    setCheckingConnection(true);
    try {
      const res = await checkConnectionAction(gig.freelancerId);
      setIsConnected(res.connected);
      if (res.connected) {
        router.push(orderUrl);
      } else {
        toast.info(`Please connect with ${gig.freelancerName} and get scope approval before placing your order.`);
        setConnectModalOpen(true);
      }
    } catch {
      setConnectModalOpen(true);
    } finally {
      setCheckingConnection(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Fiverr-Style 3-Tab Package Card */}
      <GlassCard variant="elevated" className="overflow-hidden p-0 border-emerald-500/40">
        {/* Tier Selector Tabs */}
        <div className="grid grid-cols-3 border-b border-[var(--glass-border)] bg-black/5 dark:bg-white/5 text-center text-xs font-bold">
          {(["basic", "standard", "premium"] as Tier[]).map((t) => {
            const isSelected = activeTier === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTier(t)}
                className={cn(
                  "py-3 uppercase tracking-wider transition-all relative border-b-2",
                  isSelected
                    ? "border-emerald-500 text-emerald-500 bg-[color:var(--azure-500)]/10 font-extrabold"
                    : "border-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                )}
              >
                {t}
                {t === "standard" && (
                  <span className="absolute -top-1 right-2 text-[9px] font-bold text-amber-500 uppercase">
                    Popular
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Tier Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-500">
              {activeTier} Package
            </span>
            <div className="text-2xl font-extrabold">
              <GradientText>${prices[activeTier].toLocaleString()}</GradientText>
            </div>
          </div>

          <p className="text-xs text-foreground/75 leading-relaxed font-medium">
            {tierDescriptions[activeTier]}
          </p>

          <div className="flex items-center gap-4 text-xs font-bold text-foreground/80 py-2 border-y border-[var(--glass-border)]">
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-emerald-500" />
              <span>{deliveryMultiplier[activeTier]} Days Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="size-4 text-emerald-500" />
              <span>
                {activeTier === "basic"
                  ? "1 Revision"
                  : activeTier === "standard"
                  ? "3 Revisions"
                  : "Unlimited Revisions"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-foreground/50">
              What's Included:
            </div>
            <ul className="space-y-2 text-xs font-semibold text-foreground/85">
              {tierIncludes[activeTier].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Connection Status Badge */}
          {user && user.role === "client" && (
            <div
              className={cn(
                "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between",
                isConnected
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-500"
              )}
            >
              <div className="flex items-center gap-1.5">
                <UserCheck className="size-4" />
                <span>
                  {isConnected
                    ? "Freelancer Connected"
                    : "Connection Required before Order"}
                </span>
              </div>
              {!isConnected && (
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(true)}
                  className="underline text-[11px] hover:text-amber-400 font-extrabold"
                >
                  Connect Now
                </button>
              )}
            </div>
          )}

          <AzureButton
            type="button"
            onClick={handleContinueClick}
            disabled={checkingConnection}
            size="lg"
            className="w-full mt-4"
          >
            {checkingConnection
              ? "Verifying Connection..."
              : `Continue ($${prices[activeTier].toLocaleString()})`}
          </AzureButton>
        </div>
      </GlassCard>

      {/* Action Buttons */}
      {user ? (
        <SubmitProposalDialog
          gig={gig}
          user={user}
          trigger={
            <Button type="button" variant="outline" className="w-full font-bold text-xs h-10">
              <Send className="size-4 mr-2 text-emerald-500" />
              Submit Custom Proposal
            </Button>
          }
        />
      ) : (
        <Button type="button" variant="outline" className="w-full font-bold text-xs h-10" asChild>
          <Link href="/login">
            <Send className="size-4 mr-2 text-emerald-500" />
            Sign In to Submit Proposal
          </Link>
        </Button>
      )}

      <Button type="button" variant="outline" className="w-full font-bold text-xs h-10" asChild>
        <Link href={user ? `/${user.role}/messages` : "/login"}>
          <MessageSquare className="size-4 mr-2 text-emerald-500" />
          Contact Freelancer
        </Link>
      </Button>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl px-3 py-2.5 text-foreground/80">
          <Shield className="size-4 text-emerald-500" />
          Escrow Secured
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl px-3 py-2.5 text-foreground/80">
          <Lock className="size-4 text-emerald-500" />
          Smart Contract
        </div>
      </div>

      {/* Mandatory Connection Modal */}
      {user && (
        <>
          <ConnectFreelancerModal
            open={connectModalOpen}
            onOpenChange={setConnectModalOpen}
            gig={gig}
            user={user}
            onConnected={() => {
              setIsConnected(true);
              router.push(orderUrl);
            }}
          />
          <StripeAccountSetupModal
            open={stripeSetupOpen}
            onOpenChange={setStripeSetupOpen}
            user={user}
            onSuccess={() => {
              toast.success("Stripe Account connected!");
            }}
          />
        </>
      )}
    </div>
  );
}

