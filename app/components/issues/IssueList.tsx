"use client";

import { EmptyState } from "../ui/EmptyState";
import { IssueCard } from "./IssueCard";
import type { TicketObject } from "@/app/lib/issues/types";

interface IssueListProps {
  tickets: TicketObject[];
  onOpen: (ticket: TicketObject) => void;
  onStatusClick?: (
    ticket: TicketObject,
    e: React.MouseEvent<HTMLElement>,
  ) => void;
}

export function IssueList({ tickets, onOpen, onStatusClick }: IssueListProps) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No issues found"
        description="Try adjusting your filters"
      />
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <IssueCard
          key={ticket.id}
          ticket={ticket}
          onOpen={onOpen}
          onStatusClick={onStatusClick}
        />
      ))}
    </div>
  );
}
