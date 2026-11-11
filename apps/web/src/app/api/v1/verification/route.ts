import { handleApi } from "@/lib/server/auth";
import {
  reviewVerification,
  submitIndividualVerification,
  submitOrganizationVerification,
} from "@/app/actions/verification";
import type {
  IndividualVerificationInput,
  OrganizationVerificationInput,
} from "@chainwork/shared";

type VerificationRequest =
  | { kind: "individual"; input: IndividualVerificationInput }
  | { kind: "organization"; input: OrganizationVerificationInput }
  | { kind: "review"; targetUid: string; decision: "verified" | "rejected" };

export async function POST(request: Request) {
  const body = (await request.json()) as VerificationRequest;
  return handleApi(async () => {
    switch (body.kind) {
      case "individual":
        return submitIndividualVerification(body.input);
      case "organization":
        return submitOrganizationVerification(body.input);
      case "review":
        return reviewVerification(body.targetUid, body.decision);
      default:
        throw new Error("Unknown verification request kind.");
    }
  });
}
