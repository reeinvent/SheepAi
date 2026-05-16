"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "../ui/EmptyState";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { isWithinDateRange } from "../ui/DateRangePicker";
import { IssueDetailModal } from "../issues/IssueDetailModal";
import { IssueReportModal } from "../issues/IssueReportModal";
import { CommunityHero } from "./CommunityHero";
import {
  CommunityFilterBar,
  EMPTY_COMMUNITY_FILTERS,
  type CommunityFilters,
} from "./CommunityFilterBar";
import { CommunityTicketCard } from "./CommunityTicketCard";
import { createOutput } from "@/app/lib/actions/rawOutputActions";
import type { IssueDraft, TicketObject } from "@/app/lib/issues/types";

interface CommunityFeedProps {
  initialTickets: TicketObject[];
}

const USER_REPORT_SOURCE = "userInput";

export function CommunityFeed({ initialTickets }: CommunityFeedProps) {
  const [tickets] = useState<TicketObject[]>(initialTickets);
  const [filters, setFilters] = useState<CommunityFilters>(
    EMPTY_COMMUNITY_FILTERS,
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketObject | null>(null);
  const toast = useToast();

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (filters.status !== "all" && ticket.status !== filters.status) {
        return false;
      }
      if (
        !isWithinDateRange(
          new Date(ticket.createdAt).toISOString(),
          filters.dateRange,
        )
      ) {
        return false;
      }
      if (q) {
        const haystack = `${ticket.title} ${ticket.body}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, filters]);

  const handleSubmit = async (draft: IssueDraft) => {
    try {
      await createOutput({
        dataSource: USER_REPORT_SOURCE,
        summary: draft.title,
        metadata: {
          title: draft.title,
          body: draft.body,
          ...draft.metadata,
        },
      });
      setReportOpen(false);
      toast.push("Thanks! Your report was submitted for review.");
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast.push("Couldn't submit your report. Please try again.");
    }
  };

  return (
    <>
      <CommunityHero
        action={
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold h-9 px-4 py-2 bg-white text-cyan-700 shadow-md hover:bg-cyan-50 transition-colors"
          >
            <Icon name="plus" size={16} />
            Report an issue
          </button>
        }
      />
      <CommunityFilterBar filters={filters} onChange={setFilters} />
      {visible.length === 0 ? (
        <EmptyState
          title="No issues found"
          description="Try adjusting your filters"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((ticket) => (
            <CommunityTicketCard
              key={ticket.id}
              ticket={ticket}
              onOpen={setDetailTicket}
            />
          ))}
        </div>
      )}

      <IssueReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleSubmit}
      />

      <IssueDetailModal
        ticket={detailTicket}
        onClose={() => setDetailTicket(null)}
      />
    </>
  );
}
