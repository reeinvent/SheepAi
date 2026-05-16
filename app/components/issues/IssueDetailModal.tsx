"use client";

import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { STATUS_LABEL } from "./StatusBadge";
import {
  canReject,
  FORWARD_ACTION,
  getForwardStatus,
  isTerminalStatus,
} from "@/app/lib/issues/statusTransitions";
import {
  getMetadata,
  type IssuePriority,
  type TicketObject,
  type TicketStatus,
  PRIORITY_LABEL,
  CATEGORY_LABEL,
} from "@/app/lib/issues/types";

const STATUS_BG: Record<TicketStatus, string> = {
  pending_approval: "bg-amber-100",
  open: "bg-blue-100",
  in_progress: "bg-indigo-100",
  resolved: "bg-emerald-100",
  rejected: "bg-red-100",
};

const PRIORITY_BG: Record<IssuePriority, string> = {
  Low: "bg-green-100",
  Medium: "bg-amber-100",
  High: "bg-red-100",
};

const ACTOR_BG: Record<string, string> = {
  "Odobrio": "bg-slate-100",
  "Pokrenuo": "bg-slate-100",
  "Riješio": "bg-slate-100",
  "Odbio": "bg-slate-100",
};

interface IssueDetailModalProps {
  ticket: TicketObject | null;
  onClose: () => void;
  onChangeStatus?: (ticket: TicketObject, status: TicketStatus) => void;
}

function formatDate(d?: Date | string | null): string {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export function IssueDetailModal({
  ticket,
  onClose,
  onChangeStatus,
}: IssueDetailModalProps) {
  if (!ticket) return null;
  const meta = getMetadata(ticket);

  const forwardStatus = getForwardStatus(ticket.status);
  const forwardAction = FORWARD_ACTION[ticket.status];

  const canTransition = Boolean(onChangeStatus) && !isTerminalStatus(ticket.status);

  const footer = canTransition ? (
    <>
      {forwardStatus && forwardAction && (
        <Button
          variant="primary"
          className="flex-1"
          leftIcon={<Icon name={forwardAction.icon} size={16} />}
          onClick={() => onChangeStatus?.(ticket, forwardStatus)}
        >
          {forwardAction.label}
        </Button>
      )}
      {canReject(ticket.status) && (
        <Button
          variant="danger"
          className="flex-1"
          leftIcon={<Icon name="x" size={16} />}
          onClick={() => onChangeStatus?.(ticket, "rejected")}
        >
          Odbij
        </Button>
      )}
    </>
  ) : (
    <Button variant="outline" className="flex-1" onClick={onClose}>
      Zatvori
    </Button>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={ticket.title}
      subtitle={
        meta.location ? (
          <span className="inline-flex items-center gap-1">
            <Icon name="map-pin" size={12} />
            {meta.lat != null && meta.lng != null ? (
              <a
                href={`https://www.google.com/maps?q=${meta.lat},${meta.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-emerald-600"
              >
                {meta.location}
              </a>
            ) : (
              meta.location
            )}
          </span>
        ) : undefined
      }
      size="lg"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DetailStat label="Status" value={STATUS_LABEL[ticket.status]} bg={STATUS_BG[ticket.status]} />
          <DetailStat label="Prioritet" value={meta.priority ? PRIORITY_LABEL[meta.priority] : "—"} bg={meta.priority ? PRIORITY_BG[meta.priority] : undefined} />
          <DetailStat label="Kategorija" value={meta.category ? (CATEGORY_LABEL[meta.category] ?? meta.category) : "—"} />
          <DetailStat label="Prijavljeno" value={formatDate(ticket.createdAt)} />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Opis
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {ticket.body}
          </p>
        </div>

        {(meta.approvedBy || meta.startedBy || meta.resolvedBy || meta.rejectedBy) && (
          <div className="border-t border-slate-200 pt-4 space-y-1">
            {meta.approvedBy && <ActorRow label="Odobrio" name={meta.approvedBy} bg={ACTOR_BG["Odobrio"]} />}
            {meta.startedBy && <ActorRow label="Pokrenuo" name={meta.startedBy} bg={ACTOR_BG["Pokrenuo"]} />}
            {meta.resolvedBy && <ActorRow label="Riješio" name={meta.resolvedBy} bg={ACTOR_BG["Riješio"]} />}
            {meta.rejectedBy && <ActorRow label="Odbio" name={meta.rejectedBy} bg={ACTOR_BG["Odbio"]} />}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ActorRow({ label, name, bg }: { label: string; name: string; bg?: string }) {
  return (
    <div className={`flex items-center justify-between text-sm rounded-md px-3 py-1.5 ${bg ?? "bg-slate-100"}`}>
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-slate-700">{name}</span>
    </div>
  );
}

function DetailStat({
  label,
  value,
  bg,
}: {
  label: string;
  value: React.ReactNode;
  bg?: string;
}) {
  return (
    <div className={`rounded-lg p-3 ${bg ?? "bg-slate-50"}`}>
      <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-1">{value}</p>
    </div>
  );
}
