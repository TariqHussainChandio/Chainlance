import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-bold text-emerald-500 hover:text-emerald-400"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Lock className="size-5 sm:size-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs font-semibold text-foreground/60">
              Last updated: July 2026
            </p>
          </div>
        </div>
      </div>

      <GlassCard className="p-5 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground/80 font-medium">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
          <p>
            We collect information you provide directly when creating an account (name, email address, user role, skills, portfolio links) and transaction details related to contracts and escrow deposits.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">2. How We Use Information</h2>
          <p>
            Your information is used to facilitate AI matchmaking, verify account security, execute smart contracts, provide customer support, and detect fraudulent activity using automated AI models.
          </p>
        </section>

        <section className="space-y-2 border-l-4 border-emerald-500 bg-emerald-500/10 p-4 rounded-r-xl">
          <h2 className="text-base font-bold text-emerald-500">
            3. Protection of Personal Identifiable Information (PII)
          </h2>
          <p className="text-xs font-semibold text-foreground/90">
            We prioritize user data privacy. In-platform chat systems employ active PII scanning to prevent unauthorized exchange of personal contact information. We do not sell your personal data to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">4. Blockchain Transparency</h2>
          <p>
            Smart contract interactions and escrow transaction hashes are permanently recorded on public Ethereum/Sepolia testnets. Public addresses are stored securely and associated with your account record.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">5. Your Data Rights</h2>
          <p>
            You have the right to inspect, update, or request deletion of your profile data at any time by contacting our support team at support@chainwork.test.
          </p>
        </section>
      </GlassCard>
    </div>
  );
}
