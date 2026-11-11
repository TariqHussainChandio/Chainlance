import { z } from "zod";

const LINKEDIN_RE = /linkedin\.com\//i;
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

export const individualVerificationSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("linkedin"),
    profileUrl: z.string().url("Enter a valid URL").refine((u) => LINKEDIN_RE.test(u), { message: "Must be a linkedin.com profile URL" }),
  }),
  z.object({
    method: z.literal("whatsapp"),
    phoneNumber: z.string().regex(PHONE_RE, "Enter a valid international phone number (e.g. +447911123456)"),
  }),
  z.object({
    method: z.literal("phone"),
    phoneNumber: z.string().regex(PHONE_RE, "Enter a valid international phone number (e.g. +14155552671)"),
  }),
]);
export type IndividualVerificationInput = z.infer<typeof individualVerificationSchema>;

export const organizationVerificationSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required").max(120, "Name too long"),
  linkedinUrl: z.string().url("Enter a valid URL").refine((u) => LINKEDIN_RE.test(u), { message: "Must be a linkedin.com company page URL" }),
});
export type OrganizationVerificationInput = z.infer<typeof organizationVerificationSchema>;
