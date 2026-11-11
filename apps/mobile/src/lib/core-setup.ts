/**
 * Initializes Firebase (React Native persistence) and wires @chainwork/core's
 * platform ports + API client for mobile. Imported once at the top of
 * index.js, before any screen renders.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — getReactNativePersistence is exported by the RN entry of
// firebase/auth but missing from the web type declarations.
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

import { configureApiClient, setPorts, api } from "@chainwork/core";
import { auth, initFirebase } from "@chainwork/firebase-client";

import { API_BASE_URL, FIREBASE_CONFIG } from "../config/env";

// ─── Firebase ────────────────────────────────────────────────────────────────

initFirebase({
  config: FIREBASE_CONFIG,
  createAuth: (app) =>
    initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    }),
});

// ─── API client (bearer-token REST to the web app's /api/v1) ────────────────

configureApiClient({
  baseUrl: API_BASE_URL,
  getToken: async () => (await auth.currentUser?.getIdToken()) ?? null,
  forceRefreshToken: async () => (await auth.currentUser?.getIdToken(true)) ?? null,
});

// ─── KV storage: synchronous mirror over AsyncStorage ───────────────────────

const kvCache = new Map<string, string>();
const KV_KEYS_INDEX = "@core_kv_keys";

/** Hydrates the synchronous mirror; call once at startup (fire-and-forget). */
export async function hydrateKvStorage(): Promise<void> {
  try {
    const rawIndex = await AsyncStorage.getItem(KV_KEYS_INDEX);
    const keys: string[] = rawIndex ? JSON.parse(rawIndex) : [];
    if (keys.length === 0) return;
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([k, v]) => {
      if (v !== null) kvCache.set(k, v);
    });
  } catch {
    /* mirror stays empty */
  }
}

function persistKeyIndex() {
  AsyncStorage.setItem(KV_KEYS_INDEX, JSON.stringify([...kvCache.keys()])).catch(
    () => {}
  );
}

// ─── Ports ───────────────────────────────────────────────────────────────────

setPorts({
  notify: {
    async sendChatMessageNotification(input) {
      try {
        // The server verifies the sender and derives the recipient from the contract.
        await api.post("/api/v1/notifications/chat", input);
      } catch {
        /* notification delivery is best-effort */
      }
    },
  },
  notificationsFallback: {
    list: async (userId) => {
      void userId; // the server scopes to the authenticated caller
      const res = await api.get<{ notifications: never[] }>("/api/v1/notifications");
      return res.notifications;
    },
    markRead: async (notificationId) => {
      await api.patch("/api/v1/notifications", { id: notificationId });
    },
    markAllRead: async () => {
      await api.patch("/api/v1/notifications", { all: true });
    },
  },
  audio: {
    playNotificationSound: () => {
      /* no notification sound on mobile v1 */
    },
  },
  kvStorage: {
    get: (key) => kvCache.get(key) ?? null,
    set: (key, value) => {
      kvCache.set(key, value);
      AsyncStorage.setItem(key, value).catch(() => {});
      persistKeyIndex();
    },
    remove: (key) => {
      kvCache.delete(key);
      AsyncStorage.removeItem(key).catch(() => {});
      persistKeyIndex();
    },
  },
  link: {
    // Email-link deep linking is web-only in v1; the confirm URL still points
    // at the web app so links keep working there.
    getAppUrl: (path) => `${API_BASE_URL}${path}`,
    getCurrentUrl: () => null,
  },
  session: {
    async onSignedIn() {
      /* bearer-token model: nothing to do */
    },
    async onSignedOut() {
      /* bearer-token model: nothing to do */
    },
  },
});
