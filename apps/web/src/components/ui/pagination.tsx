"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number; // 1-indexed
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
  showDetails?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
  showDetails = true,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const validPage = Math.max(1, Math.min(currentPage, totalPages));

  const startItem = totalItems && pageSize ? (validPage - 1) * pageSize + 1 : null;
  const endItem =
    totalItems && pageSize ? Math.min(validPage * pageSize, totalItems) : null;

  // Compute pagination range numbers
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (validPage > 3) pages.push("...");
    
    const start = Math.max(2, validPage - 1);
    const end = Math.min(totalPages - 1, validPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    
    if (validPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-t border-[var(--glass-border)] pt-4 px-2 text-xs",
        className
      )}
    >
      {showDetails && (
        <div className="text-foreground/60 font-medium">
          {startItem !== null && endItem !== null && totalItems !== undefined ? (
            <span>
              Showing <strong className="text-foreground">{startItem}</strong>–
              <strong className="text-foreground">{endItem}</strong> of{" "}
              <strong className="text-foreground">{totalItems}</strong> entries
            </span>
          ) : (
            <span>
              Page <strong className="text-foreground">{validPage}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(1)}
          disabled={validPage <= 1}
          title="First Page"
          className="size-7"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(validPage - 1)}
          disabled={validPage <= 1}
          className="h-7 px-2.5 text-xs font-semibold gap-1"
        >
          <ChevronLeft className="size-3.5" />
          Prev
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-foreground/40 font-bold">
                  …
                </span>
              );
            }
            const isSelected = p === validPage;
            return (
              <Button
                key={`page-${p}`}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="xs"
                onClick={() => onPageChange(p as number)}
                className={cn(
                  "size-7 font-bold transition-all",
                  isSelected
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    : "border-[var(--glass-border)] hover:bg-emerald-500/10 text-foreground/80"
                )}
              >
                {p}
              </Button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(validPage + 1)}
          disabled={validPage >= totalPages}
          className="h-7 px-2.5 text-xs font-semibold gap-1"
        >
          Next
          <ChevronRight className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(totalPages)}
          disabled={validPage >= totalPages}
          title="Last Page"
          className="size-7"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
