import type { Ticket } from "@prisma/client";
import type { TicketObject, TicketStatus } from "./types";

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

type RawOutput = { metadata: string | null };
type TicketWithOutputs = Ticket & { rawOutputs?: RawOutput[] };

function isHttpUrl(val: unknown): val is string {
  return typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"));
}

function isXUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return host === "x.com" || host === "twitter.com";
  } catch {
    return false;
  }
}

function extractSourceLinks(outputs: RawOutput[]): string[] {
  const seen = new Set<string>();
  for (const output of outputs) {
    if (!output.metadata) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(output.metadata);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object") continue;
    const m = parsed as Record<string, unknown>;
    if (isHttpUrl(m.url) && !isXUrl(m.url)) seen.add(m.url);
    if (isHttpUrl(m.permalink) && !isXUrl(m.permalink)) seen.add(m.permalink);
    if (Array.isArray(m.urls)) {
      for (const u of m.urls) {
        if (isHttpUrl(u) && !isXUrl(u)) seen.add(u);
      }
    }
  }
  return Array.from(seen);
}

export function dbTicketToTicketObject(ticket: TicketWithOutputs): TicketObject {
  let categories: string[] = [];
  try {
    const parsed = JSON.parse(ticket.categories);
    if (Array.isArray(parsed)) categories = parsed;
  } catch {
    // ignore
  }

  const sourceLinks = extractSourceLinks(ticket.rawOutputs ?? []);

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
      approvedBy: ticket.approvedBy ?? undefined,
      startedBy: ticket.startedBy ?? undefined,
      resolvedBy: ticket.resolvedBy ?? undefined,
      rejectedBy: ticket.rejectedBy ?? undefined,
      sourceLinks: sourceLinks.length ? sourceLinks : undefined,
    },
  };
}
