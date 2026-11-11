"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import {
  deleteSessionCookie,
  postSessionCookie,
  signIn,
  signOut,
} from "@/lib/firebase/auth-helpers";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      const user = await signIn(values);
      if (user.role !== "admin") {
        // Tear down the auth state so this attempt doesn't leave the user
        // half signed-in. No session cookie was created yet — but signOut
        // also clears the client Firebase auth state.
        await signOut();
        await deleteSessionCookie();
        toast.error(
          "These credentials are not authorized for the admin portal. Use the regular sign-in page."
        );
        return;
      }
      await postSessionCookie();
      toast.success(`Welcome back, ${user.name}.`);
      router.push("/admin");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign-in failed. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // The auth layout is azure by default — wrap this page in admin-theme
    // so the same CSS-var override that themes /admin/* applies here too.
    <div className="admin-theme w-full max-w-md">
      <GlassCard
        variant="elevated"
        className="w-full border-red-500/30 p-8 shadow-[0_0_32px_rgba(239,68,68,0.18)]"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-red-500/15 text-red-500">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            Admin Portal
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Restricted access. Authorized personnel only.
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
                      placeholder="admin@chainwork.test"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white shadow-[0_8px_24px_rgba(239,68,68,0.35)] hover:brightness-110"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {submitting ? "Signing in…" : "Sign in to admin portal"}
            </Button>
          </form>
        </Form>
        <div className="mt-6 space-y-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-xs text-foreground/50 hover:text-foreground/70"
          >
            Forgot password?
          </Link>
          <p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-medium text-foreground/70 hover:text-foreground"
            >
              Not an admin? Sign in here
              <ArrowRight className="size-3.5" />
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
