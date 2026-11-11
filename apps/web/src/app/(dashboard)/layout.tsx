import { redirect } from "next/navigation";

import {
  DashboardSidebar,
  DashboardTopbar,
} from "./_components/sidebar";
import { VerifyEmailBanner } from "@/components/ui/verify-email-banner";
import { getCurrentUser } from "@/lib/firebase/server-auth";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Banned users can't see the dashboard chrome — bounce them to the
  // stripped /banned screen which lives outside this layout group.
  if (user.role === "banned") redirect("/banned");

  // Admin role flips the entire dashboard chrome (sidebar/topbar/main)
  // to the red theme via CSS-var override defined in globals.css.
  const themeClass = user.role === "admin" ? "admin-theme" : "";

  return (
    <div className={cn("flex h-screen flex-1 overflow-hidden", themeClass)}>
      <DashboardSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <VerifyEmailBanner userRole={user.role} />
        <DashboardTopbar user={user} />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 touch-scroll">{children}</main>
      </div>
    </div>
  );
}
