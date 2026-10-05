/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { X, Target } from "lucide-react";
import type { ObjectiveStatus, TObjective } from "@plane/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TObjective>) => Promise<void>;
};

export const ObjectiveModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<ObjectiveStatus>("on_track");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        target_date: targetDate || null,
        status,
      });
      setTitle("");
      setDescription("");
      setStartDate("");
      setTargetDate("");
      setStatus("on_track");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="border-custom-border-200 bg-custom-background-100 shadow-2xl animate-scale-up w-full max-w-lg overflow-hidden rounded-2xl border">
        <div className="border-custom-border-100 flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-2.5">
            <div className="bg-custom-primary-100/10 text-custom-primary-100 rounded-lg p-2">
              <Target size={18} />
            </div>
            <h2 className="text-base text-custom-text-100 font-semibold">Create Strategic Objective</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80 rounded-lg p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label htmlFor="objectiveTitle" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
              Objective Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="objectiveTitle"
              type="text"
              required
              placeholder="e.g., Accelerate Enterprise Market Adoption in Q4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 w-full rounded-lg border px-3.5 py-2 transition-colors focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="objectiveDescription" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
              Description
            </label>
            <textarea
              id="objectiveDescription"
              rows={3}
              placeholder="Brief context and strategic rationale for this objective..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 w-full resize-none rounded-lg border px-3.5 py-2 transition-colors focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="objectiveStartDate" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
                Start Date
              </label>
              <input
                id="objectiveStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:border-custom-primary-100 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="objectiveTargetDate" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
                Target Date
              </label>
              <input
                id="objectiveTargetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:border-custom-primary-100 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="objectiveStatus" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
              Initial Health Status
            </label>
            <select
              id="objectiveStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as ObjectiveStatus)}
              className="border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:border-custom-primary-100 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none"
            >
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="behind">Behind</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="border-custom-border-100 flex items-center justify-end gap-3 border-t pt-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 rounded-lg px-4 py-2 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="text-xs bg-custom-primary-100 rounded-lg px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Objective"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
