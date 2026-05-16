"use client";

import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { getMetadata, type TicketObject } from "@/app/lib/issues/types";

interface IssueCardProps {
  ticket: TicketObject;
  onOpen: (ticket: TicketObject) => void;
  onStatusClick?: (
    ticket: TicketObject,
    e: React.MouseEvent<HTMLElement>,
  ) => void;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString();
}

export function IssueCard({ ticket, onOpen, onStatusClick }: IssueCardProps) {
  const meta = getMetadata(ticket);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-stop-card-click]")) return;
    onOpen(ticket);
  };

  return (
    <Card interactive className="p-4 fade-in" onClick={handleClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800 text-sm">
              {ticket.title}
            </h3>
            {meta.priority && <PriorityBadge priority={meta.priority} />}
            <span data-stop-card-click>
              <StatusBadge
                status={ticket.status}
                onClick={
                  onStatusClick ? (e) => onStatusClick(ticket, e) : undefined
                }
              />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
            <Icon name="map-pin" size={12} />
            <span>
              {meta.lat != null && meta.lng != null ? (
                <a
                  href={`https://www.google.com/maps?q=${meta.lat},${meta.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-stop-card-click
                  className="underline hover:text-emerald-600"
                >
                  {meta.location ??
                    `${meta.lat.toFixed(6)}, ${meta.lng.toFixed(6)}`}
                </a>
              ) : (
                (meta.location ?? "Nepoznata lokacija")
              )}
              {meta.category ? ` · ${meta.category}` : ""} · Prijavljeno{" "}
              {formatDate(ticket.createdAt)}
            </span>
          </p>
          <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">
            {ticket.body}
          </p>
        </div>
      </div>
    </Card>
  );
}
