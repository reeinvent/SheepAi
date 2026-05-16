import type { TicketStatus } from "@/src/entities/ticket";
import type { IconName } from "@/app/components/ui/Icon";

export const FORWARD_TRANSITION: Partial<Record<TicketStatus, TicketStatus>> = {
  pending_approval: "open",
  open: "in_progress",
  in_progress: "resolved",
};

export function getForwardStatus(status: TicketStatus): TicketStatus | null {
  return FORWARD_TRANSITION[status] ?? null;
}

export function canReject(status: TicketStatus): boolean {
  return (
    status === "pending_approval" ||
    status === "open" ||
    status === "in_progress"
  );
}

export function isTerminalStatus(status: TicketStatus): boolean {
  return status === "resolved" || status === "rejected";
}

export function isValidStatusTransition(
  from: TicketStatus,
  to: TicketStatus,
): boolean {
  if (to === "rejected") return canReject(from);
  return getForwardStatus(from) === to;
}

export const FORWARD_ACTION: Record<
  TicketStatus,
  { label: string; icon: IconName } | null
> = {
  pending_approval: { label: "Odobri", icon: "check" },
  open: { label: "Započni rad", icon: "loader" },
  in_progress: { label: "Označi kao riješeno", icon: "check-circle" },
  resolved: null,
  rejected: null,
};
