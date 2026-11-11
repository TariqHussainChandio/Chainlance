"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Briefcase, Users, ArrowLeft } from "lucide-react";

import { AzureButton } from "@/components/ui/azure-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { GoogleButton } from "@/components/ui/google-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createGoogleUserDoc,
  deleteSessionCookie,
  postSessionCookie,
  signIn,
  signInWithGoogle,
  signOut,
  type SignUpRole,
} from "@/lib/firebase/auth-helpers";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof schema>;

interface PendingGoogleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<PendingGoogleUser | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      const user = await signIn(values);
      if (user.role === "admin") {
        await signOut();
        await deleteSessionCookie();
        toast.error(
          "Admin accounts must use the admin portal. Go to /admin/login."
        );
        return;
      }
      await postSessionCookie();
      toast.success(`Welcome back, ${user.name}.`);
      router.push(`/${user.role}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign-in failed. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn(selectedRole?: SignUpRole) {
    setGoogleSubmitting(true);
    try {
      let result;
      if (pendingGoogleUser && selectedRole) {
        result = await createGoogleUserDoc(
          pendingGoogleUser.uid,
          selectedRole,
          pendingGoogleUser.displayName,
          pendingGoogleUser.email,
          pendingGoogleUser.photoURL
        );
      } else {
        result = await signInWithGoogle(selectedRole);
      }

      if (result.isNewUser && !result.user && result.firebaseUser) {
        setPendingGoogleUser(result.firebaseUser);
        toast.info("Please select your role (Freelancer or Client) to complete registration.");
        return;
      }

      if (!result.user) return;

      await postSessionCookie({ name: result.user.name, role: result.user.role });
      toast.success(`Welcome to ChainWork, ${result.user.name}!`);
      router.push(`/${result.user.role}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google Sign-In failed. Try again.";
      toast.error(message);
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <GlassCard variant="elevated" className="w-full max-w-md p-5 sm:p-8">
      {pendingGoogleUser ? (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              <GradientText>Choose your role</GradientText>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-foreground/70">
              Welcome, <span className="font-medium text-foreground">{pendingGoogleUser.displayName || pendingGoogleUser.email}</span>! How do you plan to use ChainWork?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              disabled={googleSubmitting}
              onClick={() => void handleGoogleSignIn("freelancer")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 text-center transition-all hover:border-[var(--azure-500)] hover:scale-[1.02]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--azure-500)]"
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white shadow-md">
                <Briefcase className="size-6" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Freelancer</div>
                <div className="text-xs text-foreground/60 mt-0.5">Offer services</div>
              </div>
            </button>

            <button
              type="button"
              disabled={googleSubmitting}
              onClick={() => void handleGoogleSignIn("client")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 text-center transition-all hover:border-[var(--azure-500)] hover:scale-[1.02]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--azure-500)]"
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                <Users className="size-6" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Client</div>
                <div className="text-xs text-foreground/60 mt-0.5">Hire talent</div>
              </div>
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setPendingGoogleUser(null)}
              className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to login
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              <GradientText>Welcome back</GradientText>
            </h1>
            <p className="mt-1 text-sm text-foreground/70">Sign in to ChainWork</p>
          </div>

          <div className="space-y-4">
            <GoogleButton
              loading={googleSubmitting}
              onClick={() => void handleGoogleSignIn()}
              className="w-full"
            >
              Sign in with Google
            </GoogleButton>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-foreground/10" />
              </div>
              <span className="relative bg-background px-3 text-xs uppercase text-foreground/50 font-medium">
                Or continue with email
              </span>
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-xs text-foreground/60 hover:text-foreground"
                        >
                          Forgot password?
                        </Link>
                      </div>
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
                <AzureButton
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting || googleSubmitting}
                >
                  {submitting ? "Signing in…" : "Sign in"}
                </AzureButton>
              </form>
            </Form>
          </div>

          <p className="mt-6 text-center text-sm text-foreground/70">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[var(--azure-600)] hover:text-[var(--azure-500)]"
            >
              Sign up
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-foreground/50">
            Admin?{" "}
            <Link
              href="/admin/login"
              className="font-medium text-foreground/70 hover:text-foreground"
            >
              Sign in here →
            </Link>
          </p>
        </>
      )}
    </GlassCard>
  );
}
