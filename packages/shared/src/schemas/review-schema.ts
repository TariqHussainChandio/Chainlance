import { z } from "zod";
import { containsEmoji, isValidTag } from "../utils/text-validation";

export const reviewSchema = z.object({
  contractId: z.string().min(1),
  revieweeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(20, "Please share more detail").max(1000, "Keep reviews under 1000 characters"),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(1000).refine((v) => !containsEmoji(v), { message: "Bio must not contain emojis." }).nullable().optional(),
  profileImage: z.string().url().nullable().optional(),
  tags: z
    .array(z.string().min(1, "Tag cannot be empty").refine((t) => isValidTag(t), { message: "Tags may only contain letters (A–Z, a–z)." }))
    .max(10, "Maximum 10 tags")
    .optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
