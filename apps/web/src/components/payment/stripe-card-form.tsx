"use client";

import * as React from "react";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  calculateTransactionFee,
  PLATFORM_FEE_PERCENTAGE,
  FREELANCER_FEE_PERCENTAGE,
} from "@/lib/payment/platform-fees";

export interface StripeCardDetails {
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  postalCode: string;
}

interface StripeCardFormProps {
  amount: number;
  onDetailsChange?: (details: StripeCardDetails, isValid: boolean) => void;
  className?: string;
}

export function StripeCardForm({
  amount,
  onDetailsChange,
  className,
}: StripeCardFormProps) {
  const [nameOnCard, setNameOnCard] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");

  // Format card number as 0000 0000 0000 0000
  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  }

  // Format expiry as MM/YY
  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 2) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  }

  // Format CVC (3-4 digits)
  function handleCvcChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvc(raw);
  }

  // Check validity
  const cleanCard = cardNumber.replace(/\s/g, "");
  const isValid =
    nameOnCard.trim().length >= 2 &&
    cleanCard.length >= 15 &&
    expiry.length === 5 &&
    cvc.length >= 3 &&
    postalCode.trim().length >= 3;

  React.useEffect(() => {
    onDetailsChange?.(
      { nameOnCard, cardNumber, expiry, cvc, postalCode },
      isValid
    );
  }, [nameOnCard, cardNumber, expiry, cvc, postalCode, isValid, onDetailsChange]);

  // Determine card brand icon label
  const cardBrand = cleanCard.startsWith("4")
    ? "VISA"
    : cleanCard.startsWith("5")
    ? "MASTERCARD"
    : cleanCard.startsWith("3")
    ? "AMEX"
    : "STRIPE";

  const { platformFee: websiteFee, freelancerEarnings: freelancerAmount } = calculateTransactionFee(amount);

  return (
    <GlassCard variant="elevated" className={cn("p-6 space-y-5 border-emerald-500/40", className)}>
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <CreditCard className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">
              Stripe Secure Payment
            </h3>
            <p className="text-[11px] font-semibold text-foreground/60">
              Encrypted 256-bit SSL transaction
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-400 border border-emerald-500/30">
          {cardBrand}
        </span>
      </div>

      {/* Platform Fee Summary Breakdown */}
      <div className="rounded-xl bg-emerald-500/10 p-3.5 border border-emerald-500/20 text-xs font-semibold space-y-1.5">
        <div className="flex justify-between">
          <span className="text-foreground/75">Order Total:</span>
          <span className="font-bold text-foreground">${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-emerald-400">
          <span>Platform Fee ({(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%):</span>
          <span className="font-bold">-${websiteFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-emerald-500/20 pt-1.5">
          <span className="text-foreground/80">Freelancer Net Payout ({((1 - FREELANCER_FEE_PERCENTAGE) * 100).toFixed(0)}%):</span>
          <span className="font-extrabold text-emerald-400">
            ${freelancerAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Cardholder Name *</Label>
          <Input
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            placeholder="John Doe"
            className="text-xs font-medium"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold">Card Number *</Label>
          <div className="relative">
            <Input
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className="text-xs font-mono font-bold pr-12"
              required
            />
            <CreditCard className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Expires *</Label>
            <Input
              value={expiry}
              onChange={handleExpiryChange}
              placeholder="MM/YY"
              maxLength={5}
              className="text-xs font-mono font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">CVC / CVV *</Label>
            <Input
              value={cvc}
              onChange={handleCvcChange}
              placeholder="123"
              maxLength={4}
              className="text-xs font-mono font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Postal Code *</Label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="90210"
              className="text-xs font-mono font-bold"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground/60 pt-2 border-t border-[var(--glass-border)]">
        <Lock className="size-3.5 text-emerald-500 shrink-0" />
        <span>Payments are processed securely via Stripe. Funds remain in escrow until milestone approval.</span>
      </div>
    </GlassCard>
  );
}
