"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  AlertOctagon,
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  ChevronDown,
  FileText,
  Gavel,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Menu,
  MessageSquare,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Star,
  User as UserIcon,
  Users,
  Wallet,
  CreditCard,
  TrendingUp,
  PieChart,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import {
  deleteSessionCookie,
  signOut,
} from "@/lib/firebase/auth-helpers";
import { getAdminRoleLabel, isSuperAdmin } from "@/lib/admin-permissions";
import type { SerializedUser } from "@/lib/firebase/schema";
import { BitcoinSidebarCalculator } from "@/components/payment/bitcoin-sidebar-calculator";

interface NavLink {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const freelancerNav: NavLink[] = [
  { href: "/freelancer", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/freelancer/gigs", label: "My gigs", Icon: Briefcase },
  { href: "/freelancer/proposals", label: "Proposals", Icon: FileText },
  { href: "/freelancer/contracts", label: "Contracts", Icon: ScrollText },
  { href: "/freelancer/messages", label: "Messages", Icon: MessageSquare },
  { href: "/freelancer/payments", label: "Earnings", Icon: Wallet },
  { href: "/freelancer/invoices", label: "Invoices", Icon: CreditCard },
  { href: "/freelancer/reviews", label: "Reviews", Icon: Star },
  { href: "/freelancer/profile", label: "Profile", Icon: UserIcon },
];

const clientNav: NavLink[] = [
  { href: "/client", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/client/browse", label: "Browse talent", Icon: Search },
  { href: "/client/proposals", label: "Proposals", Icon: FileText },
  { href: "/client/contracts", label: "Contracts", Icon: ScrollText },
  { href: "/client/messages", label: "Messages", Icon: MessageSquare },
  { href: "/client/payments", label: "Payments", Icon: CreditCard },
  { href: "/client/reviews", label: "Reviews", Icon: Star },
  { href: "/client/profile", label: "Profile", Icon: UserIcon },
];

const adminNav: NavLink[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", Icon: TrendingUp },
  { href: "/admin/kyc", label: "KYC review", Icon: ShieldCheck },
  { href: "/admin/fraud", label: "Fraud alerts", Icon: AlertTriangle },
  { href: "/admin/disputes", label: "Disputes", Icon: Gavel },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/payments", label: "Payments", Icon: CreditCard },
  { href: "/admin/reports", label: "Reports", Icon: PieChart },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

const bannedNav: NavLink[] = [
  { href: "/banned", label: "Account", Icon: AlertOctagon },
];

const navByRole: Record<SerializedUser["role"], NavLink[]> = {
  freelancer: freelancerNav,
  client: clientNav,
  admin: adminNav,
  banned: bannedNav,
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function pageTitleFromPath(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean).pop() ?? "";
  if (!seg) return "Dashboard";
  return seg
    .replace(/-/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function DashboardSidebar({ user }: { user: SerializedUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = navByRole[user.role];

  async function handleSignOut() {
    try {
      await signOut();
      await deleteSessionCookie();
      toast.success("Signed out.");
      router.push("/");
    } catch {
      toast.error("Could not sign out.");
    }
  }

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 sticky top-0 h-screen border-r border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-[var(--cyan-accent)] text-white shadow-[0_4px_18px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform duration-200">
            <LinkIcon className="size-4" />
          </span>
          <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-foreground via-foreground to-emerald-500 bg-clip-text">ChainWork</span>
        </Link>
      </div>

      <nav className="flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto touch-scroll">
        {links.map(({ href, label, Icon }) => {
          const isActive =
            pathname === href ||
            (href !== `/${user.role}` && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 border-l-4",
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 via-[color:var(--azure-500)]/15 to-transparent border-emerald-500 text-foreground font-bold shadow-[0_4px_16px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
                  : "border-transparent text-foreground/70 hover:text-foreground hover:bg-emerald-500/10 hover:translate-x-0.5"
              )}
            >
              <Icon className={cn("size-4 transition-transform duration-200", isActive && "text-emerald-500 scale-110")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bitcoin Payment Calculator Section */}
      <div className="px-3.5 py-2 shrink-0 border-t border-[var(--glass-border)]/50">
        <BitcoinSidebarCalculator user={user} />
      </div>

      <div className="border-t border-[var(--glass-border)] p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-emerald-500/10 transition-colors border border-transparent hover:border-emerald-500/20"
            >
              <Avatar className="size-9 ring-2 ring-emerald-500/40">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-teal-400 text-white text-xs font-bold">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{user.name}</div>
                <div className="truncate text-xs text-emerald-500 font-medium capitalize">
                  {user.role === "admin" ? getAdminRoleLabel(user) : user.role}
                </div>
              </div>
              <ChevronDown className="size-4 text-foreground/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel className="truncate">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${user.role}/profile`}>
                <UserIcon className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut} variant="destructive">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export function DashboardTopbar({ user }: { user: SerializedUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = navByRole[user.role];

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    try {
      await signOut();
      await deleteSessionCookie();
      toast.success("Signed out.");
      router.push("/");
    } catch {
      toast.error("Could not sign out.");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shrink-0">
        <div className="flex h-full items-center justify-between px-3.5 sm:px-6 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] text-foreground/80 hover:text-foreground hover:bg-emerald-500/10 md:hidden focus:outline-none transition-all duration-200 active:scale-95",
                mobileOpen && "bg-emerald-500/20 text-emerald-500 border-emerald-500/40"
              )}
              aria-label={mobileOpen ? "Close mobile menu" : "Open mobile menu"}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-[10px] sm:text-xs uppercase tracking-wider font-extrabold truncate",
                  user.role === "banned"
                    ? "text-red-500"
                    : "text-emerald-500"
                )}
              >
                {user.role === "admin"
                  ? `${getAdminRoleLabel(user)} Control`
                  : user.role === "client"
                    ? "Client Portal"
                    : user.role === "banned"
                      ? "Restricted account"
                      : "Freelancer Suite"}
              </div>
              <div className="text-sm sm:text-lg font-extrabold tracking-tight truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                {pageTitleFromPath(pathname)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <span
              title="Demo escrow simulates blockchain confirmation. No real wallet required."
              className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300"
            >
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
              Demo mode
            </span>
            <ThemeToggle />
            <NotificationBell user={user} />
            <Avatar className="size-8 sm:size-9 ring-2 ring-emerald-500/30 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-teal-400 text-white text-xs font-bold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Matching app theme with glass effect */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background/95 backdrop-blur-xl overflow-y-auto">
          <div className="min-h-full w-full flex flex-col p-6">
            {/* Close button */}
            <div className="flex justify-end mb-6">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-3 text-foreground/70 hover:text-foreground hover:bg-emerald-500/10 rounded-xl border border-[var(--glass-border)]"
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Brand */}
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-[var(--cyan-accent)] text-white shadow-[0_4px_18px_rgba(16,185,129,0.4)]">
                <LinkIcon className="size-6" />
              </span>
              <span className="font-extrabold tracking-tight text-2xl bg-gradient-to-r from-foreground via-foreground to-emerald-500 bg-clip-text text-transparent">
                ChainWork
              </span>
            </div>

            {/* Subtitle */}
            <div className="text-xs font-bold uppercase text-emerald-500 tracking-wider mb-8">
              {user.role === "freelancer" ? "Freelancer Suite" : `${user.role} Portal`}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-2">
              {links.map(({ href, label, Icon }) => {
                const isActive =
                  pathname === href ||
                  (href !== `/${user.role}` && pathname.startsWith(`${href}/`));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl text-base transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent text-foreground font-bold shadow-[0_4px_16px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
                        : "text-foreground/70 hover:text-foreground hover:bg-emerald-500/10"
                    )}
                  >
                    <Icon className={cn("size-5 shrink-0", isActive ? "text-emerald-500" : "text-foreground/50")} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Bitcoin Payment Calculator */}
            <div className="my-4">
              <BitcoinSidebarCalculator user={user} />
            </div>

            {/* Footer - User Info & Sign Out */}
            <div className="border-t border-[var(--glass-border)] pt-4 mt-6 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <Avatar className="size-10 shrink-0 ring-2 ring-emerald-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 via-[var(--azure-500)] to-teal-400 text-white text-sm font-bold">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-foreground">{user.name}</div>
                  <div className="truncate text-xs text-emerald-500 font-bold capitalize">
                    {user.role === "admin" ? getAdminRoleLabel(user) : user.role}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  void handleSignOut();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors border border-destructive/30"
              >
                <LogOut className="size-4 shrink-0" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}