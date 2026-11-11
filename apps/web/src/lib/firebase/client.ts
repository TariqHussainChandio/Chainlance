// Source of truth moved to @chainwork/firebase-client.
// The /web entry auto-initializes Firebase from NEXT_PUBLIC_* env vars.
// This re-export keeps all existing @/lib/firebase/client imports working.
export { app, auth, db, storage } from "@chainwork/firebase-client/web";
