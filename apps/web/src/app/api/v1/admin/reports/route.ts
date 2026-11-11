import { handleApi } from "@/lib/server/auth";
import { generatePlatformReport } from "@/app/actions/reports";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = (url.searchParams.get("range") ?? "30d") as "7d" | "30d" | "90d" | "all";
  return handleApi(() => generatePlatformReport({ range }));
}
