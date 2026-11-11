import { handleApi } from "@/lib/server/auth";
import {
  createAdminUser,
  demoteAdmin,
  promoteUserToAdmin,
} from "@/app/actions/admin-roles";
import type { AdminRole } from "@chainwork/shared";

type AdminRolesRequest =
  | { action: "create"; name: string; email: string; password: string; adminRole: AdminRole }
  | { action: "promote"; targetUserId: string; adminRole?: AdminRole }
  | { action: "demote"; targetUserId: string };

export async function POST(request: Request) {
  const body = (await request.json()) as AdminRolesRequest;
  return handleApi(async () => {
    switch (body.action) {
      case "create":
        return createAdminUser({
          name: body.name,
          email: body.email,
          password: body.password,
          adminRole: body.adminRole,
        });
      case "promote":
        return promoteUserToAdmin(body.targetUserId, body.adminRole);
      case "demote":
        return demoteAdmin(body.targetUserId);
      default:
        throw new Error("Unknown admin roles action.");
    }
  });
}
