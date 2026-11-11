"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AzureButton } from "@/components/ui/azure-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    toast.success("Thank you! Your message has been sent to our support team.");
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-bold text-emerald-500 hover:text-emerald-400"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex size-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Mail className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Contact Us & Support
            </h1>
            <p className="text-xs font-semibold text-foreground/60">
              We are available 24/7 to answer questions and resolve disputes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 md:col-span-2 space-y-6 border-emerald-500/30">
          {submitted ? (
            <div className="p-8 text-center space-y-4">
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="size-8" />
              </div>
              <h2 className="text-2xl font-extrabold">Message Received!</h2>
              <p className="text-xs text-foreground/75 font-semibold">
                Our support desk has received your ticket. We will respond within 12 hours.
              </p>
              <AzureButton
                type="button"
                size="md"
                onClick={() => setSubmitted(false)}
              >
                Send Another Message
              </AzureButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold">
                  Your Full Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold">
                  Your Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-bold">
                  Subject / Inquiry Type
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Account Question, Contract Dispute"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-bold">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  rows={4}
                  required
                />
              </div>

              <AzureButton type="submit" size="lg" className="w-full">
                <Send className="size-4 mr-2" />
                Submit Support Request
              </AzureButton>
            </form>
          )}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-6 space-y-4 border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-sm">
              <Mail className="size-4" />
              Direct Email
            </div>
            <p className="text-xs font-semibold text-foreground/80">
              support@chainwork.test
            </p>
          </GlassCard>

          <GlassCard className="p-6 space-y-4 border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-sm">
              <MessageSquare className="size-4" />
              Human Admin SLA
            </div>
            <p className="text-xs font-semibold text-foreground/80">
              Disputes and critical account inquiries are reviewed with a 5-day SLA guarantee.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
