"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, Loader2, Mail, Users, X } from "lucide-react";

import { checkEmailAvailable } from "@/app/actions/auth-actions";
import { AzureButton } from "@/components/ui/azure-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  postSessionCookie,
  signInWithGoogle,
  type SignUpRole,
} from "@/lib/firebase/auth-helpers";
import {
  sendVerificationLink,
  stashPendingSignup,
} from "@/lib/firebase/email-link";
import { isValidTag } from "@/lib/utils/text-validation";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[A-Za-z\s]+$/, "Name must contain letters only — no numbers or symbols"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one digit"),
  role: z.enum(["freelancer", "client"], {
    message: "Pick a role to continue",
  }),
});

type RegisterValues = z.infer<typeof schema>;

interface RoleOption {
  value: "freelancer" | "client";
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const roleOptions: RoleOption[] = [
  {
    value: "freelancer",
    label: "Freelancer",
    desc: "Offer services",
    Icon: Briefcase,
  },
  {
    value: "client",
    label: "Client",
    desc: "Hire talent",
    Icon: Users,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "skills" | "check_email">("form");
  const [sentEmail, setSentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null>(null);

  // Skills state for skill-based recommendation seeding
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillError, setSkillError] = useState<string | null>(null);

  function addSkill() {
    const tag = skillInput.trim();
    if (!tag) return;
    if (!isValidTag(tag)) {
      setSkillError("Skills may only contain letters (A–Z, a–z). No numbers or symbols.");
      return;
    }
    if (skills.includes(tag)) {
      setSkillError("Already added.");
      return;
    }
    if (skills.length >= 10) {
      setSkillError("Maximum 10 skills.");
      return;
    }
    setSkills((prev) => [...prev, tag]);
    setSkillInput("");
    setSkillError(null);
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: undefined as unknown as "freelancer",
    },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    try {
      const available = await checkEmailAvailable(values.email);
      if (!available) {
        toast.error("An account with this email already exists.");
        return;
      }
      // Temporarily stash without skills; skills are added on the next step.
      stashPendingSignup({
        name: values.name,
        role: values.role,
        password: values.password,
        skills: [],
      });
      setSentEmail(values.email);
      // Only freelancers add skills — clients go straight to email verification
      if (values.role === "freelancer") {
        setStep("skills");
      } else {
        const { ok, error } = await sendVerificationLink(values.email);
        if (!ok) {
          toast.error(error ?? "Could not send verification email.");
          return;
        }
        setStep("check_email");
        toast.success(`Verification email sent to ${values.email}.`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign-up failed. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendVerificationWithSkills() {
    setSubmitting(true);
    try {
      // Re-stash with skills so /auth/confirm picks them up
      const pending = form.getValues();
      stashPendingSignup({
        name: pending.name,
        role: pending.role,
        password: pending.password,
        skills,
      });
      const { ok, error } = await sendVerificationLink(sentEmail);
      if (!ok) {
        toast.error(error ?? "Could not send verification email.");
        return;
      }
      setStep("check_email");
      toast.success(`Verification email sent to ${sentEmail}.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign-up failed. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignUp(overrideRole?: SignUpRole) {
    const role: SignUpRole | undefined = overrideRole || form.getValues("role");

    setGoogleSubmitting(true);
    try {
      let result;
      if (pendingGoogleUser && role) {
        result = await createGoogleUserDoc(
          pendingGoogleUser.uid,
          role,
          pendingGoogleUser.displayName,
          pendingGoogleUser.email,
          pendingGoogleUser.photoURL
        );
      } else {
        result = await signInWithGoogle(role);
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
        err instanceof Error ? err.message : "Google Sign-Up failed. Try again.";
      toast.error(message);
    } finally {
      setGoogleSubmitting(false);
    }
  }

  async function handleResend() {
    if (resending || !sentEmail) return;
    setResending(true);
    try {
      const { ok, error } = await sendVerificationLink(sentEmail);
      if (!ok) {
        toast.error(error ?? "Could not resend email.");
      } else {
        toast.success(`Verification email re-sent to ${sentEmail}.`);
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <GlassCard variant="elevated" className="w-full max-w-lg p-5 sm:p-8">
      {step === "skills" ? (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              <GradientText>Your Skills</GradientText>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-foreground/70">
              Add up to 10 skills so we can recommend the best gigs for you.
              <br />
              <span className="text-xs text-foreground/50">
                Skills must contain letters only (e.g. React, Design, Python).
              </span>
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => {
                  setSkillInput(e.target.value);
                  setSkillError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. React, Python, Design"
                className="flex-1"
              />
              <AzureButton type="button" onClick={addSkill} size="sm">
                Add
              </AzureButton>
            </div>
            {skillError && (
              <p className="text-xs text-red-400">{skillError}</p>
            )}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    className="flex items-center gap-1 bg-[color:var(--azure-500)]/15 text-[color:var(--azure-400)] text-xs font-semibold"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 rounded-full hover:text-red-400"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("form")}
              className="flex-1"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <AzureButton
              type="button"
              onClick={() => void sendVerificationWithSkills()}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Continue"
              )}
            </AzureButton>
          </div>
          <p className="text-center text-xs text-foreground/50">
            Skills are optional — you can always update them later.
          </p>
        </div>
      ) : pendingGoogleUser ? (
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
              onClick={() => void handleGoogleSignUp("freelancer")}
              className="flex flex-col items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 text-center transition-all hover:border-[var(--azure-500)] hover:scale-[1.02]"
            >
              <Briefcase className="size-8 text-[color:var(--azure-500)]" />
              <div>
                <div className="font-medium">Freelancer</div>
                <div className="text-xs text-foreground/60">Offer services & get paid</div>
              </div>
            </button>

            <button
              type="button"
              disabled={googleSubmitting}
              onClick={() => void handleGoogleSignUp("client")}
              className="flex flex-col items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 text-center transition-all hover:border-[var(--azure-500)] hover:scale-[1.02]"
            >
              <Users className="size-8 text-sky-500" />
              <div>
                <div className="font-medium">Client</div>
                <div className="text-xs text-foreground/60">Post gigs & hire talent</div>
              </div>
            </button>
          </div>
        </div>
      ) : step === "form" ? (
        <>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              <GradientText>Create your account</GradientText>
            </h1>
            <p className="mt-1 text-sm text-foreground/70">
              Start working — or hiring — on-chain in seconds.
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
                name="role"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">I want to…</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {roleOptions.map(({ value, label, desc, Icon }) => {
                        const checked = selectedRole === value;
                        return (
                          <label
                            key={value}
                            className={cn(
                              "cursor-pointer rounded-xl border p-4 backdrop-blur-xl bg-[var(--glass-bg)]",
                              "transition-all",
                              checked
                                ? "border-transparent ring-2 ring-[var(--azure-500)] shadow-[0_16px_40px_rgba(14,165,255,0.18)]"
                                : "border-[var(--glass-border)] hover:ring-1 hover:ring-[color:var(--azure-400)]/30"
                            )}
                          >
                            <input
                              type="radio"
                              name={field.name}
                              value={value}
                              checked={checked}
                              onChange={() => field.onChange(value)}
                              onBlur={field.onBlur}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "inline-flex size-9 items-center justify-center rounded-lg",
                                  checked
                                    ? "bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white"
                                    : "bg-[color:var(--azure-500)]/10 text-[var(--azure-500)]"
                                )}
                              >
                                <Icon className="size-4" />
                              </span>
                              <div>
                                <div className="font-medium">{label}</div>
                                <div className="text-xs text-foreground/60">
                                  {desc}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {fieldState.error ? (
                      <FormMessage>{fieldState.error.message}</FormMessage>
                    ) : (
                      <FormMessage />
                    )}
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <GoogleButton
                  loading={googleSubmitting}
                  disabled={submitting}
                  onClick={() => void handleGoogleSignUp()}
                  className="w-full"
                >
                  Sign up with Google
                </GoogleButton>
              </div>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-foreground/10" />
                </div>
                <span className="relative bg-background px-3 text-xs uppercase text-foreground/50 font-medium">
                  Or register with email
                </span>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="name"
                        placeholder="Your full name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 chars, with a capital and a number"
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
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending verification email…
                  </>
                ) : (
                  "Send verification email"
                )}
              </AzureButton>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-foreground/70">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--azure-600)] hover:text-[var(--azure-500)]"
            >
              Sign in
            </Link>
          </p>
        </>
      ) : (
        <div className="space-y-6 text-center">
          <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full border border-[color:var(--azure-500)]/30 bg-[color:var(--azure-500)]/10 text-[color:var(--azure-500)]">
            <Mail className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              <GradientText>Check your email</GradientText>
            </h2>
            <p className="mt-1 text-sm text-foreground/70">
              We sent a verification link to{" "}
              <span className="font-medium text-foreground">{sentEmail}</span>.
            </p>
            <p className="mt-2 text-xs text-foreground/50">
              Click the link in the email to complete your registration.
              The link expires shortly.
            </p>
          </div>
          <div className="text-sm text-foreground/60">
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={resending}
              className={cn(
                "text-[var(--azure-500)] hover:underline",
                resending && "opacity-60"
              )}
            >
              {resending ? "Resending…" : "Resend email"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Use a different email
          </button>
        </div>
      )}
    </GlassCard>
  );
}
