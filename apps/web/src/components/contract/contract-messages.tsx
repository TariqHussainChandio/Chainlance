"use client";

import * as React from "react";
import { AlertTriangle, Check, CheckCheck, Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Textarea } from "@/components/ui/textarea";
import {
  markMessagesAsRead,
  sendMessage,
  subscribeMessages,
} from "@/lib/firebase/messages";
import type { SerializedMessage, SerializedUser } from "@/lib/firebase/schema";
import { detectContactInfo } from "@/lib/utils/contact-detector";
import { cn } from "@/lib/utils";

interface Counterparty {
  id: string;
  name: string;
  avatar: string | null;
}

interface ContractMessagesProps {
  contractId: string;
  currentUser: SerializedUser;
  counterparty: Counterparty;
}

const SYSTEM_SENDER = "system";
const GROUP_WINDOW_MS = 2 * 60 * 1000;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

function formatTime(ms: number): string {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface GroupedMessage {
  message: SerializedMessage;
  showHeader: boolean;
}

function groupConsecutive(messages: SerializedMessage[]): GroupedMessage[] {
  return messages.map((m, idx) => {
    if (idx === 0) return { message: m, showHeader: true };
    const prev = messages[idx - 1]!;
    const sameSender = prev.senderId === m.senderId;
    const closeInTime = m.createdAt - prev.createdAt < GROUP_WINDOW_MS;
    return { message: m, showHeader: !sameSender || !closeInTime };
  });
}

export function ContractMessages({
  contractId,
  currentUser,
  counterparty,
}: ContractMessagesProps) {
  const [messages, setMessages] = React.useState<SerializedMessage[]>([]);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const atBottomRef = React.useRef(true);

  React.useEffect(() => {
    const unsub = subscribeMessages(contractId, (next) => {
      setMessages(next);
      setReady(true);
    });
    return () => unsub();
  }, [contractId]);

  // Auto-scroll when at bottom, and mark counterparty messages as read.
  React.useEffect(() => {
    if (!ready) return;
    if (atBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    void markMessagesAsRead(contractId, currentUser.uid).catch(() => {
      /* read-receipt failures are non-blocking */
    });
  }, [messages, ready, contractId, currentUser.uid]);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = fromBottom < 24;
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const piiCheck = detectContactInfo(trimmed);
    if (piiCheck.hasPII) {
      toast.error(
        piiCheck.reason ||
          "Security Restriction: Sharing personal contact information (email, phone, WhatsApp) is prohibited.",
        { duration: 6000 }
      );
      return;
    }

    setSending(true);
    try {
      await sendMessage({
        contractId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderAvatar: currentUser.profileImage ?? null,
        content: trimmed,
      });
      setText("");
      atBottomRef.current = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const grouped = React.useMemo(() => groupConsecutive(messages), [messages]);

  return (
    <GlassCard className="flex max-h-[480px] flex-col overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 backdrop-blur-xl">
        <Avatar className="size-8">
          {counterparty.avatar ? (
            <AvatarImage src={counterparty.avatar} alt={counterparty.name} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-[10px]">
            {initials(counterparty.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-sm font-medium leading-none">
            {counterparty.name}
          </div>
          <div className="mt-0.5 text-[11px] text-foreground/50">
            Messages are part of the contract record.
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {!ready ? (
          <div className="flex justify-center py-6 text-xs text-foreground/50">
            Loading…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-foreground/60">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-[color:var(--azure-500)]/10 text-[color:var(--azure-500)]">
              <MessageSquare className="size-5" />
            </span>
            Start the conversation.
          </div>
        ) : (
          grouped.map(({ message, showHeader }) => (
            <MessageRow
              key={message.id}
              message={message}
              showHeader={showHeader}
              currentUserId={currentUser.uid}
              counterparty={counterparty}
            />
          ))
        )}
      </div>

      <div className="border-t border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-3 backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message…"
            rows={1}
            disabled={sending}
            className="max-h-32 min-h-9 resize-none"
          />
          <AzureButton
            type="button"
            size="sm"
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </AzureButton>
        </div>
        <div className="mt-1 text-[10px] text-foreground/40">
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </GlassCard>
  );
}

interface MessageRowProps {
  message: SerializedMessage;
  showHeader: boolean;
  currentUserId: string;
  counterparty: Counterparty;
}

function MessageRow({
  message,
  showHeader,
  currentUserId,
  counterparty,
}: MessageRowProps) {
  if (message.senderId === SYSTEM_SENDER) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="size-3" />
          {message.content}
        </div>
      </div>
    );
  }

  const mine = message.senderId === currentUserId;
  const avatar = mine ? null : counterparty.avatar;
  const name = mine ? null : counterparty.name;

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        mine ? "justify-end" : "justify-start"
      )}
    >
      {!mine ? (
        <div className="w-7">
          {showHeader ? (
            <Avatar className="size-7">
              {avatar ? <AvatarImage src={avatar} alt={name ?? ""} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-[10px]">
                {initials(name ?? message.senderName)}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      ) : null}

      <div className={cn("max-w-[70%]", mine ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm leading-snug shadow-sm",
            mine
              ? "bg-gradient-to-br from-[var(--azure-500)] to-[var(--azure-700)] text-white"
              : "bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-xl text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px] text-foreground/50",
            mine ? "justify-end" : "justify-start"
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {mine ? (
            message.readAt ? (
              <CheckCheck className="size-3 text-[color:var(--azure-500)]" />
            ) : (
              <Check className="size-3" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
