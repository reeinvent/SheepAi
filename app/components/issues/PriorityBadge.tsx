import { Badge, type BadgeTone } from "../ui/Badge";
import type { IssuePriority } from "@/app/lib/issues/types";

const PRIORITY_TONE: Record<IssuePriority, BadgeTone> = {
  Low: "blue",
  Medium: "amber",
  High: "red",
};

const PRIORITY_LABEL: Record<IssuePriority, string> = {
  Low: "Nisko",
  Medium: "Srednje",
  High: "Visoko",
};

interface PriorityBadgeProps {
  priority: IssuePriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
