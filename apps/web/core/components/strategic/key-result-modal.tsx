/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { X, CheckSquare, RefreshCw } from "lucide-react";
import type { TKeyResult } from "@plane/types";

type Props = {
  isOpen: boolean;
  objectiveId: string | null;
  onClose: () => void;
  onSubmit: (data: Partial<TKeyResult>) => Promise<void>;
};

export const KeyResultModal: React.FC<Props> = ({ isOpen, objectiveId, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [initialValue, setInitialValue] = useState(0);
  const [targetValue, setTargetValue] = useState(100);
  const [currentValue, setCurrentValue] = useState(0);
  const [unit, setUnit] = useState("percentage");
  const [autoCompute, setAutoCompute] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !objectiveId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        objective: objectiveId,
        title: title.trim(),
        initial_value: Number(initialValue),
        target_value: Number(targetValue),
        current_value: Number(currentValue),
        unit: unit.trim() || "percentage",
        auto_compute: autoCompute,
      });
      setTitle("");
      setInitialValue(0);
      setTargetValue(100);
      setCurrentValue(0);
      setUnit("percentage");
      setAutoCompute(true);
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
              <CheckSquare size={18} />
            </div>
            <h2 className="text-base font-semibold text-custom-text-100">Add Measurable Key Result</h2>
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
            <label htmlFor="krTitle" className="block text-xs font-medium text-custom-text-200 mb-1.5">
              Key Result Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="krTitle"
              type="text"
              required
              placeholder="e.g., Deliver MVP architecture milestone"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:border-custom-primary-100 transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="krInitial" className="block text-xs font-medium text-custom-text-200 mb-1.5">
                Initial
              </label>
              <input
                id="krInitial"
                type="number"
                step="any"
                value={initialValue}
                onChange={(e) => setInitialValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:outline-none focus:border-custom-primary-100 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="krCurrent" className="block text-xs font-medium text-custom-text-200 mb-1.5">
                Current
              </label>
              <input
                id="krCurrent"
                type="number"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:outline-none focus:border-custom-primary-100 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="krTarget" className="block text-xs font-medium text-custom-text-200 mb-1.5">
                Target
              </label>
              <input
                id="krTarget"
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:outline-none focus:border-custom-primary-100 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="krUnit" className="block text-xs font-medium text-custom-text-200 mb-1.5">
              Measurement Unit
            </label>
            <input
              id="krUnit"
              type="text"
              placeholder="e.g., %, USD, users, tasks"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:outline-none focus:border-custom-primary-100 transition-colors"
            />
          </div>

          <div className="p-3 rounded-lg border border-custom-border-200 bg-custom-background-90 flex items-start gap-3">
            <input
              type="checkbox"
              id="autoCompute"
              checked={autoCompute}
              onChange={(e) => setAutoCompute(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-custom-border-300 text-custom-primary-100 focus:ring-custom-primary-100"
            />
            <label htmlFor="autoCompute" className="text-xs cursor-pointer select-none">
              <span className="font-semibold text-custom-text-100 flex items-center gap-1.5">
                <RefreshCw size={13} className="text-sky-400" />
                Automated Progress Rollup
              </span>
              <p className="text-custom-text-300 mt-0.5">
                Automatically calculates progress from completed issues in linked Cycles and Modules.
              </p>
            </label>
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
              {submitting ? "Adding..." : "Add Key Result"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
