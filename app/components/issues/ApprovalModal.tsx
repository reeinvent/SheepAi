"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ISSUE_PRIORITIES, type IssuePriority } from "@/app/lib/issues/types";

const PRIORITY_LABEL: Record<IssuePriority, string> = {
  Low: "Nisko",
  Medium: "Srednje",
  High: "Visoko",
};

interface ApprovalModalProps {
  open: boolean;
  defaultPriority?: IssuePriority;
  onCancel: () => void;
  onConfirm: (priority: IssuePriority) => Promise<void> | void;
}

const PRIORITY_RESTING: Record<IssuePriority, string> = {
  Low: "border-green-300 bg-green-50 text-green-800 hover:bg-green-100",
  Medium: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
  High: "border-red-300 bg-red-50 text-red-800 hover:bg-red-100",
};

const PRIORITY_ACTIVE: Record<IssuePriority, string> = {
  Low: "border-green-700 bg-green-600 text-white shadow-sm",
  Medium: "border-amber-700 bg-amber-600 text-white shadow-sm",
  High: "border-red-700 bg-red-600 text-white shadow-sm",
};

export function ApprovalModal({
  open,
  defaultPriority = "Medium",
  onCancel,
  onConfirm,
}: ApprovalModalProps) {
  const [priority, setPriority] = useState<IssuePriority>(defaultPriority);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(priority);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onCancel} size="sm" title="Odobri problem">
      <p className="text-sm text-slate-600 mb-3">
        Postavite prioritet prije odobravanja.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {ISSUE_PRIORITIES.map((p) => {
          const active = priority === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              aria-pressed={active}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                active ? PRIORITY_ACTIVE[p] : PRIORITY_RESTING[p]
              }`}
            >
              {PRIORITY_LABEL[p]}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={submitting}
        >
          Odustani
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Odobrava se..." : "Odobri"}
        </Button>
      </div>
    </Modal>
  );
}
