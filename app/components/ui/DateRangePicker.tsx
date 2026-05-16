"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";

export interface DateRange {
  from: string | null;
  to: string | null;
}

export function isWithinDateRange(isoDate: string, range: DateRange): boolean {
  const d = new Date(isoDate).getTime();
  if (range.from) {
    const from = new Date(range.from).getTime();
    if (d < from) return false;
  }
  if (range.to) {
    const to = new Date(range.to);
    to.setHours(23, 59, 59, 999);
    if (d > to.getTime()) return false;
  }
  return true;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfMonth(value.from ? new Date(value.from) : new Date()),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  const summary = useMemo(() => {
    if (!value.from && !value.to) return "All dates";
    if (value.from && value.to)
      return `${formatShort(value.from)} – ${formatShort(value.to)}`;
    if (value.from) return `From ${formatShort(value.from)}`;
    return `Until ${formatShort(value.to ?? "")}`;
  }, [value]);

  const hasRange = Boolean(value.from || value.to);

  const handleDayClick = (iso: string) => {
    if (!value.from || (value.from && value.to)) {
      onChange({ from: iso, to: null });
      return;
    }
    if (iso < value.from) {
      onChange({ from: iso, to: value.from });
    } else if (iso === value.from) {
      onChange({ from: iso, to: iso });
    } else {
      onChange({ from: value.from, to: iso });
    }
  };

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
          hasRange
            ? "border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        <Icon name="calendar" size={16} />
        <span className="font-medium">{summary}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick a date range"
          className="absolute top-full left-0 mt-2 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-3 fade-in w-[280px]"
        >
          <CalendarHeader value={viewMonth} onChange={setViewMonth} />
          <CalendarGrid
            viewMonth={viewMonth}
            range={value}
            onDayClick={handleDayClick}
          />
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => onChange({ from: null, to: null })}
              className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
              disabled={!hasRange}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarHeader({
  value,
  onChange,
}: {
  value: Date;
  onChange: (next: Date) => void;
}) {
  const label = value.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between mb-2">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() =>
          onChange(new Date(value.getFullYear(), value.getMonth() - 1, 1))
        }
        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
      >
        ‹
      </button>
      <span className="font-semibold text-slate-800 text-sm">{label}</span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() =>
          onChange(new Date(value.getFullYear(), value.getMonth() + 1, 1))
        }
        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
      >
        ›
      </button>
    </div>
  );
}

function CalendarGrid({
  viewMonth,
  range,
  onDayClick,
}: {
  viewMonth: Date;
  range: DateRange;
  onDayClick: (iso: string) => void;
}) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const offset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromDate = range.from ? new Date(range.from) : null;
  const toDate = range.to ? new Date(range.to) : null;

  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map((d) => (
        <div
          key={d}
          className="text-center text-[10px] font-medium text-slate-500 py-1"
        >
          {d}
        </div>
      ))}
      {cells.map((date, i) => {
        if (!date) return <div key={`empty-${i}`} className="h-8" />;

        const iso = toIsoDate(date);
        const isFrom = fromDate ? sameDay(date, fromDate) : false;
        const isTo = toDate ? sameDay(date, toDate) : false;
        const inRange =
          fromDate &&
          toDate &&
          date.getTime() > fromDate.getTime() &&
          date.getTime() < toDate.getTime();
        const isToday = sameDay(date, today);

        let cls =
          "h-8 w-full inline-flex items-center justify-center text-sm rounded-md transition-colors ";
        if (isFrom || isTo) {
          cls += "bg-emerald-600 text-white font-semibold hover:bg-emerald-700";
        } else if (inRange) {
          cls += "bg-emerald-50 text-emerald-700";
        } else if (isToday) {
          cls += "text-slate-800 ring-1 ring-slate-300 hover:bg-slate-100";
        } else {
          cls += "text-slate-700 hover:bg-slate-100";
        }

        return (
          <button
            key={iso}
            type="button"
            onClick={() => onDayClick(iso)}
            className={cls}
          >
            {date.getDate()}
          </button>
        );
      })}
    </div>
  );
}
