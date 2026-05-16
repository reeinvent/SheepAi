"use client";

import { Badge, type BadgeTone } from "../ui/Badge";
import { STATUS_LABEL } from "../issues/StatusBadge";
import {
  getMetadata,
  type TicketObject,
  type TicketStatus,
} from "@/app/lib/issues/types";

const STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  pending_approval: "amber",
  open: "blue",
  in_progress: "indigo",
  resolved: "emerald",
  rejected: "red",
};

interface CommunityTicketCardProps {
  ticket: TicketObject;
  onOpen?: (ticket: TicketObject) => void;
}

export function CommunityTicketCard({
  ticket,
  onOpen,
}: CommunityTicketCardProps) {
  const meta = getMetadata(ticket);
  const interactive = Boolean(onOpen);

  const handleClick = () => {
    if (onOpen) onOpen(ticket);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!onOpen) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(ticket);
    }
  };

  return (
    <article
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      className={`bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all p-5 flex flex-col ${
        interactive
          ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          : ""
      }`}
    >
      <div className="flex items-start gap-2 flex-wrap">
        <h3 className="font-semibold text-slate-800 text-base leading-snug flex-1">
          {ticket.title}
        </h3>
        <Badge tone={STATUS_TONE[ticket.status]}>
          {STATUS_LABEL[ticket.status]}
        </Badge>
      </div>
      <p className="text-sm text-slate-600 mt-2 line-clamp-3">{ticket.body}</p>
      <div className="flex items-end justify-between gap-2 mt-auto pt-5 border-t border-slate-100">
        <div>
          {meta.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
              {meta.category}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      </div>
    </article>
  );
}
