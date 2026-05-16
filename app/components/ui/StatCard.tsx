export type StatTone = "neutral" | "amber" | "emerald" | "red" | "blue" | "indigo";

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

const ACTIVE_RING: Record<StatTone, string> = {
  neutral: "ring-slate-800",
  amber: "ring-amber-500",
  emerald: "ring-emerald-500",
  red: "ring-red-500",
  blue: "ring-blue-500",
  indigo: "ring-indigo-500",
};

const baseClasses =
  "bg-white rounded-xl p-3 sm:p-4 border border-slate-200 text-left transition-all min-w-0";

export function StatCard({
  label,
  value,
  tone = "neutral",
  active = false,
  onClick,
}: StatCardProps) {
  const activeClasses = active ? `ring-2 ${ACTIVE_RING[tone]}` : "";
  const inner = (
    <>
      <p
        className={`text-[10px] sm:text-xs font-medium uppercase tracking-wide truncate ${LABEL_TONE[tone]}`}
      >
        {label}
      </p>
      <p
        className={`text-xl sm:text-2xl font-bold mt-1 ${VALUE_TONE[tone]}`}
      >
        {value}
      </p>
    </>
  );

  if (onClick) {
    const interactive =
      "hover:border-slate-300 hover:shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-800";
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`${baseClasses} ${interactive} ${activeClasses}`}
      >
        {inner}
      </button>
    );
  }

  return <div className={`${baseClasses} ${activeClasses}`}>{inner}</div>;
}
