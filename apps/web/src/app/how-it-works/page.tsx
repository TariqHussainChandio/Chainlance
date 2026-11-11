import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileCheck,
  Lock,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

import { AzureButton } from "@/components/ui/azure-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";

const STEPS = [
  {
    step: "01",
    title: "Post a Brief or Browse Services",
    desc: "Clients post job briefs or explore Fiverr-style talent services. Freelancers list custom gigs with transparent tiered pricing.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "AI-Powered Matchmaking",
    desc: "Our TF-IDF recommendation engine pairs clients with top-rated, verified freelancers based on skill matrix and rating history.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Fund Smart Contract Escrow",
    desc: "Before work starts, client funds are securely locked in an on-chain smart contract escrow. Money is protected for both parties.",
    icon: Wallet,
  },
  {
    step: "04",
    title: "Contextual Chat & Delivery",
    desc: "All communication lives inside the contract workspace with active PII protection to prevent scam risks.",
    icon: FileCheck,
  },
  {
    step: "05",
    title: "Instant Payout Release",
    desc: "Once milestones are approved, smart contracts release funds directly to freelancer wallets in under 30 seconds.",
    icon: CheckCircle2,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-12">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-bold text-emerald-500 hover:text-emerald-400"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex size-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Zap className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              How ChainWork Works
            </h1>
            <p className="text-sm font-semibold text-foreground/60">
              The next-generation Web3 & AI freelance marketplace.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <GlassCard
              key={s.step}
              className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6 border-emerald-500/30 hover:border-emerald-500"
            >
              <span className="font-mono text-2xl font-extrabold text-emerald-500">
                {s.step}
              </span>
              <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Icon className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-1 text-xs font-semibold text-foreground/75 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard variant="elevated" className="p-8 text-center space-y-6 border-emerald-500">
        <h2 className="text-3xl font-extrabold">
          Ready to experience <GradientText>freelancing, secured by code?</GradientText>
        </h2>
        <AzureButton asChild size="lg">
          <Link href="/register">
            Get Started Free Now
            <ArrowRight className="size-5" />
          </Link>
        </AzureButton>
      </GlassCard>
    </div>
  );
}
