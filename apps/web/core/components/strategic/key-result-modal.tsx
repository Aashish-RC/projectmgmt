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
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="border-custom-border-200 bg-custom-background-100 shadow-2xl animate-scale-up w-full max-w-lg overflow-hidden rounded-2xl border">
        <div className="border-custom-border-100 flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-2.5">
            <div className="bg-custom-primary-100/10 text-custom-primary-100 rounded-lg p-2">
              <CheckSquare size={18} />
            </div>
            <h2 className="text-base text-custom-text-100 font-semibold">Add Measurable Key Result</h2>
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
            <label htmlFor="krTitle" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
              Key Result Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="krTitle"
              type="text"
              required
              placeholder="e.g., Deliver MVP architecture milestone"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 w-full rounded-lg border px-3.5 py-2 transition-colors focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="krInitial" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
                Initial
              </label>
              <input
                id="krInitial"
                type="number"
                step="any"
                value={initialValue}
                onChange={(e) => setInitialValue(Number(e.target.value))}
                className="border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:border-custom-primary-100 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="krCurrent" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
                Current
              </label>
              <input
                id="krCurrent"
                type="number"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:border-custom-primary-100 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="krTarget" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
                Target
              </label>
              <input
                id="krTarget"
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:border-custom-primary-100 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="krUnit" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
              Measurement Unit
            </label>
            <input
              id="krUnit"
              type="text"
              placeholder="e.g., %, USD, users, tasks"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 focus:border-custom-primary-100 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none"
            />
          </div>

          <div className="border-custom-border-200 bg-custom-background-90 flex items-start gap-3 rounded-lg border p-3">
            <input
              type="checkbox"
              id="autoCompute"
              checked={autoCompute}
              onChange={(e) => setAutoCompute(e.target.checked)}
              className="border-custom-border-300 text-custom-primary-100 focus:ring-custom-primary-100 mt-1 h-4 w-4 rounded"
            />
            <label htmlFor="autoCompute" className="text-xs cursor-pointer select-none">
              <span className="text-custom-text-100 flex items-center gap-1.5 font-semibold">
                <RefreshCw size={13} className="text-sky-400" />
                Automated Progress Rollup
              </span>
              <p className="text-custom-text-300 mt-0.5">
                Automatically calculates progress from completed issues in linked Cycles and Modules.
              </p>
            </label>
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
              {submitting ? "Adding..." : "Add Key Result"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
