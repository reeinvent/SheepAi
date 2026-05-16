"use client";

import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Field, TextArea, TextInput } from "../ui/Field";
import { Modal } from "../ui/Modal";
import type { IssueDraft } from "@/app/lib/issues/types";

interface IssueReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: IssueDraft) => Promise<void> | void;
}

interface FormState {
  title: string;
  body: string;
}

const EMPTY: FormState = {
  title: "",
  body: "",
};

export function IssueReportModal({
  open,
  onClose,
  onSubmit,
}: IssueReportModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title,
        body: form.body,
        metadata: {},
      });
      setForm(EMPTY);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Report new issue">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Title" htmlFor="inp-title">
          <TextInput
            id="inp-title"
            required
            value={form.title}
            placeholder="e.g. Pothole on the Riva"
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
          />
        </Field>

        <Field label="Description" htmlFor="inp-body">
          <TextArea
            id="inp-body"
            required
            rows={3}
            value={form.body}
            placeholder="Describe the issue..."
            onChange={(e) =>
              setForm((f) => ({ ...f, body: e.target.value }))
            }
          />
        </Field>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
