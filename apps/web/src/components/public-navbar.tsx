"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureButton } from "@/components/ui/azure-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassCard } from "@/components/ui/glass-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  deleteSessionCookie,
  signOut,
} from "@/lib/firebase/auth-helpers";
import type { SerializedUser } from "@/lib/firebase/schema";

interface PublicNavbarProps {
  user: SerializedUser | null;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function PublicNavbar({ user }: PublicNavbarProps) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut();
      await deleteSessionCookie();
      toast.success("Signed out.");
      router.refresh();
    } catch {
      toast.error("Could not sign out.");
    }
  }

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2.5 sm:py-4">
        <GlassCard className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-[var(--cyan-accent)] text-white shadow-[0_4px_18px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform duration-200">
              <LinkIcon className="size-4" />
            </span>
            <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-foreground via-foreground to-emerald-500 bg-clip-text">ChainWork</span>
          </Link>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-[color:var(--azure-500)]/5 transition-colors"
                  >
                    <Avatar className="size-8">
                      {user.profileImage && (
                        <AvatarImage src={user.profileImage} alt={user.name} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-[var(--azure-500)] to-[var(--cyan-accent)] text-white text-xs font-bold">
                        {initials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="size-4 text-foreground/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${user.role}`}>
                      <LayoutDashboard className="size-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleSignOut}
                    variant="destructive"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-foreground/70 hover:text-foreground transition-colors px-2"
                >
                  Sign in
                </Link>
                <AzureButton asChild size="sm">
                  <Link href="/register">Get started</Link>
                </AzureButton>
              </>
            )}
          </nav>
        </GlassCard>
      </div>
    </header>
  );
}
