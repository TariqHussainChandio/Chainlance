// Moved to @chainwork/core — this shim keeps existing @/lib/firebase imports working.
// Web-only audio helpers live in ./notifications-audio (wired via core ports).
export * from "@chainwork/core/firestore/notifications";
export { unlockAudioContextOnUserGesture } from "./notifications-audio";
