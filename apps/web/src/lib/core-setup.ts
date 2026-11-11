"use client";

/**
 * Wires @chainwork/core's platform ports to their web implementations.
 * Imported once from the root client providers so it runs before any page
 * calls into core. Importing the firebase-client /web entry also guarantees
 * Firebase itself is initialized from NEXT_PUBLIC_* env vars.
 */

import "@chainwork/firebase-client/web";
import { setPorts } from "@chainwork/core";

import {
  getUserNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  sendChatMessageNotificationAction,
} from "@/app/actions/notifications";
import { playWebNotificationBell } from "@/lib/firebase/notifications-audio";

setPorts({
  notify: {
    async sendChatMessageNotification(input) {
      await sendChatMessageNotificationAction(input);
    },
  },
  notificationsFallback: {
    list: (userId) => getUserNotificationsAction(userId),
    markRead: async (notificationId) => {
      await markNotificationReadAction(notificationId);
    },
    markAllRead: async (userId) => {
      await markAllNotificationsReadAction(userId);
    },
  },
  audio: {
    playNotificationSound: playWebNotificationBell,
  },
  kvStorage: {
    get: (key) => {
      try {
        return typeof window === "undefined" ? null : window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set: (key, value) => {
      try {
        if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      } catch {
        /* storage unavailable */
      }
    },
    remove: (key) => {
      try {
        if (typeof window !== "undefined") window.localStorage.removeItem(key);
      } catch {
        /* storage unavailable */
      }
    },
  },
  link: {
    getAppUrl: (path) => {
      const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
      if (base) return `${base}${path}`;
      if (typeof window !== "undefined") return `${window.location.origin}${path}`;
      return path;
    },
    getCurrentUrl: () =>
      typeof window === "undefined" ? null : window.location.href,
  },
  session: {
    async onSignedIn() {
      /* web pages call postSessionCookie explicitly */
    },
    async onSignedOut() {
      await fetch("/api/session", { method: "DELETE" });
    },
  },
});
