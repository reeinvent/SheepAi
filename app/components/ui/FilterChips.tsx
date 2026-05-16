"use client";

export interface FilterChipsOption<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: FilterChipsOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              active
                ? "px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-white"
                : "px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
