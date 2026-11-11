import { z } from "zod";
import type { KycDocumentType } from "../schema";

export const KYC_DOC_TYPES = ["passport", "national_id", "drivers_license"] as const satisfies readonly KycDocumentType[];

export const KYC_DOC_TYPE_LABELS: Record<KycDocumentType, string> = {
  passport: "Passport",
  national_id: "National ID",
  drivers_license: "Driver's license",
};

export const kycSubmissionSchema = z.object({
  documentType: z.enum(KYC_DOC_TYPES),
  documentUrl: z.string().url(),
  documentPublicId: z.string().min(1),
});
export type KycSubmissionInput = z.infer<typeof kycSubmissionSchema>;

export const kycReviewSchema = z
  .object({
    submissionId: z.string().min(1),
    decision: z.enum(["approve", "reject"]),
    reason: z.string().min(8).max(500).optional(),
  })
  .refine(
    (d) => d.decision === "approve" || (d.reason && d.reason.trim().length >= 8),
    { message: "Reason is required when rejecting.", path: ["reason"] }
  );
export type KycReviewInput = z.infer<typeof kycReviewSchema>;
