import { handleApi } from "@/lib/server/auth";
import {
  adminListAllUsers,
  setUserBanState,
  type SetUserBanInput,
} from "@/app/actions/admin-users";

export async function GET() {
  return handleApi(async () => ({ users: await adminListAllUsers() }));
}

/** Ban / unban. */
export async function POST(request: Request) {
  const body = (await request.json()) as SetUserBanInput;
  return handleApi(() => setUserBanState(body));
}
