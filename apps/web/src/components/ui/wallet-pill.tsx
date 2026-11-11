import * as React from "react";

import { cn } from "@/lib/utils";

interface WalletPillProps extends React.HTMLAttributes<HTMLDivElement> {
  address: string;
  connected?: boolean;
}

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletPill({
  address,
  connected = true,
  className,
  ...props
}: WalletPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1",
        "backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]",
        "text-xs font-mono text-foreground/80",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          connected
            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            : "bg-slate-400"
        )}
        aria-hidden
      />
      <span className="truncate max-w-[16ch]">{truncate(address)}</span>
    </div>
  );
}
