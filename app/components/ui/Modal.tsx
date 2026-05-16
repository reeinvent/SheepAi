"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

export type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`bg-white rounded-2xl w-full ${SIZE_CLASSES[size]} p-6 fade-in max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              {title && (
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        )}
        <div className={footer ? "mb-6" : ""}>{children}</div>
        {footer && (
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
