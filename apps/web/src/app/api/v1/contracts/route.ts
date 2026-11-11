import { handleApi } from "@/lib/server/auth";
import { createContract, type CreateContractInput } from "@/app/actions/contracts";

export async function POST(request: Request) {
  const body = (await request.json()) as CreateContractInput;
  return handleApi(() => createContract(body));
}
