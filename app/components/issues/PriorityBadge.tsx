import { Badge, type BadgeTone } from "../ui/Badge";
import type { IssuePriority } from "@/app/lib/issues/types";

const PRIORITY_TONE: Record<IssuePriority, BadgeTone> = {
  Low: "blue",
  Medium: "amber",
  High: "red",
};

interface PriorityBadgeProps {
  priority: IssuePriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <Badge tone={PRIORITY_TONE[priority]}>{priority}</Badge>;
}
