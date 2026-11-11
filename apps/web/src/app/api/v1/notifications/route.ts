import { handleApi } from "@/lib/server/auth";
import {
  createNotificationAction,
  deleteNotificationAction,
  getUserNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import type { NotificationType } from "@chainwork/shared";

export async function GET() {
  return handleApi(async () => ({
    notifications: await getUserNotificationsAction(),
  }));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string | null;
  };
  return handleApi(() => createNotificationAction(body));
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: string; all?: boolean };
  return handleApi(() =>
    body.all ? markAllNotificationsReadAction() : markNotificationReadAction(body.id ?? "")
  );
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  return handleApi(() => deleteNotificationAction(id));
}
