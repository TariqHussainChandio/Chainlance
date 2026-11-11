/**
 * @chainwork/core — platform-agnostic data layer shared by web and mobile.
 *
 * Domain modules are deep-imported to keep their namespaces separate:
 *   import { searchGigs } from "@chainwork/core/firestore/gigs";
 *   import { subscribeMessages } from "@chainwork/core/firestore/messages";
 *   import { signIn } from "@chainwork/core/auth/auth-helpers";
 *   import { useCurrentUser } from "@chainwork/core/hooks/use-current-user";
 *
 * The root entry exports the cross-cutting pieces only.
 */
export * from "./ports";
export * from "./api/client";
