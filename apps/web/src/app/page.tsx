import Link from "next/link";
import {
  ArrowRight,
  Bolt,
  Brain,
  Briefcase,
  CheckCircle2,
  Coins,
  FileSearch,
  Layers,
  Link as LinkIcon,
  Mail,
  MessageSquare,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

import { AzureButton } from "@/components/ui/azure-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  FREELANCER_FEE_PERCENTAGE,
  PLATFORM_FEE_PERCENTAGE,
} from "@/lib/payment/platform-fees";

const platformFeePercent = (PLATFORM_FEE_PERCENTAGE * 100).toFixed(0);
const freelancerKeepPercent = ((1 - FREELANCER_FEE_PERCENTAGE) * 100).toFixed(0);

interface Step {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Feature {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: Step[] = [
  {
    title: "AI Matchmaking",
    body: "AI matches your brief with verified talent instantly based on skill overlap and ratings.",
    icon: Brain,
  },
  {
    title: "Smart Escrow",
    body: "Clients lock funds on-chain in smart contracts before work commences.",
    icon: Wallet,
  },
  {
    title: "Proof of Delivery",
    body: "Milestones are delivered with verifiable evidence linked directly to the contract.",
    icon: Sparkles,
  },
  {
    title: "Instant Payout",
    body: "Smart contracts release funds directly to freelancer wallets on approval.",
    icon: CheckCircle2,
  },
];

const features: Feature[] = [
  {
    title: "Smart Contract Escrow",
    body: "Funds are secured on-chain the moment a contract is created. Zero risk for both parties.",
    icon: ShieldCheck,
  },
  {
    title: "AI Recommendation Engine",
    body: "TF-IDF similarity & skill matrix algorithm matches projects to top-rated freelancers.",
    icon: Brain,
  },
  {
    title: "Real-Time Fraud Prevention",
    body: "Eight weighted security signals score accounts in real time to prevent bad actors.",
    icon: Shield,
  },
  {
    title: "Contextual Contract Chat",
    body: "Integrated messaging lives inside each contract so project communication stays organized.",
    icon: MessageSquare,
  },
  {
    title: "Milestone-Based Releases",
    body: "Break jobs into milestones and release payouts seamlessly as each phase completes.",
    icon: Layers,
  },
  {
    title: "Human Dispute SLA",
    body: "Fair admin dispute resolution with complete milestone evidence & conversation history.",
    icon: FileSearch,
  },
];

const freelancerBullets = [
  `Set custom rates, keep ${freelancerKeepPercent}% of earnings`,
  "Guaranteed payouts via smart contract escrow",
  "Build a verified, KYC-backed reputation",
  "AI matches you with high-value clients",
];

const clientBullets = [
  "Funds released strictly upon milestone approval",
  "AI pairs your brief with top 1% talent",
  "Dedicated dispute protection & human review",
  "Zero hidden platform commission fees",
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header / Floating Glass Navbar */}
      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5 sm:py-4">
          <GlassCard className="flex items-center justify-between px-4 sm:px-6 py-3 border-emerald-500/30 shadow-[0_12px_40px_rgba(16,185,129,0.18)]">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="inline-flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-[var(--cyan-accent)] text-white shadow-[0_4px_20px_rgba(16,185,129,0.45)] group-hover:scale-110 transition-transform duration-200">
                <LinkIcon className="size-4 sm:size-5" />
              </span>
              <span className="font-extrabold tracking-tight text-lg sm:text-xl bg-gradient-to-r from-foreground via-foreground to-emerald-500 bg-clip-text">
                ChainWork
              </span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-bold text-foreground/80 md:flex">
              <Link
                href="#how-it-works"
                className="transition-colors hover:text-emerald-400"
              >
                How It Works
              </Link>
              <Link
                href="#features"
                className="transition-colors hover:text-emerald-400"
              >
                Features
              </Link>
              <Link
                href="#for-freelancers"
                className="transition-colors hover:text-emerald-400"
              >
                For Talent
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="px-2 sm:px-3 text-xs sm:text-sm font-bold text-foreground/80 transition-colors hover:text-emerald-400"
              >
                Sign In
              </Link>
              <AzureButton asChild size="sm">
                <Link href="/register">Get Started</Link>
              </AzureButton>
            </div>
          </GlassCard>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 sm:px-6 pt-12 sm:pt-24 pb-12 sm:pb-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div
            className="absolute -top-24 left-1/4 size-96 rounded-full blur-3xl opacity-75 animate-cw-float"
            style={{
              background:
                "radial-gradient(circle at center, var(--blob-a), transparent 70%)",
            }}
          />
          <div
            className="absolute right-1/4 top-32 size-[420px] rounded-full blur-3xl opacity-65"
            style={{
              background:
                "radial-gradient(circle at center, var(--blob-b), transparent 70%)",
            }}
          />
        </div>

        <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-extrabold text-emerald-600 dark:text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
          <span className="relative inline-flex">
            <span className="size-2.5 rounded-full bg-[var(--cyan-accent)]" />
            <span className="absolute inset-0 size-2.5 animate-ping rounded-full bg-[var(--cyan-accent)] opacity-75" />
          </span>
          Next-Gen Web3 & AI Freelance Marketplace
        </div>

        <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight">
          Freelancing,
          <br />
          <GradientText>Secured by Code.</GradientText>
        </h1>

        <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-xl font-semibold text-foreground/80 leading-relaxed">
          Smart contract escrows secure payments. AI matches talent with briefs. You ship exceptional work.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
          <AzureButton asChild size="lg" className="w-full sm:w-auto">
            <Link href="/register?role=freelancer">
              Find Work
              <ArrowRight className="size-5" />
            </Link>
          </AzureButton>
          <Link
            href="/register?role=client"
            className="w-full sm:w-auto text-center rounded-xl border border-emerald-500/40 bg-[var(--glass-bg)] px-7 py-3.5 text-base font-bold text-foreground/90 backdrop-blur-xl transition-all duration-200 hover:text-foreground hover:border-emerald-500 hover:shadow-[0_12px_32px_rgba(16,185,129,0.3)] hover:scale-[1.03]"
          >
            Hire Talent
          </Link>
        </div>

        <div className="mt-14 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-bold text-foreground/80">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 border border-emerald-500/30">
            <Shield className="size-4 text-emerald-400" />
            Escrow Secured
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 border border-emerald-500/30">
            <Bolt className="size-4 text-emerald-400" />
            Instant Settlement
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 border border-emerald-500/30">
            <Coins className="size-4 text-emerald-400" />
            {platformFeePercent}% Platform Fee
          </span>
        </div>
      </section>

      {/* Stat Tiles */}
      <section className="mx-auto w-full max-w-4xl px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <GlassCard className="-rotate-1 p-6 border-emerald-500/30 hover:border-emerald-500">
            <div className="text-xs uppercase font-bold tracking-wider text-foreground/60">
              Platform Fees
            </div>
            <div className="mt-2 text-4xl font-extrabold">
              <GradientText>{platformFeePercent}%</GradientText>
            </div>
            <div className="mt-2 text-xs font-medium text-foreground/70">
              {freelancerKeepPercent}% of earnings go directly to freelancers.
            </div>
          </GlassCard>
          <GlassCard variant="elevated" className="p-6 border-emerald-500">
            <div className="text-xs uppercase font-bold tracking-wider text-foreground/60">
              Settlement Time
            </div>
            <div className="mt-2 text-4xl font-extrabold">
              <GradientText>&lt; 30s</GradientText>
            </div>
            <div className="mt-2 text-xs font-medium text-foreground/70">
              Instant payout execution upon milestone approval.
            </div>
          </GlassCard>
          <GlassCard className="rotate-1 p-6 border-emerald-500/30 hover:border-emerald-500">
            <div className="text-xs uppercase font-bold tracking-wider text-foreground/60">
              AI Match Accuracy
            </div>
            <div className="mt-2 text-4xl font-extrabold">
              <GradientText>96%</GradientText>
            </div>
            <div className="mt-2 text-xs font-medium text-foreground/70">
              Briefs paired with verified talent on first try.
            </div>
          </GlassCard>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-20"
      >
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
              How It Works
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Four steps from job posting to payout.
            </h2>
          </div>
          <Zap className="hidden size-8 text-emerald-500 animate-pulse sm:block" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <GlassCard
                key={step.title}
                className="p-6 relative group overflow-hidden border-t-4 border-t-emerald-500 hover:border-t-emerald-400"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-400/15 text-emerald-400 ring-1 ring-emerald-500/40 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="size-6" />
                  </div>
                  <span className="font-mono text-sm font-extrabold text-emerald-500/80">
                    0{idx + 1}
                  </span>
                </div>
                <div className="mt-6 text-xl font-extrabold">{step.title}</div>
                <p className="mt-2 text-xs text-foreground/75 leading-relaxed font-medium">
                  {step.body}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16"
      >
        <div className="mb-12 text-center">
          <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
            Platform Capabilities
          </div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Engineered for high-performing remote teams.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <GlassCard
                key={f.title}
                className="space-y-4 p-6 group border-emerald-500/20 hover:border-emerald-500/50"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-400/15 text-emerald-400 ring-1 ring-emerald-500/40 group-hover:scale-110 transition-transform duration-200">
                  <Icon className="size-6" />
                </span>
                <div>
                  <div className="text-lg font-extrabold">{f.title}</div>
                  <p className="mt-2 text-xs text-foreground/75 leading-relaxed font-medium">
                    {f.body}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Freelancers vs Clients Split */}
      <section
        id="for-freelancers"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <GlassCard className="space-y-6 p-8 border-emerald-500/40">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              <Briefcase className="size-4" />
              For Freelancers
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight">
              Get hired, get paid, keep {freelancerKeepPercent}%.
            </h3>
            <ul className="space-y-3.5 text-sm font-semibold text-foreground/85">
              {freelancerBullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <AzureButton asChild size="lg">
              <Link href="/register?role=freelancer">
                Start Earning Now
                <ArrowRight className="size-5" />
              </Link>
            </AzureButton>
          </GlassCard>

          <GlassCard className="space-y-6 p-8 border-teal-500/40">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/40 bg-teal-500/20 px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-teal-300">
              <Search className="size-4" />
              For Clients & Hirers
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight">
              Ship projects without friction.
            </h3>
            <ul className="space-y-3.5 text-sm font-semibold text-foreground/85">
              {clientBullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-teal-300" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <AzureButton asChild size="lg">
              <Link href="/register?role=client">
                Find Top Talent
                <ArrowRight className="size-5" />
              </Link>
            </AzureButton>
          </GlassCard>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 sm:py-16 text-center">
        <GlassCard variant="elevated" className="space-y-6 p-6 sm:p-8 md:p-12 border-emerald-500">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Ready to experience <GradientText>freelancing, secured by code?</GradientText>
          </h2>
          <p className="mx-auto max-w-lg text-xs sm:text-sm font-semibold text-foreground/75">
            Join thousands of freelancers and clients building the future of remote work.
          </p>
          <AzureButton asChild size="lg" className="w-full sm:w-auto">
            <Link href="/register">
              Get Started Free Today
              <ArrowRight className="size-5" />
            </Link>
          </AzureButton>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-12">
        <GlassCard className="space-y-8 px-4 sm:px-8 py-6 sm:py-8 border-emerald-500/20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-3 group">
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-[var(--cyan-accent)] text-white shadow-[0_4px_20px_rgba(16,185,129,0.45)] group-hover:scale-105 transition-transform duration-200">
                  <LinkIcon className="size-4" />
                </span>
                <span className="font-extrabold tracking-tight text-xl bg-gradient-to-r from-foreground via-foreground to-emerald-500 bg-clip-text">
                  ChainWork
                </span>
              </Link>
              <p className="text-xs text-foreground/65 font-medium leading-relaxed">
                Smart contract powered freelance marketplace. {platformFeePercent}% platform fee, AI-powered matchmaking, and instant escrow settlements.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Product
              </div>
              <ul className="space-y-2 text-xs font-semibold text-foreground/75">
                <li>
                  <Link href="/how-it-works" className="hover:text-emerald-400">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-emerald-400">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-emerald-400">
                    Sign up
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-emerald-400">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3 text-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Legal & Support
              </div>
              <ul className="space-y-2 text-xs font-semibold text-foreground/75">
                <li>
                  <Link href="/contact" className="hover:text-emerald-400">
                    Contact Us & Support
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-emerald-400">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-emerald-400">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-emerald-400">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-start justify-between gap-3 border-t border-[var(--glass-border)] pt-4 sm:flex-row sm:items-center">
            <div className="text-xs font-medium text-foreground/60">
              © {new Date().getFullYear()} ChainWork. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-foreground/60">
              <Link href="/terms" className="hover:text-emerald-400">Terms</Link>
              <Link href="/privacy" className="hover:text-emerald-400">Privacy</Link>
              <Link href="/cookies" className="hover:text-emerald-400">Cookies</Link>
              <Link href="/contact" className="hover:text-emerald-400">Contact</Link>
            </div>
          </div>
        </GlassCard>
      </footer>
    </div>
  );
}
