"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Info,
  Loader2,
  Lock,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  createContract,
  fundContractEscrow,
} from "@/app/actions/contracts";
import { AzureButton } from "@/components/ui/azure-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { WalletPill } from "@/components/ui/wallet-pill";
import { StripeCardForm, type StripeCardDetails } from "@/components/payment/stripe-card-form";
import type { EscrowResult } from "@/lib/escrow/escrow-service";
import type { SerializedGig } from "@/lib/firebase/schema";
import { triggerFraudCheck } from "@/lib/ai/fraud-trigger";
import {
  contractCreateSchema,
  type ContractCreateInput,
} from "@/lib/schemas/contract-schema";
import { cn } from "@/lib/utils";
import {
  calculateTransactionFee,
  PLATFORM_FEE_PERCENTAGE,
  FREELANCER_FEE_PERCENTAGE,
} from "@/lib/payment/platform-fees";

type Tier = "basic" | "standard" | "premium";

interface ContractWizardProps {
  gig: SerializedGig;
  tier: Tier;
}

const tierLabel: Record<Tier, string> = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

const USD_PER_ETH = 3300;
const ESTIMATED_GAS_USD = 2.4;
const MOCK_BALANCE_ETH = "10.000";
const DEMO_WALLET_ADDRESS = "0xDEMO000000000000000000000000000000USER";

function tierPrice(gig: SerializedGig, tier: Tier): number {
  if (tier === "basic") return gig.pricingBasic;
  if (tier === "premium") return gig.pricingPremium;
  return gig.pricingStandard;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

function isoDate(d: Date): string {
  // YYYY-MM-DD for <input type="date">
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

function truncateHash(hash: string): string {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

interface StepIndicatorProps {
  step: 1 | 2 | 3;
}

const STEP_LABELS = ["Define contract", "Fund escrow", "Confirm"];

function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {STEP_LABELS.map((label, idx) => {
        const stepNumber = (idx + 1) as 1 | 2 | 3;
        const isActive = step === stepNumber;
        const isPast = step > stepNumber;
        return (
          <React.Fragment key={label}>
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:text-sm backdrop-blur-xl transition-all",
                isActive &&
                  "border-[color:var(--azure-500)]/40 bg-[color:var(--azure-500)]/10 text-foreground shadow-[0_0_18px_rgba(14,165,255,0.25)]",
                isPast &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                !isActive &&
                  !isPast &&
                  "border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground/50"
              )}
            >
              {isPast ? (
                <Check className="size-3.5" />
              ) : (
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                    isActive
                      ? "bg-[color:var(--azure-500)] text-white"
                      : "bg-foreground/10 text-foreground/60"
                  )}
                >
                  {stepNumber}
                </span>
              )}
              <span className="whitespace-nowrap">{label}</span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <span
                className={cn(
                  "hidden sm:block h-px w-6",
                  step > stepNumber
                    ? "bg-emerald-500/40"
                    : "bg-[var(--glass-border)]"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function ContractWizard({ gig, tier }: ContractWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [contractId, setContractId] = React.useState<string | null>(null);
  const [escrowResult, setEscrowResult] = React.useState<EscrowResult | null>(
    null
  );
  const [isFunding, setIsFunding] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState<boolean>(true);
  const [connectModalOpen, setConnectModalOpen] = React.useState<boolean>(false);

  const initialPrice = tierPrice(gig, tier);
  const initialDeadline = daysFromNow(7);

  const form = useForm<ContractCreateInput>({
    resolver: zodResolver(contractCreateSchema),
    mode: "onChange",
    defaultValues: {
      gigId: gig.id,
      freelancerId: gig.freelancerId,
      selectedTier: tier,
      title: `${gig.title} - ${tierLabel[tier]}`,
      totalAmount: initialPrice,
      milestones: [
        {
          description: "",
          amount: initialPrice,
          deadline: initialDeadline,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "milestones",
  });

  const watchedMilestones = form.watch("milestones");
  const watchedTotal = form.watch("totalAmount");
  const milestoneSum = (watchedMilestones ?? []).reduce(
    (acc, m) => acc + (Number(m?.amount) || 0),
    0
  );
  const sumMatches = Math.abs(milestoneSum - (Number(watchedTotal) || 0)) < 0.01;

  const formValuesRef = React.useRef<ContractCreateInput | null>(null);

  function handleStepOneSubmit(values: ContractCreateInput) {
    if (!isConnected) {
      toast.error(`You must connect with ${gig.freelancerName} first before placing this order.`);
      setConnectModalOpen(true);
      return;
    }
    formValuesRef.current = values;
    setStep(2);
  }

  async function handleFundEscrow() {
    const values = formValuesRef.current;
    if (!values) return;
    setIsFunding(true);
    let newContractId: string;
    try {
      const result = await createContract({
        gigId: values.gigId,
        title: values.title,
        totalAmount: values.totalAmount,
        milestones: values.milestones.map((m) => ({
          description: m.description,
          amount: m.amount,
          deadline:
            m.deadline instanceof Date
              ? m.deadline.getTime()
              : new Date(m.deadline).getTime(),
        })),
      });
      newContractId = result.contractId;
      setContractId(newContractId);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not create the contract.";
      toast.error(msg);
      setIsFunding(false);
      return;
    }

    try {
      const escrow = await fundContractEscrow(newContractId);
      setEscrowResult(escrow);
      setStep(3);
      // Fire-and-forget fraud checks on both parties after a successful fund.
      triggerFraudCheck();
      triggerFraudCheck(gig.freelancerId);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not fund the escrow. Try again from My Contracts.";
      toast.error(msg);
    } finally {
      setIsFunding(false);
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />
      {step === 1 && (
        <StepOneDefine
          gig={gig}
          tier={tier}
          form={form}
          fields={fields}
          appendMilestone={() =>
            append({
              description: "",
              amount: 0,
              deadline: daysFromNow(7),
            })
          }
          removeMilestone={(index: number) => remove(index)}
          milestoneSum={milestoneSum}
          sumMatches={sumMatches}
          onSubmit={handleStepOneSubmit}
        />
      )}
      {step === 2 && formValuesRef.current && (
        <StepTwoFund
          values={formValuesRef.current}
          freelancerName={gig.freelancerName}
          isFunding={isFunding}
          onBack={() => setStep(1)}
          onFund={handleFundEscrow}
        />
      )}
      {step === 3 && escrowResult && contractId && (
        <StepThreeConfirm
          escrow={escrowResult}
          contractId={contractId}
          onView={() => router.push(`/client/contracts/${contractId}`)}
          onBackToMarketplace={() => router.push("/client/browse")}
        />
      )}
    </div>
  );
}

// ───── STEP 1 ────────────────────────────────────────────────────────────────

type StepOneForm = ReturnType<typeof useForm<ContractCreateInput>>;

interface StepOneProps {
  gig: SerializedGig;
  tier: Tier;
  form: StepOneForm;
  fields: Array<{ id: string }>;
  appendMilestone: () => void;
  removeMilestone: (index: number) => void;
  milestoneSum: number;
  sumMatches: boolean;
  onSubmit: (values: ContractCreateInput) => void;
}

function StepOneDefine({
  gig,
  tier,
  form,
  fields,
  appendMilestone,
  removeMilestone,
  milestoneSum,
  sumMatches,
  onSubmit,
}: StepOneProps) {
  const tierPriceValue = tierPrice(gig, tier);
  const watchedTotal = form.watch("totalAmount");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold">Contract details</h2>
            <p className="mt-1 text-xs text-foreground/60">
              Give the contract a clear name. The freelancer sees this.
            </p>
            <div className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Landing page redesign — Standard"
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">Milestones</h2>
                <p className="mt-1 text-xs text-foreground/60">
                  Break the work into payable chunks.
                </p>
              </div>
              <span className="text-xs text-foreground/50">
                {fields.length} / 10
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {fields.map((mField, index) => (
                <GlassCard
                  key={mField.id}
                  className="p-4 bg-[color:var(--azure-500)]/[0.04]"
                >
                  <div className="flex items-center justify-between">
                    <Badge className="bg-[color:var(--azure-500)]/15 text-[color:var(--azure-700)] dark:text-[color:var(--azure-300)] border-[color:var(--azure-500)]/30 border">
                      Milestone {index + 1}
                    </Badge>
                    <button
                      type="button"
                      aria-label="Remove milestone"
                      disabled={fields.length === 1}
                      onClick={() => removeMilestone(index)}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-lg border border-[var(--glass-border)] text-foreground/60 transition-colors",
                        fields.length === 1
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:text-destructive hover:border-destructive/40"
                      )}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.description` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="What gets delivered for this milestone?"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`milestones.${index}.amount` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-foreground/50">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  step={1}
                                  className="pl-7"
                                  value={
                                    typeof field.value === "number"
                                      ? field.value
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    field.onChange(v === "" ? 0 : Number(v));
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`milestones.${index}.deadline` as const}
                        render={({ field }) => {
                          const value =
                            field.value instanceof Date
                              ? isoDate(field.value)
                              : typeof field.value === "string"
                                ? field.value
                                : "";
                          return (
                            <FormItem>
                              <FormLabel>Deadline</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={value}
                                  min={isoDate(daysFromNow(1))}
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    if (!next) return;
                                    const [y, m, d] = next
                                      .split("-")
                                      .map(Number);
                                    if (
                                      typeof y !== "number" ||
                                      typeof m !== "number" ||
                                      typeof d !== "number" ||
                                      Number.isNaN(y) ||
                                      Number.isNaN(m) ||
                                      Number.isNaN(d)
                                    )
                                      return;
                                    const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
                                    field.onChange(dt);
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </div>
                </GlassCard>
              ))}

              {form.formState.errors.milestones?.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.milestones.root.message}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={appendMilestone}
                disabled={fields.length >= 10}
                className="w-full"
              >
                <Plus className="size-4" />
                Add milestone
              </Button>
            </div>
          </GlassCard>

          <div className="flex items-center justify-between">
            <Button asChild type="button" variant="ghost">
              <Link href="/client/browse">Cancel</Link>
            </Button>
            <AzureButton
              type="submit"
              size="md"
              disabled={!form.formState.isValid || !sumMatches}
            >
              Continue to escrow
            </AzureButton>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                {gig.freelancerAvatar ? (
                  <AvatarImage
                    src={gig.freelancerAvatar}
                    alt={gig.freelancerName}
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-[10px]">
                  {initials(gig.freelancerName)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium">
                {gig.freelancerName}
              </span>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-foreground/50">
                Gig
              </div>
              <div className="mt-1 line-clamp-2 text-sm font-medium">
                {gig.title}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-foreground/50">
                Tier
              </div>
              <div className="mt-1 text-sm font-medium">{tierLabel[tier]}</div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-foreground/50">
                Total
              </div>
              <div className="mt-1 text-3xl font-semibold">
                <GradientText>
                  ${tierPriceValue.toLocaleString()}
                </GradientText>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Milestones</span>
                <span className="font-medium">{fields.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Sum of milestones</span>
                <span
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    !sumMatches && "text-destructive"
                  )}
                >
                  {!sumMatches && (
                    <AlertTriangle className="size-3.5" />
                  )}
                  {sumMatches ? (
                    <GradientText>
                      ${milestoneSum.toLocaleString()}
                    </GradientText>
                  ) : (
                    <>${milestoneSum.toLocaleString()}</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Total</span>
                <span className="font-medium">
                  ${(Number(watchedTotal) || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Delivery</span>
                <span className="font-medium">
                  {gig.deliveryDays === 1
                    ? "1 day"
                    : `${gig.deliveryDays} days`}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </form>
    </Form>
  );
}

// ───── STEP 2 ────────────────────────────────────────────────────────────────

interface StepTwoProps {
  values: ContractCreateInput;
  freelancerName: string;
  isFunding: boolean;
  onBack: () => void;
  onFund: () => void;
}

function StepTwoFund({
  values,
  freelancerName,
  isFunding,
  onBack,
  onFund,
}: StepTwoProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<"stripe" | "crypto">("stripe");
  const [isCardValid, setIsCardValid] = React.useState(false);
  const ethAmount = (values.totalAmount / USD_PER_ETH).toFixed(4);

  const { platformFee, freelancerEarnings: freelancerNet } = calculateTransactionFee(values.totalAmount);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <GlassCard className="p-6 space-y-5 border-emerald-500/30">
          <div>
            <h2 className="text-base font-extrabold">Contract Summary</h2>
            <p className="mt-1 text-xs font-semibold text-foreground/60">
              Funds get locked in escrow against this project scope.
            </p>
          </div>

          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-emerald-500">
              Contract Title
            </div>
            <div className="mt-1 text-base font-bold">{values.title}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-foreground/50">
                Freelancer
              </div>
              <div className="mt-1 text-sm font-semibold">{freelancerName}</div>
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-foreground/50">
                Total Escrow Amount
              </div>
              <div className="mt-1 text-2xl font-extrabold">
                <GradientText>
                  ${values.totalAmount.toLocaleString()}
                </GradientText>
              </div>
            </div>
          </div>

          {/* Platform Fee Breakdown */}
          <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20 text-xs font-semibold space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-emerald-500">
              Platform Fee Allocation & Payout Breakdown ({(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%)
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Gross Contract Amount:</span>
              <span className="font-bold">${values.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Platform Fee ({(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%):</span>
              <span className="font-bold">-${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-emerald-500/20 pt-1.5 font-bold">
              <span className="text-foreground/90">Freelancer Net Payout ({((1 - FREELANCER_FEE_PERCENTAGE) * 100).toFixed(0)}%):</span>
              <span className="text-emerald-400">${freelancerNet.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-bold">Milestone Breakdown</h3>
            <ol className="mt-3 space-y-3">
              {values.milestones.map((m, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-3.5 text-xs font-semibold"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Milestone {idx + 1}</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ${m.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-foreground/80 font-medium">
                    {m.description}
                  </p>
                  <div className="mt-1.5 text-[11px] text-foreground/50">
                    Due {formatDateLong(new Date(m.deadline))}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Button type="button" variant="ghost" onClick={onBack} disabled={isFunding} className="font-bold text-xs">
            ← Back to edit scope
          </Button>
        </GlassCard>

        {/* Stripe Payment Method Selection */}
        {paymentMethod === "stripe" && (
          <StripeCardForm
            amount={values.totalAmount}
            onDetailsChange={(_details, valid) => setIsCardValid(valid)}
          />
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
        <GlassCard variant="elevated" className="p-6 space-y-4 border-emerald-500">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-emerald-500" />
              <h3 className="text-base font-extrabold">Payment & Escrow</h3>
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400"
            >
              256-Bit SSL
            </span>
          </div>

          {/* Payment Method Switcher */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/10 dark:bg-white/5 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaymentMethod("stripe")}
              className={cn(
                "py-2 rounded-lg transition-all",
                paymentMethod === "stripe"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              Stripe Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("crypto")}
              className={cn(
                "py-2 rounded-lg transition-all",
                paymentMethod === "crypto"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              Crypto Escrow
            </button>
          </div>

          {paymentMethod === "crypto" ? (
            <div className="space-y-3 pt-2">
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-foreground/50">
                  Demo Wallet Address
                </div>
                <div className="mt-1.5">
                  <WalletPill address={DEMO_WALLET_ADDRESS} connected />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground/60">Mock Balance</span>
                <span className="font-mono">{MOCK_BALANCE_ETH} ETH</span>
              </div>
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-foreground/50">
                  ETH Escrow Equivalent
                </div>
                <div className="mt-1 font-mono text-2xl font-extrabold">
                  <GradientText>{ethAmount}</GradientText>
                  <span className="ml-1 text-sm text-foreground/70">ETH</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2 text-xs font-semibold text-foreground/75">
              <div className="flex justify-between">
                <span>Contract Total:</span>
                <span className="font-bold text-foreground">${values.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Platform Fee ({(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%):</span>
                <span>-${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--glass-border)] pt-2 font-extrabold text-foreground">
                <span>Total Due Now:</span>
                <span className="text-emerald-400">${values.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <AzureButton
            type="button"
            size="lg"
            className="w-full mt-2"
            onClick={onFund}
            disabled={isFunding || (paymentMethod === "stripe" && !isCardValid)}
          >
            {isFunding ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Processing Payment...
              </>
            ) : (
              `Pay $${values.totalAmount.toLocaleString()} & Fund Escrow`
            )}
          </AzureButton>
        </GlassCard>
      </div>
    </div>
  );
}

// ───── STEP 3 ────────────────────────────────────────────────────────────────

interface StepThreeProps {
  escrow: EscrowResult;
  contractId: string;
  onView: () => void;
  onBackToMarketplace: () => void;
}

function StepThreeConfirm({
  escrow,
  contractId,
  onView,
  onBackToMarketplace,
}: StepThreeProps) {
  void contractId;
  const explorerUrl = `https://sepolia.etherscan.io/tx/${escrow.txHash}`;

  function copyHash() {
    void navigator.clipboard
      .writeText(escrow.txHash)
      .then(() => toast.success("Tx hash copied."))
      .catch(() => toast.error("Could not copy."));
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <CheckCircle2
          className="size-16 text-emerald-500"
          style={{ filter: "drop-shadow(0 0 24px rgba(16,185,129,0.4))" }}
        />
        <h1 className="text-2xl font-semibold">
          Contract created and funded
        </h1>
        <p className="text-sm text-foreground/60">
          Funds locked in escrow. The freelancer will be notified.
        </p>
      </div>

      <GlassCard className="p-5 space-y-3">
        <h3 className="text-sm font-semibold">Transaction details</h3>

        <div>
          <div className="text-xs uppercase tracking-wider text-foreground/50">
            Tx hash
          </div>
          <div className="mt-1 flex items-center gap-2">
            <code className="font-mono text-xs text-foreground/80">
              {truncateHash(escrow.txHash)}
            </code>
            <button
              type="button"
              aria-label="Copy transaction hash"
              onClick={copyHash}
              className="inline-flex size-7 items-center justify-center rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[color:var(--azure-600)] hover:text-[color:var(--azure-500)]"
            >
              View on Etherscan
            </a>
            <span
              title="Mock transaction — production deploys to Sepolia testnet"
              className="inline-flex items-center text-foreground/50"
            >
              <Info className="size-3.5" />
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/60">Block</span>
          <span className="font-mono">
            {escrow.blockNumber.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/60">Gas used</span>
          <span className="font-mono">{escrow.gasUsed.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/60">Timestamp</span>
          <span className="font-mono">
            {new Date(escrow.timestamp).toLocaleString()}
          </span>
        </div>
      </GlassCard>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <AzureButton type="button" size="md" onClick={onView}>
          View contract
        </AzureButton>
        <Button type="button" variant="outline" onClick={onBackToMarketplace}>
          Back to marketplace
        </Button>
      </div>
    </div>
  );
}
