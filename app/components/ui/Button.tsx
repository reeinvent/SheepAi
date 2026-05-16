import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-700 hover:bg-cyan-800 text-white disabled:bg-cyan-400",
  secondary:
    "bg-slate-800 hover:bg-slate-900 text-white disabled:bg-slate-400",
  outline:
    "border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60",
  ghost: "text-slate-600 hover:text-slate-800 hover:bg-slate-100",
  danger: "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseClasses} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
