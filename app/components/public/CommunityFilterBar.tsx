"use client";

import { DateRangePicker, type DateRange } from "../ui/DateRangePicker";
import { Icon } from "../ui/Icon";
import type { IssueFilter } from "@/app/lib/issues/types";

export interface CommunityFilters {
  search: string;
  status: IssueFilter;
  dateRange: DateRange;
}

export const EMPTY_COMMUNITY_FILTERS: CommunityFilters = {
  search: "",
  status: "all",
  dateRange: { from: null, to: null },
};

const STATUS_OPTIONS: Array<{ value: IssueFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending_approval", label: "Pending" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

interface CommunityFilterBarProps {
  filters: CommunityFilters;
  onChange: (next: CommunityFilters) => void;
}

const controlClass =
  "px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-white";

export function CommunityFilterBar({
  filters,
  onChange,
}: CommunityFilterBarProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 items-center">
      <div className="flex-1 min-w-[200px] relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Icon name="search" size={16} />
        </div>
        <input
          type="search"
          aria-label="Search issues"
          placeholder="Search issues..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className={`${controlClass} w-full pl-9`}
        />
      </div>

      <select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(e) =>
          onChange({ ...filters, status: e.target.value as IssueFilter })
        }
        className={controlClass}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <DateRangePicker
        value={filters.dateRange}
        onChange={(dr) => onChange({ ...filters, dateRange: dr })}
      />
    </div>
  );
}
