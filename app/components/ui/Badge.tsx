import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "amber"
  | "emerald"
  | "red"
  | "blue"
  | "indigo"
  | "slate";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  as?: "span" | "button";
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  slate: "bg-slate-800 text-white",
};

export function Badge({
  tone = "neutral",
  children,
  icon,
  className = "",
  as = "span",
  onClick,
}: BadgeProps) {
  const interactive = onClick ? "cursor-pointer hover:brightness-95" : "";
  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${TONE_CLASSES[tone]} ${interactive} ${className}`}
      >
        {icon}
        {children}
      </button>
    );
  }

  return (
    <span className={`${base} ${TONE_CLASSES[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}
