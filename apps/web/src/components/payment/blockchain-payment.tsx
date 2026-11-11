"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  Wallet,
} from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  blockchainPaymentSchema,
  fiatPaymentSchema,
  CRYPTO_CURRENCIES,
  CRYPTO_LABELS,
  FIAT_CURRENCIES,
  FIAT_LABELS,
  type BlockchainPaymentInput,
  type FiatPaymentInput,
  type CryptoCurrency,
} from "@/lib/schemas/payment-schema";
import { cn } from "@/lib/utils";

/** Rates as of 2026-10-14 (fiat USD per 1 crypto unit) — static. */
const USD_RATES: Record<CryptoCurrency, number> = {
  BTC:  67500,
  ETH:  3450,
  USDC: 1.00,
  USDT: 1.00,
};

function toCryptoAmount(usd: number, currency: CryptoCurrency): string {
  const amount = usd / USD_RATES[currency];
  if (currency === "BTC") return amount.toFixed(6);
  if (currency === "ETH") return amount.toFixed(5);
  return amount.toFixed(2);
}

interface Props {
  contractId: string;
  milestoneId?: string;
  amountUsd: number;
  /** Called after a successful payment submission */
  onSuccess?: (txHash: string) => void;
}

type ActiveTab = "blockchain" | "fiat";

export function BlockchainPayment({ contractId, milestoneId, amountUsd, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("blockchain");
  const [fiatExpanded, setFiatExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Blockchain form
  const blockchainForm = useForm<BlockchainPaymentInput>({
    resolver: zodResolver(blockchainPaymentSchema),
    defaultValues: {
      method: "blockchain",
      currency: "ETH",
      walletAddress: "",
      amountUsd,
      contractId,
      milestoneId,
    },
  });

  // Fiat fallback form
  const fiatForm = useForm<FiatPaymentInput>({
    resolver: zodResolver(fiatPaymentSchema),
    defaultValues: {
      method: "fiat",
      currency: "USD",
      amountUsd,
      stripePaymentMethodId: "",
      contractId,
      milestoneId,
    },
  });

  const selectedCrypto = useWatch({ control: blockchainForm.control, name: "currency" }) ?? "ETH";
  const cryptoAmount = toCryptoAmount(amountUsd, selectedCrypto);

  async function onBlockchainSubmit(values: BlockchainPaymentInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/process", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amountUsd,
          contractId: values.contractId,
          milestoneId: values.milestoneId,
          paymentMethod: "blockchain",
          walletAddress: values.walletAddress,
          cryptoCurrency: values.currency,
        }),
      });
      const data = (await res.json()) as { success?: boolean; txHash?: string; error?: string };
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Payment failed. Try again.");
        return;
      }
      toast.success("Blockchain payment submitted. Transaction hash: " + (data.txHash ?? ""));
      onSuccess?.(data.txHash ?? "");
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onFiatSubmit(values: FiatPaymentInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/process", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: values.amountUsd,
          contractId: values.contractId,
          milestoneId: values.milestoneId,
          paymentMethod: "fiat",
          currency: values.currency,
          stripePaymentMethodId: values.stripePaymentMethodId,
        }),
      });
      const data = (await res.json()) as { success?: boolean; txHash?: string; error?: string };
      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Payment failed. Try again.");
        return;
      }
      toast.success("Fiat payment submitted successfully.");
      onSuccess?.(data.txHash ?? "");
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Fund Escrow</h3>
        <div className="text-right">
          <p className="text-sm font-bold text-[color:var(--azure-400)]">
            ${amountUsd.toLocaleString()} USD
          </p>
          {activeTab === "blockchain" && (
            <p className="text-xs text-foreground/50 mt-0.5">
              ≈ {cryptoAmount} {selectedCrypto}
            </p>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("blockchain")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-all",
            activeTab === "blockchain"
              ? "bg-gradient-to-r from-[var(--azure-500)] to-[var(--cyan-accent)] text-white shadow-md"
              : "text-foreground/60 hover:text-foreground"
          )}
        >
          <Wallet className="size-3.5" />
          Blockchain
          <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            Primary
          </Badge>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fiat")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-all",
            activeTab === "fiat"
              ? "bg-gradient-to-r from-[var(--azure-500)] to-[var(--cyan-accent)] text-white shadow-md"
              : "text-foreground/60 hover:text-foreground"
          )}
        >
          <CreditCard className="size-3.5" />
          Bank / Card
          <Badge className="bg-yellow-500/15 text-yellow-500 text-[10px] font-bold">
            Fallback
          </Badge>
        </button>
      </div>

      {/* Blockchain tab */}
      {activeTab === "blockchain" && (
        <Form {...blockchainForm}>
          <form
            onSubmit={blockchainForm.handleSubmit(onBlockchainSubmit)}
            className="space-y-4"
          >
            <FormField
              control={blockchainForm.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Wallet className="size-4 text-[color:var(--azure-400)]" />
                    Wallet Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x1a2b3c... or bc1q..."
                      className="font-mono text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={blockchainForm.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cryptocurrency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CRYPTO_CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {c} — {CRYPTO_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-2 rounded-lg bg-[color:var(--azure-500)]/8 p-3 text-xs text-foreground/70">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-[color:var(--azure-400)]" />
              Funds are held in escrow and released to the freelancer only after
              milestone approval.
            </div>

            {/* Crypto amount summary before sending */}
            <div className="rounded-lg border border-[color:var(--azure-500)]/20 bg-[color:var(--azure-500)]/8 px-4 py-3">
              <p className="text-xs text-foreground/60 mb-1">You are sending</p>
              <p className="text-lg font-bold text-[color:var(--azure-400)]">
                {cryptoAmount} {selectedCrypto}
              </p>
              <p className="text-xs text-foreground/50 mt-0.5">
                = ${amountUsd.toLocaleString()} USD &nbsp;·&nbsp; {CRYPTO_LABELS[selectedCrypto]}
              </p>
            </div>

            <AzureButton
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Wallet className="size-4" />
                  Send {cryptoAmount} {selectedCrypto}
                </>
              )}
            </AzureButton>
          </form>
        </Form>
      )}

      {/* Fiat fallback tab */}
      {activeTab === "fiat" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-yellow-500/8 p-3 text-xs text-foreground/70">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-yellow-500" />
            Fiat transfer is available as a fallback when blockchain payment is
            unavailable. Supported currencies: EUR, GBP, USD, CAD, AUD.
          </div>

          {/* Expandable fiat form */}
          <button
            type="button"
            onClick={() => setFiatExpanded((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-bold text-foreground/70 hover:text-foreground"
          >
            <span>Enter payment details</span>
            {fiatExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          {fiatExpanded && (
            <Form {...fiatForm}>
              <form
                onSubmit={fiatForm.handleSubmit(onFiatSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={fiatForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="text-xs font-bold">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FIAT_CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c} className="text-xs">
                              {c} — {FIAT_LABELS[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={fiatForm.control}
                  name="stripePaymentMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="pm_1A2B3C4D5E6F..."
                          className="font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={submitting}
                  variant="outline"
                  className="w-full font-bold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      Pay via Fiat Transfer
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      )}
    </GlassCard>
  );
}
