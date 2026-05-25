"use client";

interface AutoSubmitSelectOption {
  label: string;
  value: string;
}

interface AutoSubmitSelectHiddenField {
  name: string;
  value: string;
}

interface AutoSubmitSelectProps {
  action: string;
  defaultValue: string;
  hiddenFields?: AutoSubmitSelectHiddenField[];
  label: string;
  name: string;
  options: AutoSubmitSelectOption[];
}

export const AutoSubmitSelect = ({
  action,
  defaultValue,
  hiddenFields = [],
  label,
  name,
  options,
}: AutoSubmitSelectProps) => {
  return (
    <form
      action={action}
      className="border-border bg-bg-primary flex h-12 min-w-0 items-center gap-3 rounded-lg border px-4"
    >
      <span className="text-text-secondary hidden text-sm sm:inline">{label}</span>
      <select
        className="min-w-0 bg-transparent text-sm outline-none"
        defaultValue={defaultValue}
        name={name}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hiddenFields.map((field) => (
        <input key={field.name} name={field.name} type="hidden" value={field.value} />
      ))}
      <button className="sr-only" type="submit">
        Сортировать
      </button>
    </form>
  );
};
