import Link from "next/link";
import { ArrowLeft, Shield, FileText } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";

export default function TermsPage() {
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
            <FileText className="size-5 sm:size-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs font-semibold text-foreground/60">
              Last updated: July 2026
            </p>
          </div>
        </div>
      </div>

      <GlassCard className="p-5 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground/80 font-medium">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using ChainWork ("Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Platform. ChainWork operates as a decentralized, smart-contract enabled freelance marketplace.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">2. User Accounts & Roles</h2>
          <p>
            Users may register as Freelancers or Clients. You are responsible for keeping your credentials secure and maintaining the accuracy of your profile information. KYC verification may be required for high-volume transactions.
          </p>
        </section>

        <section className="space-y-2 border-l-4 border-amber-500 bg-amber-500/10 p-4 rounded-r-xl">
          <h2 className="text-base font-bold text-amber-500">
            3. Strict Off-Platform Communication & PII Policy
          </h2>
          <p className="text-xs font-semibold text-foreground/90">
            To ensure complete security under Smart Contract Escrow and protect all parties against fraud, users are strictly prohibited from exchanging personal contact information (email addresses, phone numbers, WhatsApp, Telegram, Skype, or social handles) in platform communications. Violations may result in immediate account suspension.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">4. Smart Contract Escrows & Payments</h2>
          <p>
            All contract payments are funded into smart contract escrows. Payouts are released automatically when clients approve delivered milestones. In the event of a dispute, an administrator conducts a human review with full milestone evidence.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">5. Fraud Prevention & Account Security</h2>
          <p>
            ChainWork employs automated behavioural AI risk scoring. Accounts exhibiting fraudulent patterns, fake credentials, or suspicious payment activities will be flagged for review or account restriction.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">6. Limitation of Liability</h2>
          <p>
            ChainWork provides the Platform on an "as is" basis. While smart contracts guarantee escrow execution, ChainWork is not liable for indirect or consequential damages arising from third-party services.
          </p>
        </section>
      </GlassCard>
    </div>
  );
}
