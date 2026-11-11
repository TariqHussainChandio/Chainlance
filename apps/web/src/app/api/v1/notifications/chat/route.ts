import { handleApi } from "@/lib/server/auth";
import { sendChatMessageNotificationAction } from "@/app/actions/notifications";

/** Notify the other contract participant about a new chat message. */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    contractId: string;
    senderId: string;
    senderName: string;
    content: string;
  };
  return handleApi(() => sendChatMessageNotificationAction(body));
}
