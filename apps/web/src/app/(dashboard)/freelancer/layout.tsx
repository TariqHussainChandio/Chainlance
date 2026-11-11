import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/server-auth";

export default async function FreelancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "freelancer") redirect(`/${user.role}`);

  return <>{children}</>;
}
