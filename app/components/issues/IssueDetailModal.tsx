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
  type TicketObject,
  type TicketStatus,
} from "@/app/lib/issues/types";

interface IssueDetailModalProps {
  ticket: TicketObject | null;
  onClose: () => void;
  onChangeStatus: (ticket: TicketObject, status: TicketStatus) => void;
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

  const footer = isTerminalStatus(ticket.status) ? (
    <Button variant="outline" className="flex-1" onClick={onClose}>
      Close
    </Button>
  ) : (
    <>
      {forwardStatus && forwardAction && (
        <Button
          variant="primary"
          className="flex-1"
          leftIcon={<Icon name={forwardAction.icon} size={16} />}
          onClick={() => onChangeStatus(ticket, forwardStatus)}
        >
          {forwardAction.label}
        </Button>
      )}
      {canReject(ticket.status) && (
        <Button
          variant="danger"
          className="flex-1"
          leftIcon={<Icon name="x" size={16} />}
          onClick={() => onChangeStatus(ticket, "rejected")}
        >
          Reject
        </Button>
      )}
    </>
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
            {meta.location}
          </span>
        ) : undefined
      }
      size="lg"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DetailStat label="Status" value={STATUS_LABEL[ticket.status]} />
          <DetailStat label="Priority" value={meta.priority ?? "—"} />
          <DetailStat label="Category" value={meta.category ?? "—"} />
          <DetailStat label="Reported" value={formatDate(ticket.createdAt)} />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Description
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {ticket.body}
          </p>
        </div>
      </div>
    </Modal>
  );
}

function DetailStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-1">{value}</p>
    </div>
  );
}
