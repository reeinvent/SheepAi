import type { TicketObject, TicketStatus } from "@/src/entities/ticket";

export type { TicketObject, TicketStatus };

export type IssuePriority = "Low" | "Medium" | "High";

export type IssueCategory =
  | "Roads"
  | "Lighting"
  | "Parks"
  | "Water"
  | "Waste"
  | "Other";

export interface IssueMetadata {
  category?: IssueCategory;
  priority?: IssuePriority;
  location?: string;
  approvedBy?: string;
  startedBy?: string;
  resolvedBy?: string;
  rejectedBy?: string;
}

export function getMetadata(ticket: TicketObject): IssueMetadata {
  return (ticket.metadata ?? {}) as IssueMetadata;
}

export const ISSUE_CATEGORIES: IssueCategory[] = [
  "Roads",
  "Lighting",
  "Parks",
  "Water",
  "Waste",
  "Other",
];

export const ISSUE_PRIORITIES: IssuePriority[] = ["Low", "Medium", "High"];

export const TICKET_STATUSES: TicketStatus[] = [
  "pending_approval",
  "open",
  "in_progress",
  "resolved",
  "rejected",
];

export type IssueFilter = "all" | TicketStatus;

export interface IssueDraft {
  title: string;
  body: string;
  metadata: IssueMetadata;
}

export interface IssueStats {
  total: number;
  pending_approval: number;
  open: number;
  in_progress: number;
  resolved: number;
  rejected: number;
}
