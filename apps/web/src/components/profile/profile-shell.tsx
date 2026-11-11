"use client";

import * as React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  MailCheck,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  submitIndividualVerification,
  submitOrganizationVerification,
} from "@/app/actions/verification";
import {
  updateContactInfo,
  updateUserProfile,
} from "@/app/actions/profile";
import {
  changeUserPassword,
  resendEmailVerification,
} from "@/lib/firebase/auth-helpers";
import { auth } from "@/lib/firebase/client";
import { AzureButton } from "@/components/ui/azure-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import type {
  AccountType,
  SerializedUser,
  VerificationMethod,
  VerificationStatus,
} from "@/lib/firebase/schema";
import { containsEmoji } from "@/lib/utils/text-validation";
import { formatDateShort } from "@/lib/format-time";
import { cn } from "@/lib/utils";


interface ProfileShellProps {
  role: "client" | "freelancer";
}

export function ProfileShell({ role }: ProfileShellProps) {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!user) {
    return (
      <GlassCard className="p-8 text-sm">
        You need to be signed in to view your profile.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Update your details and complete identity verification.
        </p>
      </div>

      <BasicInfoCard user={user} />
      <ContactInfoCard user={user} />
      <ChangePasswordCard />
      {user.role !== "admin" && (
        <EmailVerificationCard userEmail={user.email} />
      )}
      <IdentityVerificationCard user={user} />
    </div>
  );
}

// ───── Contact info ───────────────────────────────────────────────────────────

const PHONE_RE = /^\+?[0-9]{7,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactInfoCard({ user }: { user: SerializedUser }) {
  const [phone, setPhone] = React.useState(user.phoneNumber ?? "");
  const [email, setEmail] = React.useState(user.email);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setPhone(user.phoneNumber ?? "");
    setEmail(user.email);
  }, [user.phoneNumber, user.email]);

  const phoneTrimmed = phone.trim();
  const emailTrimmed = email.trim().toLowerCase();
  const phoneInvalid = phoneTrimmed.length > 0 && !PHONE_RE.test(phoneTrimmed);
  const emailInvalid = !EMAIL_RE.test(emailTrimmed);
  const dirty =
    phoneTrimmed !== (user.phoneNumber ?? "").trim() ||
    emailTrimmed !== user.email.toLowerCase();

  async function save() {
    if (phoneInvalid) {
      toast.error(
        "Please enter a valid phone number (e.g. +92 300 1234567)"
      );
      return;
    }
    if (emailInvalid) {
      toast.error("Enter a valid email.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateContactInfo({
        phoneNumber: phoneTrimmed.length === 0 ? null : phoneTrimmed,
        email: emailTrimmed,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.emailChanged
          ? "Contact updated. Please verify your new email."
          : "Contact updated."
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update contact info.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="space-y-4 p-6">
      <div>
        <h2 className="inline-flex items-center gap-2 text-base font-semibold">
          <Phone className="size-4 text-[color:var(--azure-500)]" />
          Contact information
        </h2>
        <p className="mt-1 text-xs text-foreground/60">
          Used by ChainWork to reach you. Email also signs you in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="contact-phone">Phone number</Label>
          <div className="relative mt-1">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <Input
              id="contact-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              disabled={saving}
              className="pl-9"
            />
          </div>
          {phoneInvalid ? (
            <p className="mt-1 text-xs text-destructive">
              Please enter a valid phone number (e.g. +92 300 1234567)
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="contact-email">Email</Label>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
              className="pl-9"
            />
          </div>
          <p className="mt-1 text-xs text-foreground/50">
            Changing email requires re-verification.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <AzureButton
          type="button"
          size="md"
          onClick={() => void save()}
          disabled={saving || !dirty || phoneInvalid || emailInvalid}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </AzureButton>
      </div>
    </GlassCard>
  );
}

// ───── Change password ────────────────────────────────────────────────────────

function ChangePasswordCard() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const validNext =
    next.length >= 8 && /[A-Z]/.test(next) && /[0-9]/.test(next);
  const match = next === confirm;
  const canSubmit =
    current.length > 0 && validNext && match && !busy;

  async function submit() {
    if (!validNext) {
      toast.error(
        "New password must be at least 8 characters with an uppercase letter and a digit."
      );
      return;
    }
    if (!match) {
      toast.error("New password and confirmation must match.");
      return;
    }
    setBusy(true);
    try {
      await changeUserPassword({
        currentPassword: current,
        newPassword: next,
      });
      toast.success("Password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password change failed.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="space-y-4 p-6">
      <div>
        <h2 className="inline-flex items-center gap-2 text-base font-semibold">
          <KeyRound className="size-4 text-[color:var(--azure-500)]" />
          Change password
        </h2>
        <p className="mt-1 text-xs text-foreground/60">
          You&apos;ll need to enter your current password before setting a
          new one.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="pw-current">Current password</Label>
          <Input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            disabled={busy}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="pw-new">New password</Label>
          <Input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            disabled={busy}
            className="mt-1"
          />
          <p className="mt-1 text-[11px] text-foreground/50">
            Min 8 chars, 1 uppercase, 1 digit.
          </p>
        </div>
        <div>
          <Label htmlFor="pw-confirm">Confirm new password</Label>
          <Input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={busy}
            className="mt-1"
          />
          {confirm.length > 0 && !match ? (
            <p className="mt-1 text-[11px] text-destructive">
              Doesn&apos;t match new password.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => void submit()}
          disabled={!canSubmit}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </div>
    </GlassCard>
  );
}

// ───── Email verification ─────────────────────────────────────────────────────

function EmailVerificationCard({ userEmail }: { userEmail: string }) {
  const [fbUser] = useAuthState(auth);
  const [sending, setSending] = React.useState(false);
  const verified = fbUser?.emailVerified ?? false;

  async function resend() {
    setSending(true);
    try {
      await resendEmailVerification();
      toast.success(`Verification email sent to ${userEmail}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send email.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <GlassCard className="space-y-3 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <MailCheck className="size-4 text-[color:var(--azure-500)]" />
            Email verification status
          </h2>
          <p className="mt-1 text-xs text-foreground/60">
            Verify your email so we can recover access if you lose your
            password.
          </p>
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            Not verified
          </span>
        )}
      </div>
      {verified ? null : (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--glass-border)] pt-3">
          <p className="text-xs text-foreground/60">
            We sent a link to{" "}
            <span className="font-medium text-foreground">{userEmail}</span>
            . Click it to verify. Already clicked? Refresh this page.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void resend()}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Resend verification email
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

// ───── Basic info ─────────────────────────────────────────────────────────────

function BasicInfoCard({ user }: { user: SerializedUser }) {
  const [name, setName] = React.useState(user.name);
  const [bio, setBio] = React.useState(user.bio ?? "");
  const [bioError, setBioError] = React.useState<string | null>(null);
  const [savingName, setSavingName] = React.useState(false);
  const [savingBio, setSavingBio] = React.useState(false);

  // Keep local state in sync if the hook updates after a fan-out completes.
  React.useEffect(() => {
    setName(user.name);
    setBio(user.bio ?? "");
  }, [user.name, user.bio]);

  async function saveName() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    if (trimmed === user.name) return;
    setSavingName(true);
    try {
      const result = await updateUserProfile({ name: trimmed });
      const total = sumFanout(result.fanoutCounts);
      toast.success(
        total > 0
          ? `Profile updated. ${total} document${total === 1 ? "" : "s"} refreshed.`
          : "Profile updated."
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not update name.";
      toast.error(msg);
    } finally {
      setSavingName(false);
    }
  }

  async function saveBio() {
    if ((bio ?? "") === (user.bio ?? "")) return;
    if (containsEmoji(bio)) {
      setBioError("Bio must not contain emojis.");
      return;
    }
    setBioError(null);
    setSavingBio(true);
    try {
      await updateUserProfile({ bio: bio.trim() || null });
      toast.success("Bio updated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update bio.";
      toast.error(msg);
    } finally {
      setSavingBio(false);
    }
  }

  return (
    <GlassCard className="p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold">Basic info</h2>
        <p className="mt-1 text-xs text-foreground/60">
          Updating your name fans out to all gigs, contracts, messages, and
          reviews you appear on.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="profile-name">Name</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={savingName}
              maxLength={80}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void saveName()}
              disabled={savingName || name.trim() === user.name}
            >
              {savingName ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Updating your data…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label>Email</Label>
          <Input
            value={user.email}
            readOnly
            className="mt-1 cursor-not-allowed bg-foreground/5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea
          id="profile-bio"
          rows={4}
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            if (bioError) setBioError(null);
          }}
          placeholder="Tell people about your work, experience, or what you're hiring for."
          disabled={savingBio}
          maxLength={1000}
          className={bioError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {bioError && (
          <p className="mt-1 text-xs font-medium text-destructive">{bioError}</p>
        )}
        <div className="mt-2 flex items-center justify-between text-xs text-foreground/50">
          <span>{bio.length} / 1000</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void saveBio()}
            disabled={savingBio || (bio ?? "") === (user.bio ?? "")}
          >
            {savingBio ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save bio"
            )}
          </Button>
        </div>
      </div>

      <div className="text-xs text-foreground/50">
        Member since {formatDateShort(user.createdAt)}.
      </div>
    </GlassCard>
  );
}

function sumFanout(counts: object): number {
  return Object.values(counts as Record<string, number>).reduce(
    (a, b) => a + b,
    0
  );
}

// ───── Identity Verification ──────────────────────────────────────────────────

const VERIFICATION_STATUS_PILL: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  unverified: {
    label: "Not started",
    className:
      "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  },
  pending: {
    label: "Under review",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  verified: {
    label: "Verified",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  },
};

const LINKEDIN_RE = /^https:\/\/(www\.)?linkedin\.com\/(in|company)\/[\w%-]+\/?$/i;

function IdentityVerificationCard({ user }: { user: SerializedUser }) {
  const existingAccountType = (user as { accountType?: AccountType | null }).accountType ?? null;
  const existingMethod = (user as { verificationMethod?: VerificationMethod | null }).verificationMethod ?? null;
  const existingStatus = (user as { verificationStatus?: VerificationStatus | null }).verificationStatus ?? "unverified";

  const [accountType, setAccountType] = React.useState<AccountType | null>(existingAccountType);
  const [linkedInUrl, setLinkedInUrl] = React.useState(
    (user as { verificationValue?: string | null }).verificationValue ?? ""
  );
  const [orgName, setOrgName] = React.useState(
    (user as { organizationName?: string | null }).organizationName ?? ""
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [urlError, setUrlError] = React.useState<string | null>(null);

  const status: VerificationStatus = existingStatus as VerificationStatus;
  const pill = VERIFICATION_STATUS_PILL[status] ?? VERIFICATION_STATUS_PILL.unverified;

  const isLocked = status === "verified" || status === "pending";
  const canSubmit = !isLocked && accountType !== null && !submitting;

  function validateUrl(val: string): boolean {
    if (!val.trim()) {
      setUrlError("LinkedIn URL is required.");
      return false;
    }
    if (!LINKEDIN_RE.test(val.trim())) {
      setUrlError(
        accountType === "organization"
          ? "Enter a valid LinkedIn company URL (e.g. https://linkedin.com/company/acme)"
          : "Enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname)"
      );
      return false;
    }
    setUrlError(null);
    return true;
  }

  async function submit() {
    if (!accountType) return;
    if (!validateUrl(linkedInUrl)) return;

    setSubmitting(true);
    try {
      if (accountType === "organization") {
        if (!orgName.trim()) {
          toast.error("Please enter your organization name.");
          return;
        }
        await submitOrganizationVerification({
          linkedinUrl: linkedInUrl.trim(),
          organizationName: orgName.trim(),
        });
      } else {
        await submitIndividualVerification({
          method: "linkedin",
          profileUrl: linkedInUrl.trim(),
        });
      }
      toast.success("Verification request submitted. Admins will review within 48 hours.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not submit verification.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4 text-[color:var(--azure-500)]" />
            Identity verification
          </h2>
          <p className="mt-1 text-xs text-foreground/60">
            Verify your identity via LinkedIn. Verified accounts get a trust badge.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-xl",
            pill.className
          )}
        >
          {pill.label}
        </span>
      </div>

      {status === "verified" ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4" />
          Verified on {formatDateShort(user.updatedAt)}.
        </div>
      ) : status === "pending" ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300">
          Your verification is under review. We&apos;ll email you once an admin has checked it.
        </div>
      ) : (
        <>
          {status === "rejected" ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Your last submission was rejected. Please update your details and resubmit.
            </div>
          ) : null}

          {/* Step 1: account type */}
          <div>
            <p className="mb-3 text-sm font-medium">Are you an individual or an organization?</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAccountType("individual")}
                disabled={existingAccountType !== null && existingAccountType !== "individual"}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  accountType === "individual"
                    ? "border-[color:var(--azure-500)] bg-[color:var(--azure-500)]/10"
                    : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[color:var(--azure-500)]/40",
                  existingAccountType !== null && existingAccountType !== "individual" && "pointer-events-none opacity-40"
                )}
              >
                <User className="size-5 shrink-0 text-[color:var(--azure-500)]" />
                <div>
                  <p className="text-sm font-medium">Individual</p>
                  <p className="text-xs text-foreground/60">Personal LinkedIn profile</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("organization")}
                disabled={existingAccountType !== null && existingAccountType !== "organization"}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  accountType === "organization"
                    ? "border-[color:var(--azure-500)] bg-[color:var(--azure-500)]/10"
                    : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[color:var(--azure-500)]/40",
                  existingAccountType !== null && existingAccountType !== "organization" && "pointer-events-none opacity-40"
                )}
              >
                <Building2 className="size-5 shrink-0 text-[color:var(--azure-500)]" />
                <div>
                  <p className="text-sm font-medium">Organization</p>
                  <p className="text-xs text-foreground/60">Company LinkedIn page</p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: LinkedIn URL (shown once type is chosen) */}
          {accountType !== null && (
            <div className="space-y-4">
              {accountType === "organization" && (
                <div>
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="linkedin-url">
                  {accountType === "organization" ? "Company LinkedIn URL" : "LinkedIn profile URL"}
                </Label>
                <div className="relative mt-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
                  <Input
                    id="linkedin-url"
                    value={linkedInUrl}
                    onChange={(e) => {
                      setLinkedInUrl(e.target.value);
                      if (urlError) setUrlError(null);
                    }}
                    placeholder={
                      accountType === "organization"
                        ? "https://linkedin.com/company/acme"
                        : "https://linkedin.com/in/yourname"
                    }
                    disabled={submitting}
                    className={cn("pl-9", urlError && "border-destructive focus-visible:ring-destructive")}
                  />
                </div>
                {urlError && (
                  <p className="mt-1 text-xs font-medium text-destructive">{urlError}</p>
                )}
                <p className="mt-1 text-xs text-foreground/50">
                  We&apos;ll check that this LinkedIn page belongs to you before approving.
                </p>
              </div>

              <div className="flex justify-end">
                <AzureButton
                  type="button"
                  size="md"
                  onClick={() => void submit()}
                  disabled={!canSubmit}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit for verification"
                  )}
                </AzureButton>
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
