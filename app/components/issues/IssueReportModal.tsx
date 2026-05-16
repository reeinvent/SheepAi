"use client";

import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Field, SelectInput, TextArea, TextInput } from "../ui/Field";
import { Modal } from "../ui/Modal";
import {
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
  type IssueCategory,
  type IssueDraft,
  type IssuePriority,
} from "@/app/lib/issues/types";

interface IssueReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: IssueDraft) => Promise<void> | void;
}

interface FormState {
  title: string;
  body: string;
  category: IssueCategory;
  priority: IssuePriority;
  location: string;
}

const EMPTY: FormState = {
  title: "",
  body: "",
  category: "Roads",
  priority: "Medium",
  location: "",
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
        metadata: {
          category: form.category,
          priority: form.priority,
          location: form.location,
        },
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
    <Modal open={open} onClose={handleClose} title="Report New Issue">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Title" htmlFor="inp-title">
          <TextInput
            id="inp-title"
            required
            value={form.title}
            placeholder="e.g. Pothole on Main St"
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="inp-category">
            <SelectInput
              id="inp-category"
              required
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value as IssueCategory,
                }))
              }
            >
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Priority" htmlFor="inp-priority">
            <SelectInput
              id="inp-priority"
              required
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  priority: e.target.value as IssuePriority,
                }))
              }
            >
              {ISSUE_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field label="Location" htmlFor="inp-location">
          <TextInput
            id="inp-location"
            required
            value={form.location}
            placeholder="e.g. 123 Main Street"
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
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
