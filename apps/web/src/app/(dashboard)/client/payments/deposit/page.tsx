"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { AzureButton } from "@/components/ui/azure-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StripeCardForm, type StripeCardDetails } from "@/components/payment/stripe-card-form";

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = React.useState("100");
  const [loading, setLoading] = React.useState(false);
  const [isCardValid, setIsCardValid] = React.useState(false);
  const [cardDetails, setCardDetails] = React.useState<StripeCardDetails | null>(null);

  async function handleDeposit() {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    if (!isCardValid || !cardDetails) {
      toast.error("Please fill out valid Stripe card details.");
      return;
    }

    setLoading(true);
    try {
      // Process payment via Stripe process API endpoint
      const res = await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depositAmount,
          contractId: `DEPOSIT-${Date.now()}`,
          freelancerId: "system-escrow",
          freelancerName: "Wallet Balance Deposit",
          type: "deposit",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Stripe payment processing failed.");
      }

      toast.success(
        `Successfully deposited $${depositAmount.toFixed(2)} to your wallet.`
      );
      router.push("/client/payments");
    } catch (error) {
      toast.error("Deposit failed. Please check card details.");
    } finally {
      setLoading(false);
    }
  }

  const numericAmount = parseFloat(amount) || 0;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 font-bold text-xs"
      >
        <ArrowLeft className="size-4" />
        Back to Payments
      </Button>

      <div className="space-y-6">
        <GlassCard variant="elevated" className="p-6 border-emerald-500/30">
          <div className="text-center mb-6">
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <CreditCard className="size-6" />
            </div>
            <h1 className="mt-3 text-2xl font-extrabold">Add Funds via Stripe</h1>
            <p className="mt-1 text-xs font-semibold text-foreground/60">
              Secure card processing for smart contract escrow deposits.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount" className="text-xs font-bold">
                Deposit Amount (USD) *
              </Label>
              <Input
                id="deposit-amount"
                type="number"
                min={10}
                step={10}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="mt-1 text-lg font-bold"
              />
              <p className="mt-1 text-[11px] font-semibold text-foreground/50">
                Minimum deposit: $10.00
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Stripe Card Form */}
        <StripeCardForm
          amount={numericAmount}
          onDetailsChange={(_details, valid) => {
            setCardDetails(_details);
            setIsCardValid(valid);
          }}
        />

        <AzureButton
          onClick={handleDeposit}
          disabled={loading || numericAmount <= 0 || !isCardValid}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Processing Stripe Payment...
            </>
          ) : (
            `Pay & Deposit $${numericAmount.toFixed(2)}`
          )}
        </AzureButton>
      </div>
    </div>
  );
}