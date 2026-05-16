"use client";

import { useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { MobileMenuButton } from "../ui/MobileMenuButton";
import { useToast } from "../ui/Toast";
import { isWithinDateRange, type DateRange } from "../ui/DateRangePicker";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { IssueDetailModal } from "./IssueDetailModal";
import { IssueFilters } from "./IssueFilters";
import { IssueList } from "./IssueList";
import { IssueReportModal } from "./IssueReportModal";
import { IssueStats } from "./IssueStats";
import { PageHeader } from "./PageHeader";
import { STATUS_LABEL } from "./StatusBadge";
import {
  getForwardStatus,
  isValidStatusTransition,
} from "@/app/lib/issues/statusTransitions";
import type {
  IssueDraft,
  IssueFilter,
  IssueStats as IssueStatsValue,
  TicketObject,
  TicketStatus,
} from "@/app/lib/issues/types";

interface IssueDashboardProps {
  initialTickets: TicketObject[];
  title?: string;
  subtitle?: string;
}

type PendingChange = {
  ticket: TicketObject;
  nextStatus: TicketStatus;
};

type ConfirmVariant = "primary" | "danger" | "secondary";

const STATUS_ACTION: Record<
  TicketStatus,
  { label: string; variant: ConfirmVariant; message: string }
> = {
  pending_approval: {
    label: "Move to pending",
    variant: "secondary",
    message: "Move this issue back to pending?",
  },
  open: {
    label: "Approve",
    variant: "primary",
    message: "Approve this issue?",
  },
  in_progress: {
    label: "Start work",
    variant: "primary",
    message: "Mark this issue as in progress?",
  },
  resolved: {
    label: "Resolve",
    variant: "primary",
    message: "Mark this issue as resolved?",
  },
  rejected: {
    label: "Reject",
    variant: "danger",
    message: "Reject this issue?",
  },
};

function nextId(tickets: TicketObject[]): string {
  const max = tickets.reduce((acc, t) => {
    const n = Number.parseInt(t.id, 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return String(max + 1);
}

export function IssueDashboard({
  initialTickets,
  title = "Beeeeee",
}: IssueDashboardProps) {
  const [tickets, setTickets] = useState<TicketObject[]>(initialTickets);
  const [statusFilter, setStatusFilter] = useState<IssueFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });

  const [reportOpen, setReportOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketObject | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(
    null,
  );

  const toast = useToast();

  const dateFiltered = useMemo(
    () =>
      tickets.filter((t) =>
        isWithinDateRange(new Date(t.createdAt).toISOString(), dateRange),
      ),
    [tickets, dateRange],
  );

  const stats: IssueStatsValue = useMemo(
    () => ({
      total: dateFiltered.length,
      pending_approval: dateFiltered.filter(
        (t) => t.status === "pending_approval",
      ).length,
      open: dateFiltered.filter((t) => t.status === "open").length,
      in_progress: dateFiltered.filter((t) => t.status === "in_progress")
        .length,
      resolved: dateFiltered.filter((t) => t.status === "resolved").length,
      rejected: dateFiltered.filter((t) => t.status === "rejected").length,
    }),
    [dateFiltered],
  );

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? dateFiltered
        : dateFiltered.filter((t) => t.status === statusFilter),
    [dateFiltered, statusFilter],
  );

  const handleCreate = async (draft: IssueDraft) => {
    const now = new Date();
    const newTicket: TicketObject = {
      id: nextId(tickets),
      title: draft.title,
      body: draft.body,
      createdAt: now,
      updatedAt: now,
      status: "pending_approval",
      metadata: { ...draft.metadata },
    };
    setTickets((curr) => [newTicket, ...curr]);
    setReportOpen(false);
    toast.push("Issue reported successfully");
  };

  const handleStatusChange = (
    ticket: TicketObject,
    nextStatus: TicketStatus,
  ) => {
    if (ticket.status === nextStatus) return;
    if (!isValidStatusTransition(ticket.status, nextStatus)) return;
    setPendingChange({ ticket, nextStatus });
  };

  const confirmStatusChange = async () => {
    if (!pendingChange) return;
    const { ticket, nextStatus } = pendingChange;
    const updatedAt = new Date();

    setTickets((curr) =>
      curr.map((t) =>
        t.id === ticket.id ? { ...t, status: nextStatus, updatedAt } : t,
      ),
    );

    setDetailTicket(null);

    toast.push(`Issue marked as ${STATUS_LABEL[nextStatus].toLowerCase()}`);
    setPendingChange(null);
  };

  const confirmConfig = useMemo(() => {
    if (!pendingChange) {
      return {
        action: null as null | { label: string; variant: ConfirmVariant },
        message: "",
      };
    }
    const cfg = STATUS_ACTION[pendingChange.nextStatus];
    return {
      action: { label: cfg.label, variant: cfg.variant },
      message: cfg.message,
    };
  }, [pendingChange]);

  return (
    <div>
      <PageHeader
        title={title}
        leading={<MobileMenuButton />}
        action={
          <Button
            variant="primary"
            leftIcon={<Icon name="plus" />}
            onClick={() => setReportOpen(true)}
          >
            <span className="hidden sm:inline">Report Issue</span>
            <span className="sm:hidden">Report</span>
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <IssueFilters dateRange={dateRange} onDateRangeChange={setDateRange} />

        <IssueStats
          stats={stats}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        <IssueList
          tickets={filtered}
          onOpen={setDetailTicket}
          onStatusClick={(ticket) => {
            const next = getForwardStatus(ticket.status);
            if (next) handleStatusChange(ticket, next);
          }}
        />
      </div>

      <IssueReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleCreate}
      />

      <IssueDetailModal
        ticket={detailTicket}
        onClose={() => setDetailTicket(null)}
        onChangeStatus={handleStatusChange}
      />

      <ConfirmActionModal
        open={pendingChange !== null}
        action={confirmConfig.action}
        message={confirmConfig.message}
        onCancel={() => setPendingChange(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
