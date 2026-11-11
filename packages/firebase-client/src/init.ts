import {
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Platform-injected Firebase initialization.
 *
 * - Web (Next.js): import "@chainwork/firebase-client/web", which calls
 *   `initFirebase` from NEXT_PUBLIC_* env vars with default web auth.
 * - React Native: call `initFirebase({ config, createAuth })` once at startup,
 *   passing `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`
 *   as `createAuth`.
 */
export interface InitFirebaseOptions {
  config: FirebaseOptions;
  /** Platform-specific Auth factory. Defaults to `getAuth(app)` (web persistence). */
  createAuth?: (app: FirebaseApp) => Auth;
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

/**
 * Live-binding singletons. They are assigned by `initFirebase` and are only
 * safe to USE (not read at module scope) after initialization — which both
 * platform entries guarantee: the /web entry initializes at import time, and
 * React Native calls initFirebase at startup before any screen renders.
 */
export let app: FirebaseApp = undefined as unknown as FirebaseApp;
export let auth: Auth = undefined as unknown as Auth;
export let db: Firestore = undefined as unknown as Firestore;
export let storage: FirebaseStorage = undefined as unknown as FirebaseStorage;

export function initFirebase(options: InitFirebaseOptions): FirebaseApp {
  if (appInstance) return appInstance;

  appInstance = getApps().length
    ? getApps()[0]!
    : initializeApp(options.config);
  authInstance = options.createAuth
    ? options.createAuth(appInstance)
    : getAuth(appInstance);
  dbInstance = getFirestore(appInstance);
  storageInstance = getStorage(appInstance);

  app = appInstance;
  auth = authInstance;
  db = dbInstance;
  storage = storageInstance;
  return appInstance;
}

export function isFirebaseInitialized(): boolean {
  return appInstance !== null;
}

function notInitialized(): never {
  throw new Error(
    "Firebase is not initialized. Import '@chainwork/firebase-client/web' (Next.js) " +
      "or call initFirebase({ config, createAuth }) once at app startup (React Native)."
  );
}

export function getFirebaseApp(): FirebaseApp {
  return appInstance ?? notInitialized();
}

export function getFirebaseAuth(): Auth {
  return authInstance ?? notInitialized();
}

export function getFirebaseDb(): Firestore {
  return dbInstance ?? notInitialized();
}

export function getFirebaseStorage(): FirebaseStorage {
  return storageInstance ?? notInitialized();
}
