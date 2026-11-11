import * as React from "react";

import { cn } from "@/lib/utils";

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: keyof React.JSX.IntrinsicElements;
}

export function GradientText({
  as: Tag = "span",
  className,
  children,
  ...props
}: GradientTextProps) {
  const Component = Tag as React.ElementType;
  return (
    <Component
      className={cn(
        "inline-block bg-gradient-to-r from-emerald-500 via-[var(--azure-500)] to-[var(--cyan-accent)] dark:from-emerald-300 dark:via-teal-300 dark:to-[var(--cyan-accent)] bg-clip-text text-transparent drop-shadow-sm font-extrabold",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
