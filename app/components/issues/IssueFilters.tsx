"use client";

import {
  DateRangePicker,
  type DateRange,
} from "../ui/DateRangePicker";

interface IssueFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function IssueFilters({
  dateRange,
  onDateRangeChange,
}: IssueFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
