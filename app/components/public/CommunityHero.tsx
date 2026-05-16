import type { ReactNode } from "react";

interface CommunityHeroProps {
  title?: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
}

export function CommunityHero({
  title = "Issues that matter to your city",
  description = "Browse community-reported issues and show your support.",
  badge = "Community board",
  action,
}: CommunityHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-700 via-teal-600 to-cyan-500 px-6 sm:px-10 py-8 sm:py-10 mb-8 shadow-xl shadow-cyan-700/20">
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-orange-300/25 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-cyan-200/30 blur-3xl"
      />
      <div className="relative flex items-end justify-between gap-4 flex-wrap">
        <div className="text-white max-w-xl">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm mb-3">
            {badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-cyan-50/90 mt-2">
            {description}
          </p>
        </div>
        {action}
      </div>
    </div>
  );
}
