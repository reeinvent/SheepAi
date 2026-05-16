export type TicketStatus =
  | "pending_approval"
  | "open"
  | "in_progress"
  | "resolved"
  | "rejected";

export class Ticket {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly body: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly status: TicketStatus,
    public readonly metadata: Record<string, unknown>,
  ) {}
}

export type TicketObject = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  status: TicketStatus;
  metadata: Record<string, unknown>;
};
