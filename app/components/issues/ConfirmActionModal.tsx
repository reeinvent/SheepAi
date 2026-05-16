"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export interface ConfirmAction {
  label: string;
  variant: "primary" | "danger" | "secondary";
}

interface ConfirmActionModalProps {
  open: boolean;
  action: ConfirmAction | null;
  message: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmActionModal({
  open,
  action,
  message,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!action) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <p className="text-slate-800 font-medium mb-4">{message}</p>
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
          variant={action.variant}
          className="flex-1"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Ažurira se..." : action.label}
        </Button>
      </div>
    </Modal>
  );
}
