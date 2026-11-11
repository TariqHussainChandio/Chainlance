"use client";

import * as React from "react";
import { MessageSquare, Send, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { establishConnectionAction } from "@/app/actions/connections";
import type { SerializedGig, SerializedUser } from "@/lib/firebase/schema";

interface ConnectFreelancerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gig: SerializedGig;
  user: SerializedUser;
  onConnected?: () => void;
}

export function ConnectFreelancerModal({
  open,
  onOpenChange,
  gig,
  user,
  onConnected,
}: ConnectFreelancerModalProps) {
  const [message, setMessage] = React.useState(
    `Hi ${gig.freelancerName}, I'm interested in ordering your gig "${gig.title}". I would like to discuss my project requirements before placing the order.`
  );
  const [submitting, setSubmitting] = React.useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) {
      toast.error("Please enter a message (at least 10 characters) to connect with the freelancer.");
      return;
    }

    setSubmitting(true);
    try {
      await establishConnectionAction({
        freelancerId: gig.freelancerId,
        freelancerName: gig.freelancerName,
        gigId: gig.id,
        gigTitle: gig.title,
        message,
      });

      toast.success(`Connection & Order Request submitted to ${gig.freelancerName}! Scope awaiting freelancer approval.`);
      onOpenChange(false);
      onConnected?.();
    } catch (err) {
      console.error("Failed to connect freelancer:", err);
      toast.error(
        err instanceof Error ? err.message : "Could not establish connection. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-500">
            <UserCheck className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Connect with Freelancer First
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            ChainWork requires clients to connect and send an initial message to the freelancer before placing an order or creating a contract.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConnect} className="space-y-4 py-2">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-start gap-2.5 text-xs font-semibold text-foreground/80">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-400">Order Requirement:</span>
              <p className="mt-0.5 text-[11px] font-medium leading-relaxed">
                Send an initial message to {gig.freelancerName} to discuss scope and establish your connection.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center justify-between">
              <span>Initial Message to {gig.freelancerName} *</span>
              <span className="text-[10px] text-foreground/50">Required</span>
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your project goals, scope questions, or custom needs..."
              className="text-xs font-medium"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
              <Send className="size-3.5 mr-1.5" />
              {submitting ? "Connecting..." : "Send Message & Connect"}
            </AzureButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
