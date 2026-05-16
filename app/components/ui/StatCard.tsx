export type StatTone =
  | "neutral"
  | "amber"
  | "emerald"
  | "red"
  | "blue"
  | "indigo";

interface StatCardProps {
  label: string;
  value: number | string;
  tone?: StatTone;
  active?: boolean;
  onClick?: () => void;
}

const LABEL_TONE: Record<StatTone, string> = {
  neutral: "text-slate-500",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
  red: "text-red-500",
  blue: "text-blue-600",
  indigo: "text-indigo-600",
};

const VALUE_TONE: Record<StatTone, string> = {
  neutral: "text-slate-800",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
  red: "text-red-500",
  blue: "text-blue-600",
  indigo: "text-indigo-600",
};

const ACTIVE_BORDER: Record<StatTone, string> = {
  neutral: "border-slate-300/75",
  amber: "border-amber-200/75",
  emerald: "border-emerald-200/75",
  red: "border-red-200/75",
  blue: "border-blue-200/75",
  indigo: "border-indigo-200/75",
};

const ACTIVE_BG: Record<StatTone, string> = {
  neutral: "bg-slate-50",
  amber: "bg-amber-50",
  emerald: "bg-emerald-50",
  red: "bg-red-50",
  blue: "bg-blue-50",
  indigo: "bg-indigo-50",
};

const baseClasses =
  "rounded-xl p-3 sm:p-4 border-2 text-left transition-all min-w-0";

export function StatCard({
  label,
  value,
  tone = "neutral",
  active = false,
  onClick,
}: StatCardProps) {
  const borderClass = active ? ACTIVE_BORDER[tone] : "border-slate-200";
  const bgClass = active ? ACTIVE_BG[tone] : "bg-white";
  const inner = (
    <>
      <p
        className={`text-[10px] sm:text-xs font-medium uppercase tracking-wide truncate ${LABEL_TONE[tone]}`}
      >
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${VALUE_TONE[tone]}`}>
        {value}
      </p>
    </>
  );

  if (onClick) {
    const interactive =
      "hover:border-slate-300 hover:shadow-sm cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-slate-800";
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`${baseClasses} ${bgClass} ${borderClass} ${interactive}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${bgClass} ${borderClass}`}>{inner}</div>
  );
}
