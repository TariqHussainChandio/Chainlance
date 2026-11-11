"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  ChevronRight,
  Filter,
  MessageSquare,
  Paperclip,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFileGuarantee } from "@/lib/cloudinary/upload-helpers";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  listClientContracts,
  listFreelancerContracts,
} from "@/lib/firebase/contracts";
import {
  markMessagesAsRead,
  sendMessage,
  subscribeMessages,
} from "@/lib/firebase/messages";
import { detectContactInfo } from "@/lib/utils/contact-detector";
import type {
  SerializedContract,
  SerializedMessage,
} from "@/lib/firebase/schema";
import { formatDateTime, formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

interface MessagesInboxProps {
  role: "freelancer" | "client";
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function MessagesInbox({ role }: MessagesInboxProps) {
  const searchParams = useSearchParams();
  const initialContractId = searchParams.get("contractId");
  const { user, loading: userLoading } = useCurrentUser();

  const [contracts, setContracts] = React.useState<SerializedContract[]>([]);
  const [selectedContractId, setSelectedContractId] = React.useState<string | null>(
    initialContractId
  );
  const [messages, setMessages] = React.useState<SerializedMessage[]>([]);
  const [loadingContracts, setLoadingContracts] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [newMessage, setNewMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Fetch contract threads for current user
  React.useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoadingContracts(false);
      return;
    }

    let cancelled = false;
    setLoadingContracts(true);

    const fetcher =
      role === "client"
        ? listClientContracts(user.uid)
        : listFreelancerContracts(user.uid);

    fetcher
      .then((data) => {
        if (cancelled) return;
        setContracts(data);
        if (!selectedContractId && data.length > 0) {
          setSelectedContractId(data[0]!.id);
        }
      })
      .catch((err) => {
        console.error("Failed to load contracts for messaging:", err);
        toast.error("Could not load message threads.");
      })
      .finally(() => {
        if (!cancelled) setLoadingContracts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, userLoading, role, selectedContractId]);

  // Subscribe to messages in the active contract
  React.useEffect(() => {
    if (!selectedContractId) {
      setMessages([]);
      return;
    }

    const unsub = subscribeMessages(selectedContractId, (nextMessages) => {
      setMessages(nextMessages);
      if (user) {
        void markMessagesAsRead(selectedContractId, user.uid);
      }
    });

    return () => unsub();
  }, [selectedContractId, user]);

  // Auto-scroll chat to latest message
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeContract = React.useMemo(
    () => contracts.find((c) => c.id === selectedContractId) || null,
    [contracts, selectedContractId]
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedContractId) return;

    const content = newMessage.trim();

    // Check PII & Contact Info
    const piiCheck = detectContactInfo(content);
    if (piiCheck.hasPII) {
      toast.error(
        piiCheck.reason ||
          "Security Restriction: Sharing personal emails, phone numbers, or external handles (WhatsApp, Telegram) is prohibited to prevent scam risk.",
        { duration: 6000 }
      );
      return;
    }

    setNewMessage("");
    setSending(true);

    try {
      await sendMessage({
        contractId: selectedContractId,
        senderId: user.uid,
        senderName: user.name,
        senderAvatar: user.profileImage,
        content,
      });
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send message.");
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const counterpartyName =
      role === "client" ? c.freelancerName : c.clientName;
    return (
      counterpartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (userLoading || loadingContracts) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr] h-[600px]">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <GlassCard className="p-8 text-sm">
        Please sign in to access messages.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Real-time chat threads with your {role === "client" ? "freelancers" : "clients"}.
          </p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-[color:var(--azure-500)]/10 text-[color:var(--azure-500)]">
            <MessageSquare className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No active conversations</h2>
            <p className="mt-1 text-sm text-foreground/60">
              {role === "client"
                ? "Browse talent and create a contract to start messaging."
                : "Apply to gigs or accept client contracts to start messaging."}
            </p>
          </div>
          <div className="mt-2">
            <AzureButton asChild size="sm">
              <Link href={role === "client" ? "/client/browse" : "/freelancer/gigs"}>
                {role === "client" ? "Browse Talent" : "View My Gigs"}
              </Link>
            </AzureButton>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] h-[calc(100vh-10rem)] sm:h-[75dvh] min-h-[460px] max-h-[750px] overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
          {/* Left Column: Contract Threads List */}
          <div
            className={cn(
              "flex flex-col border-r border-[var(--glass-border)] bg-black/5 dark:bg-white/5 h-full overflow-hidden",
              selectedContractId ? "hidden lg:flex" : "flex"
            )}
          >
            <div className="p-3 border-b border-[var(--glass-border)] shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-foreground/50" />
                <Input
                  placeholder="Search threads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto touch-scroll divide-y divide-[var(--glass-border)]">
              {filteredContracts.map((c) => {
                const isSelected = c.id === selectedContractId;
                const counterpartyName =
                  role === "client" ? c.freelancerName : c.clientName;
                const counterpartyAvatar =
                  role === "client" ? c.freelancerAvatar : c.clientAvatar;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedContractId(c.id)}
                    className={cn(
                      "w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-emerald-500/10",
                      isSelected && "bg-emerald-500/15 border-l-4 border-l-emerald-500"
                    )}
                  >
                    <Avatar className="size-9 shrink-0">
                      {counterpartyAvatar && (
                        <AvatarImage src={counterpartyAvatar} alt={counterpartyName} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-xs font-bold">
                        {initials(counterpartyName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate">
                          {counterpartyName}
                        </span>
                        <StatusPill status={c.status} className="scale-75 origin-right" />
                      </div>
                      <p className="text-xs font-medium text-foreground/80 truncate mt-0.5">
                        {c.title}
                      </p>
                      <p className="text-[10px] text-foreground/50 truncate mt-1">
                        ${c.totalAmount.toLocaleString()} • Created {formatRelativeTime(c.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Chat Area */}
          <div
            className={cn(
              "flex flex-col flex-1 h-full min-w-0 bg-transparent overflow-hidden",
              !selectedContractId ? "hidden lg:flex" : "flex"
            )}
          >
            {activeContract ? (
              <>
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-[var(--glass-border)] flex items-center justify-between bg-black/5 dark:bg-white/5 shrink-0 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedContractId(null)}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--glass-border)] text-foreground/70 lg:hidden"
                      aria-label="Back to threads"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <Avatar className="size-8 sm:size-10 shrink-0">
                      {role === "client" ? (
                        activeContract.freelancerAvatar ? (
                          <AvatarImage
                            src={activeContract.freelancerAvatar}
                            alt={activeContract.freelancerName}
                          />
                        ) : null
                      ) : activeContract.clientAvatar ? (
                        <AvatarImage
                          src={activeContract.clientAvatar}
                          alt={activeContract.clientName}
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-xs">
                        {initials(
                          role === "client"
                            ? activeContract.freelancerName
                            : activeContract.clientName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm truncate">
                        {role === "client"
                          ? activeContract.freelancerName
                          : activeContract.clientName}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-foreground/60 truncate">
                        Contract: <span className="font-medium text-foreground">{activeContract.title}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm" className="text-xs px-2.5">
                      <Link href={`/${role}/contracts/${activeContract.id}`}>
                        <span className="hidden sm:inline">View Contract</span>
                        <ArrowUpRight className="size-3.5 sm:ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 touch-scroll">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-foreground/50 text-xs">
                      <MessageSquare className="size-8 mb-2 opacity-50" />
                      No messages yet in this contract. Send a greeting below!
                    </div>
                  ) : (
                  messages.map((m) => {
                    const isSelf = m.senderId === user.uid;
                    const isSystem = m.senderId === "system";

                    if (isSystem) {
                      return (
                        <div key={m.id} className="flex justify-center my-2">
                          <div className="rounded-full bg-foreground/10 px-3 py-1 text-[11px] text-foreground/70 border border-[var(--glass-border)]">
                            {m.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex items-end gap-2 max-w-[88%] sm:max-w-[80%]",
                          isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                      >
                        {!isSelf && (
                          <Avatar className="size-7 shrink-0">
                            {m.senderAvatar ? (
                              <AvatarImage src={m.senderAvatar} alt={m.senderName} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-[10px]">
                              {initials(m.senderName)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div>
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm",
                              isSelf
                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-none"
                                : "bg-[var(--glass-bg)] border border-[var(--glass-border)] text-foreground rounded-bl-none"
                            )}
                          >
                            {m.content}
                            {m.attachmentUrl && (
                              <div className="mt-2 pt-2 border-t border-white/20">
                                <a
                                  href={m.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 font-bold underline hover:opacity-80 text-xs"
                                >
                                  <Paperclip className="size-3.5" />
                                  {m.attachmentName || "View Attachment"}
                                </a>
                              </div>
                            )}
                          </div>
                          <div
                            className={cn(
                              "mt-1 text-[10px] text-foreground/40 flex items-center gap-1",
                              isSelf ? "justify-end" : "justify-start"
                            )}
                          >
                            {formatRelativeTime(m.createdAt)}
                            {isSelf && m.readAt && (
                              <CheckCheck className="size-3 text-emerald-500 inline" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-[var(--glass-border)] bg-black/5 dark:bg-white/5 flex items-center gap-2"
              >
                <label className="cursor-pointer p-2 text-foreground/60 hover:text-emerald-500 transition-colors">
                  <Paperclip className="size-5" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !user || !selectedContractId) return;
                      toast.info(`Uploading ${file.name}...`);
                      try {
                        const uploadedUrl = await uploadFileGuarantee(file, "attachments");
                        await sendMessage({
                          contractId: selectedContractId,
                          senderId: user.uid,
                          senderName: user.name,
                          senderAvatar: user.profileImage,
                          content: `Attached file: ${file.name}`,
                          attachmentUrl: uploadedUrl,
                          attachmentName: file.name,
                        });
                        toast.success("File attached.");
                      } catch (err) {
                        toast.error("File upload failed.");
                      }
                    }}
                  />
                </label>

                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage(e);
                    }
                  }}
                  className="min-h-[44px] max-h-32 text-xs resize-none py-2.5"
                  rows={1}
                />
                <AzureButton
                  type="submit"
                  size="sm"
                  disabled={sending || !newMessage.trim()}
                  className="h-10 px-4 shrink-0"
                >
                  <Send className="size-4" />
                </AzureButton>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-foreground/50">
              <MessageSquare className="size-10 mb-2 opacity-40" />
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
