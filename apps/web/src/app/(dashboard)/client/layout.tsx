import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/server-auth";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "client") redirect(`/${user.role}`);

  return <>{children}</>;
}
