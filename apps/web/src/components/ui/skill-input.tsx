"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SkillInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function SkillInput({
  value,
  onChange,
  placeholder = "Type a skill and press Enter",
  max = 10,
  className,
  id,
  disabled = false,
}: SkillInputProps) {
  const [draft, setDraft] = React.useState("");
  const atMax = value.length >= max;

  function commit() {
    const trimmed = draft.trim().replace(/,+$/, "");
    if (!trimmed) return;
    if (atMax) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function removeAt(index: number) {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((skill, idx) => (
          <span
            key={`${skill}-${idx}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[color:var(--azure-500)]/10 px-3 py-1 text-xs font-medium text-[color:var(--azure-700)] dark:text-[color:var(--azure-300)] backdrop-blur-xl"
          >
            {skill}
            <button
              type="button"
              aria-label={`Remove ${skill}`}
              onClick={() => removeAt(idx)}
              disabled={disabled}
              className="rounded-full p-0.5 transition-colors hover:bg-[color:var(--azure-500)]/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={atMax ? `Max ${max} skills` : placeholder}
        disabled={disabled || atMax}
        aria-disabled={atMax || disabled}
      />
      <p className="text-xs text-foreground/60">
        {value.length}/{max} · Press Enter or comma to add
      </p>
    </div>
  );
}
