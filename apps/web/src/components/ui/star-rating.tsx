"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  readOnly?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

export function StarRating({
  value,
  onChange,
  size = "md",
  className,
  readOnly = false,
}: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const interactive = !readOnly && typeof onChange === "function";

  function handleClick(next: number) {
    if (!interactive) return;
    onChange!(next);
  }

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role={interactive ? "radiogroup" : undefined}
      aria-label="Star rating"
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hovered ?? value) >= n;
        return (
          <button
            key={n}
            type="button"
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? value === n : undefined}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            tabIndex={interactive ? 0 : -1}
            onMouseEnter={() => interactive && setHovered(n)}
            onClick={() => handleClick(n)}
            disabled={!interactive}
            className={cn(
              "rounded-sm transition-transform",
              interactive
                ? "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--azure-400)]"
                : "cursor-default"
            )}
          >
            <Star
              className={cn(
                SIZE_CLASSES[size],
                active
                  ? "fill-amber-400 text-amber-400"
                  : "text-foreground/30"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
