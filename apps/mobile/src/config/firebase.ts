// Firebase initialization moved to src/lib/core-setup.ts (initFirebase with
// React Native AsyncStorage persistence). This re-export keeps existing
// `config/firebase` imports working. core-setup is imported first so the
// live bindings are populated before anything here is used.
import "../lib/core-setup";

export { app, auth, db, storage } from "@chainwork/firebase-client";
