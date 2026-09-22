"use client";

import { useRouter, useSearchParams } from "next/navigation";

export interface AutoSubmitSelectOption {
  label: string;
  value: string;
}

export interface AutoSubmitSelectHiddenField {
  name: string;
  value: string;
}

export interface AutoSubmitSelectProps {
  action: string;
  defaultValue: string;
  hiddenFields?: AutoSubmitSelectHiddenField[];
  label: string;
  name: string;
  options: ReadonlyArray<AutoSubmitSelectOption>;
}

export const AutoSubmitSelect = ({
  action,
  defaultValue,
  hiddenFields = [],
  label,
  name,
  options,
}: AutoSubmitSelectProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");

    // Apply hidden fields preserved from current filter state
    hiddenFields.forEach((field) => {
      if (field.value !== undefined && field.value !== "") {
        params.set(field.name, field.value);
      }
    });

    if (newValue) {
      params.set(name, newValue);
    } else {
      params.delete(name);
    }

    // Reset pagination to page 1 on sort or limit change
    params.delete("page");

    const query = params.toString();
    const newUrl = query ? `${action}?${query}` : action;

    // Soft client SPA navigation without page reload and without scrolling up
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="border-border bg-bg-primary flex h-12 min-w-0 items-center gap-3 rounded-lg border px-4 shadow-2xs">
      <span className="text-text-secondary hidden text-sm sm:inline">{label}</span>
      <select
        className="min-w-0 bg-transparent text-sm outline-none cursor-pointer"
        defaultValue={defaultValue}
        name={name}
        onChange={handleChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
