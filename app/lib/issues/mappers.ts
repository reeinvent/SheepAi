import type { Ticket } from "@prisma/client";
import type { TicketObject, TicketStatus } from "./types";

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function dbTicketToTicketObject(ticket: Ticket): TicketObject {
  let categories: string[] = [];
  try {
    const parsed = JSON.parse(ticket.categories);
    if (Array.isArray(parsed)) categories = parsed;
  } catch {
    // ignore
  }

  return {
    id: ticket.id,
    title: ticket.title,
    body: ticket.description ?? "",
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    status: ticket.status as TicketStatus,
    metadata: {
      priority: capitalizeFirst(ticket.priority) as "Low" | "Medium" | "High",
      category: categories[0],
      lat: ticket.lat ?? undefined,
      lng: ticket.lon ?? undefined,
      location: ticket.location ?? undefined,
    },
  };
}
