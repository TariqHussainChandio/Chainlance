import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6">
      <header className="flex w-full max-w-md items-center justify-between py-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white shadow-[0_4px_16px_rgba(14,165,255,0.35)]">
            <LinkIcon className="size-4" />
          </span>
          <span className="font-bold tracking-tight">ChainWork</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex w-full flex-1 items-center justify-center py-6 sm:py-10">
        {children}
      </main>
      <div className="h-2" />
    </div>
  );
}
