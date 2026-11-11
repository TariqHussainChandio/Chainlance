"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

import { AzureButton } from "@/components/ui/azure-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type ResetValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ResetValues) {
    setSubmitting(true);
    const trimmed = values.email.trim();
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setSentEmail(trimmed);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        // Demo-visible explicit error. For production, switch to a
        // generic success to prevent email enumeration.
        toast.error("No account found with this email address.");
      } else if (code === "auth/too-many-requests") {
        toast.error(
          "Too many reset attempts. Try again in a few minutes."
        );
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sentEmail) {
    return (
      <GlassCard
        variant="elevated"
        className="w-full max-w-md space-y-5 p-8 text-center"
      >
        <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="size-7" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Reset email sent
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Check your inbox at{" "}
            <span className="font-medium text-foreground">{sentEmail}</span>.
            Click the link to set a new password.
          </p>
          <p className="mt-2 text-xs text-foreground/50">
            The link expires in 1 hour.
          </p>
        </div>
        <AzureButton
          type="button"
          size="lg"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          Back to sign in
        </AzureButton>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="elevated" className="w-full max-w-md p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-[color:var(--azure-500)]/15 text-[color:var(--azure-500)]">
          <KeyRound className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          <GradientText>Reset your password</GradientText>
        </h1>
        <p className="mt-1 text-sm text-foreground/70">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <AzureButton
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </AzureButton>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-foreground/70">
        Remember your password?{" "}
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-[var(--azure-600)] hover:text-[var(--azure-500)]"
        >
          Sign in
          <ArrowRight className="size-3.5" />
        </Link>
      </p>
    </GlassCard>
  );
}
