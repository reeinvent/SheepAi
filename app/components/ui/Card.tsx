import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({
  interactive = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const interactiveClasses = interactive
    ? "hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
    : "";

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 ${interactiveClasses} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
