import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Loader,
  Package,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  ContractStatus,
  MilestoneStatus,
} from "@/lib/firebase/schema";

export type PillStatus = ContractStatus | MilestoneStatus;

interface StatusPillProps {
  status: PillStatus;
  className?: string;
  /** Adds a soft glow halo. Use on prominent placements (header). */
  glow?: boolean;
}

interface StatusVisual {
  label: string;
  className: string;
  glowClassName: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const statusMap: Record<PillStatus, StatusVisual> = {
  draft: {
    label: "Draft",
    className:
      "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    glowClassName: "",
    Icon: FileText,
  },
  active: {
    label: "Active",
    className:
      "bg-[color:var(--azure-500)]/15 text-[color:var(--azure-700)] dark:text-[color:var(--azure-300)] border-[color:var(--azure-500)]/30",
    glowClassName: "shadow-[0_0_18px_rgba(16,185,129,0.4)]",
    Icon: Loader,
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    glowClassName: "",
    Icon: Package,
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    glowClassName: "",
    Icon: CheckCircle,
  },
  disputed: {
    label: "Disputed",
    className:
      "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    glowClassName: "shadow-[0_0_18px_rgba(239,68,68,0.35)]",
    Icon: AlertTriangle,
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-foreground/10 text-foreground/60 border-foreground/15",
    glowClassName: "",
    Icon: XCircle,
  },
  pending: {
    label: "Pending",
    className:
      "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    glowClassName: "",
    Icon: FileText,
  },
  approved: {
    label: "Approved",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    glowClassName: "",
    Icon: CheckCircle,
  },
};

export function StatusPill({ status, className, glow = false }: StatusPillProps) {
  const visual = statusMap[status];
  const { Icon } = visual;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-xl",
        visual.className,
        glow && visual.glowClassName,
        className
      )}
    >
      <Icon
        className={cn(
          "size-3.5",
          status === "active" && "animate-spin [animation-duration:3s]"
        )}
      />
      {visual.label}
    </span>
  );
}
