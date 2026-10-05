/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { X, Lightbulb, Zap, TrendingUp } from "lucide-react";
import type { TIdea } from "@plane/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TIdea>) => Promise<void>;
};

// Preview Quadrant
const getQuadrant = (imp: number, eff: number) => {
  if (imp >= 3) {
    return eff <= 2 ? "Quick Wins (High Impact, Low Effort)" : "Major Projects (High Impact, High Effort)";
  } else {
    return eff <= 2 ? "Fill-ins (Low Impact, Low Effort)" : "Thankless Tasks (Low Impact, High Effort)";
  }
};

export const IdeaModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState<number>(3);
  const [effort, setEffort] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description_html: `<p>${description.trim() || title.trim()}</p>`,
        impact,
        effort,
        status: "new",
      });
      setTitle("");
      setDescription("");
      setImpact(3);
      setEffort(2);
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
            <div className="bg-amber-500/10 text-amber-500 rounded-lg p-2">
              <Lightbulb size={18} />
            </div>
            <h2 className="text-base text-custom-text-100 font-semibold">Submit Idea / Hypothesis</h2>
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
            <label htmlFor="ideaTitle" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
              Idea Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="ideaTitle"
              type="text"
              required
              placeholder="e.g., Integrate AI-assisted issue triage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 w-full rounded-lg border px-3.5 py-2 transition-colors focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ideaDescription" className="text-xs text-custom-text-200 mb-1.5 block font-medium">
              Hypothesis & Expected Outcome
            </label>
            <textarea
              id="ideaDescription"
              rows={3}
              placeholder="If we build X, then user engagement will increase by Y because..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 w-full resize-none rounded-lg border px-3.5 py-2 transition-colors focus:outline-none"
            />
          </div>

          <div className="border-custom-border-100 bg-custom-background-90 grid grid-cols-2 gap-4 rounded-xl border p-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-custom-text-200 flex items-center gap-1 font-medium">
                  <TrendingUp size={13} className="text-emerald-500" />
                  Impact: <strong className="text-custom-text-100">{impact} / 5</strong>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                className="bg-custom-background-80 accent-custom-primary-100 h-1.5 w-full cursor-pointer appearance-none rounded-lg"
              />
              <div className="text-custom-text-400 mt-1 flex justify-between text-[10px]">
                <span>Low (1)</span>
                <span>High (5)</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-custom-text-200 flex items-center gap-1 font-medium">
                  <Zap size={13} className="text-amber-500" />
                  Effort: <strong className="text-custom-text-100">{effort} / 5</strong>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={effort}
                onChange={(e) => setEffort(Number(e.target.value))}
                className="bg-custom-background-80 accent-custom-primary-100 h-1.5 w-full cursor-pointer appearance-none rounded-lg"
              />
              <div className="text-custom-text-400 mt-1 flex justify-between text-[10px]">
                <span>Low (1)</span>
                <span>High (5)</span>
              </div>
            </div>
          </div>

          {/* Matrix placement preview */}
          <div className="border-custom-border-200 bg-custom-background-80/50 text-xs rounded-lg border p-3">
            <span className="text-custom-text-300">Target Matrix Placement: </span>
            <span className="text-custom-primary-100 font-semibold">{getQuadrant(impact, effort)}</span>
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
              {submitting ? "Submitting..." : "Save Idea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
