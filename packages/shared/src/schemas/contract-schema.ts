import { z } from "zod";

const MIN_MILESTONE_AMOUNT = 5;
const AMOUNT_EPSILON = 0.01;

const milestoneInput = z.object({
  description: z.string().min(10, "Describe this milestone clearly").max(500, "Keep descriptions under 500 characters"),
  amount: z.number({ message: "Amount is required" }).min(MIN_MILESTONE_AMOUNT, `Minimum $${MIN_MILESTONE_AMOUNT} per milestone`),
  deadline: z.date({ message: "Deadline is required" }).refine((d) => d.getTime() > Date.now(), "Deadline must be in the future"),
});

export const contractCreateSchema = z
  .object({
    gigId: z.string().min(1),
    freelancerId: z.string().min(1),
    selectedTier: z.enum(["basic", "standard", "premium"]),
    title: z.string().min(10, "Title must be at least 10 characters").max(120, "Title must be 120 characters or fewer"),
    totalAmount: z.number({ message: "Total amount is required" }).min(MIN_MILESTONE_AMOUNT, `Minimum total is $${MIN_MILESTONE_AMOUNT}`),
    milestones: z.array(milestoneInput).min(1, "Add at least one milestone").max(10, "Maximum of 10 milestones"),
  })
  .refine(
    (d) => { const sum = d.milestones.reduce((a, m) => a + m.amount, 0); return Math.abs(sum - d.totalAmount) < AMOUNT_EPSILON; },
    { message: "Milestone amounts must sum to total amount", path: ["milestones"] }
  );

export type ContractCreateInput = z.infer<typeof contractCreateSchema>;
export type ContractMilestoneInput = z.infer<typeof milestoneInput>;
