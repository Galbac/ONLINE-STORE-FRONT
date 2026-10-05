"use client";

import { useId, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/config";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  label: string;
  className?: string;
}

export const Select = ({ value, onChange, options, label, className }: SelectProps) => {
  const ref = useRef<HTMLDetailsElement>(null);
  const id = useId();
  return (
    <details
      ref={ref}
      className={cn("group relative min-w-0", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && ref.current) {
          ref.current.open = false;
          ref.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary
        aria-label={label}
        className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 [&::-webkit-details-marker]:hidden"
      >
        <span className="min-w-0 break-words">
          {options.find((option) => option.value === value)?.label}
        </span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div
        role="radiogroup"
        aria-label={label}
        className="absolute top-full right-0 left-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "relative flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-emerald-500 hover:bg-slate-50",
              value === option.value && "bg-emerald-50 text-emerald-700",
            )}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              className="sr-only"
              onChange={() => {
                onChange(option.value);
                if (ref.current) {
                  ref.current.open = false;
                  ref.current.querySelector("summary")?.focus();
                }
              }}
            />
            <span className="flex-1">{option.label}</span>
            {value === option.value && <Check className="size-4 shrink-0" />}
          </label>
        ))}
      </div>
    </details>
  );
};
