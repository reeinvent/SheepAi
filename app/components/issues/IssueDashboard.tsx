"use client";

import { useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { MobileMenuButton } from "../ui/MobileMenuButton";
import { useToast } from "../ui/Toast";
import { isWithinDateRange, type DateRange } from "../ui/DateRangePicker";
import { ApprovalModal } from "./ApprovalModal";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { IssueDetailModal } from "./IssueDetailModal";
import { IssueFilters } from "./IssueFilters";
import { IssueList } from "./IssueList";
import { IssueReportModal } from "./IssueReportModal";
import { IssueStats } from "./IssueStats";
import { LocationPickerModal } from "./LocationPickerModal";
import { PageHeader } from "./PageHeader";
import { TicketsMap } from "./TicketsMap";
import { STATUS_LABEL } from "./StatusBadge";
import {
  getForwardStatus,
  isValidStatusTransition,
} from "@/app/lib/issues/statusTransitions";
import {
  getMetadata,
  type IssueDraft,
  type IssueFilter,
  type IssueMetadata,
  type IssuePriority,
  type IssueStats as IssueStatsValue,
  type TicketObject,
  type TicketStatus,
} from "@/app/lib/issues/types";
import {
  createTicket,
  updateTicket,
} from "@/app/lib/actions/ticketActions";
import { dbTicketToTicketObject } from "@/app/lib/issues/mappers";

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
    label: "Na čekanje",
    variant: "secondary",
    message: "Premjesti ovaj problem natrag na čekanje?",
  },
  open: {
    label: "Odobri",
    variant: "primary",
    message: "Odobri ovaj problem?",
  },
  in_progress: {
    label: "Započni rad",
    variant: "primary",
    message: "Započeti rad na ovom problemu?",
  },
  resolved: {
    label: "Riješi",
    variant: "primary",
    message: "Označi ovaj problem kao riješen?",
  },
  rejected: {
    label: "Odbij",
    variant: "danger",
    message: "Odbij ovaj problem?",
  },
};

const STATUS_ACTOR_KEY: Partial<Record<TicketStatus, keyof IssueMetadata>> = {
  open: "approvedBy",
  in_progress: "startedBy",
  resolved: "resolvedBy",
  rejected: "rejectedBy",
};


type ViewMode = "list" | "map";

export function IssueDashboard({
  initialTickets,
  title = "Peristil",
}: IssueDashboardProps) {
  const [tickets, setTickets] = useState<TicketObject[]>(initialTickets);
  const [statusFilter, setStatusFilter] = useState<IssueFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [reportOpen, setReportOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TicketObject | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [locationTicket, setLocationTicket] = useState<TicketObject | null>(null);

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
    try {
      const dbTicket = await createTicket({
        title: draft.title,
        description: draft.body,
      });
      const newTicket = dbTicketToTicketObject(dbTicket);
      setTickets((curr) => [newTicket, ...curr]);
      setReportOpen(false);
      toast.push("Problem uspješno prijavljen");
    } catch {
      toast.push("Greška pri prijavi problema");
    }
  };

  const handleStatusChange = (
    ticket: TicketObject,
    nextStatus: TicketStatus,
  ) => {
    if (ticket.status === nextStatus) return;
    if (!isValidStatusTransition(ticket.status, nextStatus)) return;
    if (nextStatus === "in_progress") {
      setLocationTicket(ticket);
      return;
    }
    setPendingChange({ ticket, nextStatus });
  };

  const handleLocationConfirm = (coords: { lat: number; lng: number }, address: string) => {
    if (!locationTicket) return;
    const patched: TicketObject = {
      ...locationTicket,
      metadata: { ...locationTicket.metadata, lat: coords.lat, lng: coords.lng, location: address },
    };
    setLocationTicket(null);
    setPendingChange({ ticket: patched, nextStatus: "in_progress" });
  };

  const handleLocationSkip = () => {
    if (!locationTicket) return;
    const ticket = locationTicket;
    setLocationTicket(null);
    setPendingChange({ ticket, nextStatus: "in_progress" });
  };

  const applyStatusChange = async (priority?: IssuePriority) => {
    if (!pendingChange) return;
    const { ticket, nextStatus } = pendingChange;
    const actorKey = STATUS_ACTOR_KEY[nextStatus];

    const nextMetadata: Record<string, unknown> = { ...ticket.metadata };
    if (actorKey) nextMetadata[actorKey] = "John Doe";
    if (priority) nextMetadata.priority = priority;

    try {
      await updateTicket(ticket.id, {
        status: nextStatus,
        ...(priority && { priority: priority.toLowerCase() }),
        ...(nextStatus === "open" && { approvedBy: "John Doe" }),
        ...(nextStatus === "in_progress" && {
          startedBy: "John Doe",
          lat: nextMetadata.lat as number | undefined,
          lon: nextMetadata.lng as number | undefined,
          location: nextMetadata.location as string | undefined,
        }),
        ...(nextStatus === "resolved" && { resolvedBy: "John Doe" }),
        ...(nextStatus === "rejected" && { rejectedBy: "John Doe" }),
      });

      const updatedAt = new Date();
      setTickets((curr) =>
        curr.map((t) =>
          t.id === ticket.id
            ? { ...t, status: nextStatus, updatedAt, metadata: nextMetadata }
            : t,
        ),
      );
      setDetailTicket(null);
      toast.push(`Problem označen kao ${STATUS_LABEL[nextStatus].toLowerCase()}`);
    } catch {
      toast.push("Greška pri ažuriranju problema");
    }
    setPendingChange(null);
  };

  const isApprovalFlow =
    pendingChange?.ticket.status === "pending_approval" &&
    pendingChange?.nextStatus === "open";

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
            <span className="hidden sm:inline">Prijavi problem</span>
            <span className="sm:hidden">Prijavi</span>
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

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              viewMode === "list"
                ? "text-slate-900 border-b-2 border-blue-500 -mb-px"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon name="list" />
            Lista
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              viewMode === "map"
                ? "text-slate-900 border-b-2 border-blue-500 -mb-px"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon name="map" />
            Karta
          </button>
        </div>

        {/* View Content */}
        {viewMode === "list" ? (
          <IssueList
            tickets={filtered}
            onOpen={setDetailTicket}
            onStatusClick={(ticket) => {
              const next = getForwardStatus(ticket.status);
              if (next) handleStatusChange(ticket, next);
            }}
          />
        ) : (
          <div className="w-full h-96 bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
            <TicketsMap tickets={filtered} />
          </div>
        )}
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

      <LocationPickerModal
        open={locationTicket !== null}
        onDismiss={() => setLocationTicket(null)}
        onConfirm={handleLocationConfirm}
        onSkip={handleLocationSkip}
      />

      <ConfirmActionModal
        open={pendingChange !== null && !isApprovalFlow}
        action={confirmConfig.action}
        message={confirmConfig.message}
        onCancel={() => setPendingChange(null)}
        onConfirm={() => applyStatusChange()}
      />

      <ApprovalModal
        key={pendingChange?.ticket.id ?? "none"}
        open={pendingChange !== null && isApprovalFlow}
        defaultPriority={
          pendingChange ? getMetadata(pendingChange.ticket).priority : undefined
        }
        onCancel={() => setPendingChange(null)}
        onConfirm={(priority) => applyStatusChange(priority)}
      />
    </div>
  );
}
