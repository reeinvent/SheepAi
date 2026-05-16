"use client";

import { StatCard, type StatTone } from "../ui/StatCard";
import type {
  IssueFilter,
  IssueStats as IssueStatsValue,
  TicketStatus,
} from "@/app/lib/issues/types";

interface IssueStatsProps {
  stats: IssueStatsValue;
  activeFilter: IssueFilter;
  onFilterChange: (filter: IssueFilter) => void;
}

const STAT_CONFIG: Array<{
  status: TicketStatus;
  label: string;
  tone: StatTone;
}> = [
  { status: "pending_approval", label: "Pending", tone: "amber" },
  { status: "open", label: "Open", tone: "blue" },
  { status: "in_progress", label: "Active", tone: "indigo" },
  { status: "resolved", label: "Resolved", tone: "emerald" },
  { status: "rejected", label: "Rejected", tone: "red" },
];

export function IssueStats({
  stats,
  activeFilter,
  onFilterChange,
}: IssueStatsProps) {
  return (
    <div className="mb-6 -mx-4 sm:mx-0 overflow-x-auto">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-4 min-w-[500px] sm:min-w-0 px-4 sm:px-0">
        {STAT_CONFIG.map(({ status, label, tone }) => (
          <StatCard
            key={status}
            label={label}
            value={stats[status]}
            tone={tone}
            active={activeFilter === status}
            onClick={() =>
              onFilterChange(activeFilter === status ? "all" : status)
            }
          />
        ))}
      </div>
    </div>
  );
}
