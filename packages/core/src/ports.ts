import type { SerializedNotification } from "@chainwork/shared";

/**
 * Platform seams. Core modules call these instead of touching anything
 * platform-specific (server actions, window, localStorage, audio, cookies).
 *
 * - Web wires them in apps/web/src/lib/core-setup.ts
 * - Mobile wires them in apps/mobile/src/lib/core-setup.ts
 *
 * Every port has a safe no-op default so core never crashes unconfigured.
 */

export interface ChatMessageNotifyInput {
  contractId: string;
  senderId: string;
  senderName: string;
  content: string;
}

export interface NotifyPort {
  /** Notify the other contract participant about a new chat message. */
  sendChatMessageNotification(input: ChatMessageNotifyInput): Promise<void>;
}

export interface NotificationsFallbackPort {
  /** Server-backed fallbacks used when direct Firestore access is denied. */
  list(userId: string): Promise<SerializedNotification[]>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}

export interface AudioPort {
  playNotificationSound(): void;
}

/**
 * Synchronous key-value storage (web: localStorage). React Native wires an
 * in-memory mirror hydrated from AsyncStorage at startup.
 */
export interface KVStoragePort {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export interface LinkPort {
  /** Absolute URL for an app path, e.g. "/auth/confirm" → "https://app/auth/confirm". */
  getAppUrl(path: string): string;
  /** The URL currently being viewed (web: window.location.href), if any. */
  getCurrentUrl(): string | null;
}

export interface SessionPort {
  /** Called after a successful sign-in (web: POST /api/session cookie). */
  onSignedIn(extra?: Record<string, unknown>): Promise<void>;
  /** Called after sign-out (web: DELETE /api/session). */
  onSignedOut(): Promise<void>;
}

export interface CorePorts {
  notify: NotifyPort;
  notificationsFallback: NotificationsFallbackPort;
  audio: AudioPort;
  kvStorage: KVStoragePort;
  link: LinkPort;
  session: SessionPort;
}

const memoryStore = new Map<string, string>();

const defaults: CorePorts = {
  notify: {
    async sendChatMessageNotification() {
      /* no-op until a platform wires it */
    },
  },
  notificationsFallback: {
    async list() {
      return [];
    },
    async markRead() {},
    async markAllRead() {},
  },
  audio: {
    playNotificationSound() {},
  },
  kvStorage: {
    get: (key) => memoryStore.get(key) ?? null,
    set: (key, value) => {
      memoryStore.set(key, value);
    },
    remove: (key) => {
      memoryStore.delete(key);
    },
  },
  link: {
    getAppUrl: (path) => path,
    getCurrentUrl: () => null,
  },
  session: {
    async onSignedIn() {},
    async onSignedOut() {},
  },
};

export const ports: CorePorts = { ...defaults };

export function setPorts(overrides: Partial<CorePorts>): void {
  Object.assign(ports, overrides);
}
