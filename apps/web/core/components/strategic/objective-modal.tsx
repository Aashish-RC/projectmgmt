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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-custom-border-200 bg-custom-background-100 shadow-2xl overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between p-5 border-b border-custom-border-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-custom-primary-100/10 text-custom-primary-100">
              <Target size={18} />
            </div>
            <h2 className="text-base font-semibold text-custom-text-100">Create Strategic Objective</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="objectiveTitle" className="block text-xs font-medium text-custom-text-200 mb-1.5">
              Objective Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="objectiveTitle"
              type="text"
              required
              placeholder="e.g., Accelerate Enterprise Market Adoption in Q4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:border-custom-primary-100 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="objectiveDescription" className="block text-xs font-medium text-custom-text-200 mb-1.5">
              Description
            </label>
            <textarea
              id="objectiveDescription"
              rows={3}
              placeholder="Brief context and strategic rationale for this objective..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:border-custom-primary-100 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="objectiveStartDate" className="block text-xs font-medium text-custom-text-200 mb-1.5">
                Start Date
              </label>
              <input
                id="objectiveStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:outline-none focus:border-custom-primary-100 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="objectiveTargetDate" className="block text-xs font-medium text-custom-text-200 mb-1.5">
                Target Date
              </label>
              <input
                id="objectiveTargetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:outline-none focus:border-custom-primary-100 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="objectiveStatus" className="block text-xs font-medium text-custom-text-200 mb-1.5">
              Initial Health Status
            </label>
            <select
              id="objectiveStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as ObjectiveStatus)}
              className="w-full px-3 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:outline-none focus:border-custom-primary-100 transition-colors"
            >
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="behind">Behind</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-custom-border-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-custom-primary-100 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? "Creating..." : "Create Objective"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
