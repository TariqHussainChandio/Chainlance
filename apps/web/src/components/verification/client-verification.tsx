"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, CheckCircle2, Link2, Loader2, Phone, SmartphoneIcon } from "lucide-react";

import { AzureButton } from "@/components/ui/azure-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
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
  submitIndividualVerification,
  submitOrganizationVerification,
} from "@/app/actions/verification";
import {
  individualVerificationSchema,
  organizationVerificationSchema,
  type IndividualVerificationInput,
  type OrganizationVerificationInput,
} from "@/lib/schemas/verification-schema";
import type { VerificationMethod, VerificationStatus, AccountType } from "@/lib/firebase/schema";
import { cn } from "@/lib/utils";

interface Props {
  /** Current values from the user's Firestore doc — null if not yet set */
  currentMethod?: VerificationMethod | null;
  currentStatus?: VerificationStatus | null;
  currentAccountType?: AccountType | null;
}

type FlowType = "individual" | "organization";
type IndividualMethod = "linkedin" | "whatsapp" | "phone";

const METHOD_OPTIONS: {
  value: IndividualMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  fieldName: "profileUrl" | "phoneNumber";
}[] = [
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: Link2,
    placeholder: "https://linkedin.com/in/your-profile",
    fieldName: "profileUrl",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: SmartphoneIcon,
    placeholder: "+447911123456",
    fieldName: "phoneNumber",
  },
  {
    value: "phone",
    label: "Phone Number",
    icon: Phone,
    placeholder: "+14155552671",
    fieldName: "phoneNumber",
  },
];

function StatusBadge({ status }: { status: VerificationStatus }) {
  const map: Record<VerificationStatus, { label: string; className: string }> = {
    unverified: { label: "Unverified", className: "bg-yellow-500/15 text-yellow-500" },
    pending: { label: "Pending Review", className: "bg-blue-500/15 text-blue-400" },
    verified: { label: "Verified", className: "bg-emerald-500/15 text-emerald-500" },
    rejected: { label: "Rejected", className: "bg-red-500/15 text-red-400" },
  };
  const { label, className } = map[status];
  return (
    <Badge className={cn("font-semibold text-xs", className)}>{label}</Badge>
  );
}

export function ClientVerification({ currentMethod, currentStatus, currentAccountType }: Props) {
  const [flowType, setFlowType] = useState<FlowType | null>(
    currentAccountType ?? null
  );
  const [selectedMethod, setSelectedMethod] = useState<IndividualMethod | null>(
    (currentMethod as IndividualMethod | undefined) ?? null
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(
    currentStatus === "pending" || currentStatus === "verified"
  );

  // Individual form
  const individualForm = useForm<IndividualVerificationInput>({
    resolver: zodResolver(individualVerificationSchema),
    defaultValues: { method: selectedMethod ?? "linkedin" } as IndividualVerificationInput,
  });

  // Organization form
  const orgForm = useForm<OrganizationVerificationInput>({
    resolver: zodResolver(organizationVerificationSchema),
    defaultValues: { organizationName: "", linkedinUrl: "" },
  });

  // Already submitted — show status
  if (done && currentStatus) {
    return (
      <GlassCard className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Verification</h3>
          <StatusBadge status={currentStatus} />
        </div>
        {currentStatus === "pending" && (
          <p className="text-sm text-foreground/70">
            Your verification is under review. We typically respond within 1–2 business days.
          </p>
        )}
        {currentStatus === "verified" && (
          <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
            <CheckCircle2 className="size-4" />
            Account verified via{" "}
            <span className="capitalize">{currentMethod}</span>
          </div>
        )}
        {currentStatus === "rejected" && (
          <p className="text-sm text-red-400">
            Verification was rejected. Please contact support for assistance.
          </p>
        )}
      </GlassCard>
    );
  }

  // Step 1 — choose individual or organization
  if (!flowType) {
    return (
      <GlassCard className="space-y-4 p-5">
        <h3 className="font-semibold text-base">Verify Your Account</h3>
        <p className="text-sm text-foreground/70">
          Are you verifying as an individual or on behalf of an organization?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFlowType("individual")}
            className="flex flex-col items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 text-center transition-all hover:border-[var(--azure-500)] hover:scale-[1.02]"
          >
            <Phone className="size-8 text-[color:var(--azure-500)]" />
            <div>
              <div className="font-medium">Individual</div>
              <div className="text-xs text-foreground/60">LinkedIn, WhatsApp, or Phone</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFlowType("organization")}
            className="flex flex-col items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 text-center transition-all hover:border-[var(--azure-500)] hover:scale-[1.02]"
          >
            <Building2 className="size-8 text-sky-500" />
            <div>
              <div className="font-medium">Organization</div>
              <div className="text-xs text-foreground/60">LinkedIn company page only</div>
            </div>
          </button>
        </div>
      </GlassCard>
    );
  }

  // Step 2a — Organization flow (LinkedIn only)
  if (flowType === "organization") {
    async function onOrgSubmit(values: OrganizationVerificationInput) {
      setSubmitting(true);
      try {
        const res = await submitOrganizationVerification(values);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Organization verification submitted. Awaiting review.");
        setDone(true);
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <GlassCard className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Organization Verification</h3>
          <Button variant="ghost" size="sm" onClick={() => setFlowType(null)}>
            Back
          </Button>
        </div>
        <p className="text-sm text-foreground/70">
          Organizations must verify via their LinkedIn company page.
        </p>
        <Form {...orgForm}>
          <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-4">
            <FormField
              control={orgForm.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={orgForm.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Company Page</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://linkedin.com/company/acme-corp"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AzureButton type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit for Review"
              )}
            </AzureButton>
          </form>
        </Form>
      </GlassCard>
    );
  }

  // Step 2b — Individual flow (choose one method; locked once chosen)
  const isLocked = !!currentMethod;

  async function onIndividualSubmit(values: IndividualVerificationInput) {
    setSubmitting(true);
    try {
      const res = await submitIndividualVerification(values);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Verification submitted. Awaiting review.");
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  const activeMethod = selectedMethod ?? "linkedin";
  const activeOption = METHOD_OPTIONS.find((o) => o.value === activeMethod)!;
  const ActiveIcon = activeOption.icon;

  return (
    <GlassCard className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Individual Verification</h3>
        {!isLocked && (
          <Button variant="ghost" size="sm" onClick={() => setFlowType(null)}>
            Back
          </Button>
        )}
      </div>

      {/* Method selector — disabled once locked */}
      <div className="grid grid-cols-3 gap-2">
        {METHOD_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = activeMethod === opt.value;
          const isDisabled = isLocked && opt.value !== currentMethod;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  setSelectedMethod(opt.value);
                  individualForm.reset({ method: opt.value } as IndividualVerificationInput);
                }
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-xs font-medium transition-all",
                isSelected
                  ? "border-[var(--azure-500)] bg-[color:var(--azure-500)]/10 text-[color:var(--azure-500)]"
                  : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground/70",
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <Icon className="size-5" />
              {opt.label}
              {isLocked && opt.value === currentMethod && (
                <span className="text-[10px] text-[color:var(--azure-400)]">(selected)</span>
              )}
            </button>
          );
        })}
      </div>

      {isLocked && (
        <p className="text-xs text-foreground/60 italic">
          You have already selected <strong className="capitalize">{currentMethod}</strong> as your
          verification method. Other methods are unavailable.
        </p>
      )}

      <Form {...individualForm}>
        <form
          onSubmit={individualForm.handleSubmit(onIndividualSubmit)}
          className="space-y-4"
        >
          <input type="hidden" {...individualForm.register("method")} value={activeMethod} />

          <FormField
            control={individualForm.control}
            name={activeOption.fieldName as "profileUrl"}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <ActiveIcon className="size-4" />
                  {activeOption.label === "LinkedIn"
                    ? "LinkedIn Profile URL"
                    : `${activeOption.label} Number`}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={activeOption.placeholder}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <AzureButton type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit for Review"
            )}
          </AzureButton>
        </form>
      </Form>
    </GlassCard>
  );
}
