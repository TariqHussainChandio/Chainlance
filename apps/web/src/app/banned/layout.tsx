import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/server-auth";

/**
 * Minimal layout for restricted accounts. Sits OUTSIDE the (dashboard)
 * route group so the sidebar/topbar chrome doesn't apply. The dashboard
 * layout bounces banned users here; this layout only enforces that you
 * are signed in.
 */
export default async function BannedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
