"use client";

import * as React from "react";
import { AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderCountdownTimerProps {
  deadlineMs: number;
  className?: string;
}

export function OrderCountdownTimer({
  deadlineMs,
  className,
}: OrderCountdownTimerProps) {
  const [now, setNow] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = deadlineMs - now;
  const isOverdue = diffMs <= 0;

  if (isOverdue) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-xs font-extrabold text-red-600 dark:text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse",
          className
        )}
      >
        <AlertCircle className="size-4 text-red-500" />
        <span>Delivery Overdue</span>
      </div>
    );
  }

  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isWarning = diffMs < 24 * 60 * 60 * 1000;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl border p-4 backdrop-blur-xl transition-all",
        isWarning
          ? "border-amber-500/40 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.25)]"
          : "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.25)]",
        className
      )}
    >
      <div className="flex items-center gap-2 pr-2 border-r border-[var(--glass-border)]">
        <Clock
          className={cn(
            "size-5",
            isWarning ? "text-amber-400 animate-bounce" : "text-emerald-400 animate-spin [animation-duration:6s]"
          )}
        />
        <div>
          <div className="text-[10px] uppercase font-extrabold tracking-wider text-foreground/60">
            Delivery Deadline
          </div>
          <div
            className={cn(
              "text-xs font-extrabold",
              isWarning ? "text-amber-400" : "text-emerald-400"
            )}
          >
            {isWarning ? "Ending Soon" : "In Progress"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono">
        <TimeBox label="Days" value={days} />
        <span className="text-lg font-bold text-foreground/40">:</span>
        <TimeBox label="Hours" value={hours} />
        <span className="text-lg font-bold text-foreground/40">:</span>
        <TimeBox label="Mins" value={minutes} />
        <span className="text-lg font-bold text-foreground/40">:</span>
        <TimeBox label="Secs" value={seconds} />
      </div>
    </div>
  );
}

function TimeBox({ label, value }: { label: string; value: number }) {
  const formatted = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <span className="rounded-lg bg-black/20 dark:bg-white/10 px-2.5 py-1 text-sm font-extrabold text-foreground border border-white/10">
        {formatted}
      </span>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-foreground/50">
        {label}
      </span>
    </div>
  );
}
