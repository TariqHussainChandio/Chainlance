/**
 * Web (Next.js) entry: initializes Firebase from NEXT_PUBLIC_* env vars at
 * import time. Re-exports the live-binding `app/auth/db/storage` singletons,
 * so existing web imports keep working unchanged.
 */
import { initFirebase } from "./init";

initFirebase({
  config: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
});

export * from "./init";
