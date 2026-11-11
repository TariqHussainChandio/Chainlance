"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  CheckCheck,
  FileText,
  Info,
  Send,
  MessageSquare,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  playNotificationBellSound,
  subscribeUserNotifications,
  unlockAudioContextOnUserGesture,
} from "@/lib/firebase/notifications";
import { deleteNotificationAction } from "@/app/actions/notifications";
import type { NotificationType, SerializedNotification, SerializedUser } from "@/lib/firebase/schema";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  user: SerializedUser | null;
}

function timeAgo(timestampMs: number): string {
  const diff = Date.now() - timestampMs;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_ICONS: Record<
  NotificationType,
  { Icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  contract: { Icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/15" },
  milestone: { Icon: CheckCircle, color: "text-teal-500", bg: "bg-teal-500/15" },
  proposal: { Icon: Send, color: "text-cyan-500", bg: "bg-cyan-500/15" },
  dispute: { Icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/15" },
  system: { Icon: Info, color: "text-purple-500", bg: "bg-purple-500/15" },
  message: { Icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/15" },
};

function getFallbackNotifications(role: string = "client"): SerializedNotification[] {
  const now = Date.now();
  if (role === "freelancer") {
    return [
      {
        id: "demo_1",
        userId: "demo",
        title: "Welcome to ChainWork Suite 🚀",
        message: "Smart contract escrow & AI recommendations are active on your profile.",
        type: "system",
        link: "/freelancer/gigs",
        read: false,
        createdAt: now - 1000 * 60 * 5,
      },
      {
        id: "demo_2",
        userId: "demo",
        title: "Dispute & Payment Protection Active 🛡️",
        message: "All contract milestone funds are locked safely in escrow before work begins.",
        type: "contract",
        link: "/freelancer/contracts",
        read: true,
        createdAt: now - 1000 * 60 * 60 * 2,
      },
    ];
  }

  return [
    {
      id: "demo_1",
      userId: "demo",
      title: "Welcome to ChainWork 🌟",
      message: "Decentralized AI freelancing marketplace with smart contract escrow protection.",
      type: "system",
      link: "/client/browse",
      read: false,
      createdAt: now - 1000 * 60 * 5,
    },
    {
      id: "demo_2",
      userId: "demo",
      title: "AI Recommendation Engine Ready ⚡",
      message: "Top rated freelancers with verified ratings are matched to your posted gigs.",
      type: "proposal",
      link: "/client/contracts",
      read: true,
      createdAt: now - 1000 * 60 * 60 * 3,
    },
  ];
}

export function NotificationBell({ user }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<SerializedNotification[]>([]);
  const [dismissedIds, setDismissedIds] = React.useState<string[]>([]);
  const [demoReadIds, setDemoReadIds] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);

  React.useEffect(() => {
    unlockAudioContextOnUserGesture();

    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    const unsub = subscribeUserNotifications(user.uid, (list, hasNewUnread) => {
      setNotifications(list);
      if (hasNewUnread) {
        playNotificationBellSound();
        const latest = list.find((n) => !n.read);
        if (latest) {
          toast.info(latest.title, { description: latest.message });
        }
      }
    });

    return () => unsub();
  }, [user?.uid]);

  const rawList =
    notifications.length > 0
      ? notifications
      : getFallbackNotifications(user?.role);

  const displayList = rawList
    .filter((item) => !dismissedIds.includes(item.id))
    .map((item) => (demoReadIds.includes(item.id) ? { ...item, read: true } : item));

  const unreadCount = displayList.filter((n) => !n.read).length;

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
  }

  async function handleNotificationClick(item: SerializedNotification) {
    if (item.id.startsWith("demo_")) {
      setDemoReadIds((prev) => [...prev, item.id]);
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      void markNotificationAsRead(item.id);
    }
    setOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  }

  async function handleDeleteNotification(e: React.MouseEvent, notificationId: string) {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, notificationId]);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    toast.success("Notification deleted.");
    if (!notificationId.startsWith("demo_")) {
      void deleteNotificationAction(notificationId);
    }
  }

  async function handleMarkAllRead() {
    if (markingAll) return;
    setMarkingAll(true);

    const unreadDemoIds = displayList
      .filter((n) => !n.read && n.id.startsWith("demo_"))
      .map((n) => n.id);

    if (unreadDemoIds.length > 0) {
      setDemoReadIds((prev) => [...prev, ...unreadDemoIds]);
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      if (user?.uid && notifications.length > 0) {
        await markAllNotificationsAsRead(user.uid);
      }
      toast.success("All notifications marked as read.");
    } catch {
      // optimistic update handled
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications (${unreadCount} unread)`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-xl bg-background/80 border border-[var(--glass-border)] text-foreground/80 hover:text-emerald-500 hover:border-emerald-500/40 transition-all duration-200 shadow-sm"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-extrabold text-white shadow-md animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 backdrop-blur-2xl bg-background/95 dark:bg-card/95 border border-[var(--glass-border)] text-foreground shadow-2xl overflow-hidden rounded-2xl"
      >
        <PopoverHeader className="flex flex-row items-center justify-between p-3.5 border-b border-[var(--glass-border)] bg-muted/40">
          <div className="flex items-center gap-2">
            <PopoverTitle className="text-sm font-extrabold tracking-tight">
              Notifications
            </PopoverTitle>
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                {unreadCount} new
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="h-7 px-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10"
            >
              {markingAll ? (
                <Loader2 className="size-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="size-3.5 mr-1" />
              )}
              Mark read
            </Button>
          )}
        </PopoverHeader>

        <div className="max-h-80 overflow-y-auto divide-y divide-[var(--glass-border)]">
          {displayList.map((item) => {
            const meta = TYPE_ICONS[item.type] || TYPE_ICONS.system;
            const { Icon } = meta;
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={cn(
                  "group relative flex items-start gap-3 w-full p-3.5 text-left transition-colors hover:bg-emerald-500/10 cursor-pointer",
                  !item.read ? "bg-emerald-500/5 font-medium" : "opacity-75"
                )}
              >
                <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-xl mt-0.5", meta.bg, meta.color)}>
                  <Icon className="size-4" />
                </span>
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-xs leading-snug truncate", !item.read ? "font-extrabold text-foreground" : "font-semibold text-foreground/80")}>
                      {item.title}
                    </span>
                    <span className="text-[10px] text-foreground/50 shrink-0 font-mono">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/75 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-1">
                  {!item.read && (
                    <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  )}
                  <button
                    type="button"
                    title="Delete notification"
                    onClick={(e) => handleDeleteNotification(e, item.id)}
                    className="opacity-60 group-hover:opacity-100 p-1 text-foreground/40 hover:text-red-500 hover:bg-red-500/15 rounded-lg transition-all"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
