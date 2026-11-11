// Moved to @chainwork/core — this shim keeps existing @/lib/firebase imports working.
// Web-only flows (Google popup, session cookie) live in ./auth-web.
export * from "@chainwork/core/auth/auth-helpers";
export * from "./auth-web";
