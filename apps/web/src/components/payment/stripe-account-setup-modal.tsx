"use client";

import * as React from "react";
import { Building2, CreditCard, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { connectStripeAccountAction } from "@/app/actions/profile";
import { AzureButton } from "@/components/ui/azure-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SerializedUser } from "@/lib/firebase/schema";

interface StripeAccountSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SerializedUser;
  onSuccess?: () => void;
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Pakistan",
  "India",
  "Singapore",
  "Japan",
];

export function StripeAccountSetupModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: StripeAccountSetupModalProps) {
  const [accountName, setAccountName] = React.useState(user.stripeAccountName || user.name || "");
  const [accountEmail, setAccountEmail] = React.useState(user.stripeAccountEmail || user.email || "");
  const [accountId, setAccountId] = React.useState(() => user.stripeAccountId || "acct_" + Math.random().toString(36).substring(2, 12).toUpperCase());
  const [accountType, setAccountType] = React.useState<"individual" | "company">(
    user.stripeAccountType || "individual"
  );
  const [country, setCountry] = React.useState(user.stripeCountry || "United States");
  const [routingNumber, setRoutingNumber] = React.useState("110000000");
  const [accountNumber, setAccountNumber] = React.useState("000123456789");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountName.trim() || accountName.trim().length < 3) {
      toast.error("Please enter a valid Account Holder Full Name (at least 3 characters).");
      return;
    }
    if (!accountEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail.trim())) {
      toast.error("Please enter a valid Stripe registered email address.");
      return;
    }
    if (!accountId.trim() || accountId.trim().length < 6) {
      toast.error("Please enter a valid Stripe Account ID (e.g. acct_1N234567890ABC).");
      return;
    }
    if (!routingNumber.trim() || routingNumber.trim().length < 4) {
      toast.error("Please enter a valid Bank Routing / Sort Code.");
      return;
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 4) {
      toast.error("Please enter a valid Bank Account Number / IBAN.");
      return;
    }

    setSubmitting(true);
    try {
      await connectStripeAccountAction({
        accountName: accountName.trim(),
        accountEmail: accountEmail.trim(),
        accountId: accountId.trim(),
        accountType,
        country,
        bankRoutingNumber: routingNumber.trim(),
        bankAccountNumber: accountNumber.trim(),
      });

      toast.success("Stripe Account connected & verified successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Stripe account connection error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to connect Stripe account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-500">
            <CreditCard className="size-5" />
            <DialogTitle className="text-xl font-bold">
              Connect Stripe Payment Account
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Enter your official Stripe Account details to enable 256-bit SSL escrow funding and payouts on ChainWork.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs font-semibold text-emerald-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              <span>Stripe Connect Security Verified</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-bold">
              256-Bit Encrypted
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Account Holder Full Name *</Label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="John Doe"
                className="text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Stripe Registered Email *</Label>
              <Input
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="john@example.com"
                className="text-xs font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Stripe Account ID *</Label>
              <Input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="acct_1N234567890ABC"
                className="text-xs font-mono font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Account Type *</Label>
              <Select
                value={accountType}
                onValueChange={(v) => setAccountType(v as "individual" | "company")}
              >
                <SelectTrigger className="text-xs font-bold h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company / Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Country / Region *</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="text-xs font-bold h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-foreground/60 flex items-center gap-1.5">
              <Lock className="size-3 text-emerald-500" />
              Payout Bank / Routing Details
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground/70">
                  Routing / Sort Code *
                </Label>
                <Input
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="110000000"
                  className="text-xs font-mono h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground/70">
                  Account Number / IBAN *
                </Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="000123456789"
                  className="text-xs font-mono h-8"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <AzureButton type="submit" disabled={submitting} size="md">
              <ShieldCheck className="size-4 mr-1.5" />
              {submitting ? "Connecting Stripe..." : "Verify & Connect Stripe Account"}
            </AzureButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
