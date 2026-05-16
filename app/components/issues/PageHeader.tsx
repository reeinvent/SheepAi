import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  leading,
  action,
}: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {leading}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}
