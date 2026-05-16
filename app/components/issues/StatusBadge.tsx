import { Badge, type BadgeTone } from "../ui/Badge";
import { Icon, type IconName } from "../ui/Icon";
import type { TicketStatus } from "@/app/lib/issues/types";

const STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  pending_approval: "amber",
  open: "blue",
  in_progress: "indigo",
  resolved: "emerald",
  rejected: "red",
};

const STATUS_ICON: Record<TicketStatus, IconName> = {
  pending_approval: "clock",
  open: "circle-dot",
  in_progress: "loader",
  resolved: "check-circle",
  rejected: "x-circle",
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  pending_approval: "Pending",
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

interface StatusBadgeProps {
  status: TicketStatus;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  return (
    <Badge
      tone={STATUS_TONE[status]}
      icon={<Icon name={STATUS_ICON[status]} size={12} />}
      as={onClick ? "button" : "span"}
      onClick={onClick}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export { STATUS_LABEL };
