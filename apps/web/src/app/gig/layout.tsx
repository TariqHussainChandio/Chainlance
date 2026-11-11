import { PublicNavbar } from "@/components/public-navbar";
import { getCurrentUser } from "@/lib/firebase/server-auth";

export default async function GigPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <PublicNavbar user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
