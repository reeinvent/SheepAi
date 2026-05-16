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

export function IssueReportModal({ open, onClose, onSubmit }: IssueReportModalProps) {
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
    <Modal
      open={open}
      onClose={handleClose}
      title="Prijavi novi problem"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <Field
          label="Naslov"
          htmlFor="inp-title"
        >
          <TextInput
            id="inp-title"
            required
            value={form.title}
            placeholder="e.g. Oštećen kolnik u Dubrovačkoj ulici"
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </Field>

        <Field
          label="Opis"
          htmlFor="inp-body"
        >
          <TextArea
            id="inp-body"
            required
            rows={3}
            value={form.body}
            placeholder="Opišite problem..."
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
        </Field>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            type="button"
          >
            Odustani
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Šalje se..." : "Pošalji"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
