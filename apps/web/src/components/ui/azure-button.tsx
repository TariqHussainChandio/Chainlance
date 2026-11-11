import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

interface AzureButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<NonNullable<AzureButtonProps["size"]>, string> = {
  sm: "h-9 px-4 text-xs font-bold",
  md: "h-10 px-5 text-sm font-bold",
  lg: "h-12 px-7 text-base font-extrabold",
};

export const AzureButton = React.forwardRef<
  HTMLButtonElement,
  AzureButtonProps
>(function AzureButton(
  { className, size = "md", asChild = false, ...props },
  ref
) {
  const Component = (asChild ? Slot.Root : "button") as React.ElementType;
  return (
    <Component
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 rounded-xl font-bold tracking-wide",
        "text-white whitespace-nowrap select-none cursor-pointer",
        "bg-gradient-to-r from-emerald-500 via-[var(--azure-500)] to-teal-500",
        "border-t border-white/40 ring-1 ring-emerald-400/50",
        "shadow-[0_8px_28px_rgba(16,185,129,0.4)]",
        "transition-all duration-200 ease-out",
        "hover:shadow-[0_16px_40px_rgba(16,185,129,0.6)] hover:scale-[1.03] hover:brightness-110",
        "active:scale-[0.98] active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
        "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
