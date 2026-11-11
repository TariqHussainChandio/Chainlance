import Link from "next/link";
import { ArrowLeft, Cookie } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
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
            <Cookie className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Cookie Policy
            </h1>
            <p className="text-xs font-semibold text-foreground/60">
              Last updated: July 2026
            </p>
          </div>
        </div>
      </div>

      <GlassCard className="p-8 space-y-6 text-sm leading-relaxed text-foreground/80 font-medium">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">1. What Are Cookies</h2>
          <p>
            Cookies are small text files stored on your device when you visit web applications. They help us remember your session, keep you signed in securely, and personalize your experience.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">2. Cookies We Use</h2>
          <ul className="list-disc pl-5 space-y-2 text-xs font-semibold">
            <li>
              <strong>Essential Session Cookies:</strong> Required for Firebase authentication and active user session state.
            </li>
            <li>
              <strong>Preference Cookies:</strong> Remember your theme preference (Light/Dark mode) and dashboard layout settings.
            </li>
            <li>
              <strong>Analytics & Security Cookies:</strong> Help monitor platform performance and detect malicious login attempts.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">3. Managing Cookie Preferences</h2>
          <p>
            Most modern web browsers allow you to manage or disable cookies in settings. Please note that disabling essential cookies may affect your ability to sign in or perform contract transactions on ChainWork.
          </p>
        </section>
      </GlassCard>
    </div>
  );
}
