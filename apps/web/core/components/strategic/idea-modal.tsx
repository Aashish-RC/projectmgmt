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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-custom-border-200 bg-custom-background-100 shadow-2xl overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between p-5 border-b border-custom-border-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Lightbulb size={18} />
            </div>
            <h2 className="text-base font-semibold text-custom-text-100">Submit Idea / Hypothesis</h2>
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
            <label htmlFor="ideaTitle" className="block text-xs font-medium text-custom-text-200 mb-1.5">
              Idea Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="ideaTitle"
              type="text"
              required
              placeholder="e.g., Integrate AI-assisted issue triage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:border-custom-primary-100 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="ideaDescription" className="block text-xs font-medium text-custom-text-200 mb-1.5">
              Hypothesis & Expected Outcome
            </label>
            <textarea
              id="ideaDescription"
              rows={3}
              placeholder="If we build X, then user engagement will increase by Y because..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-custom-border-200 bg-custom-background-90 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:border-custom-primary-100 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-custom-border-100 bg-custom-background-90">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-custom-text-200 flex items-center gap-1">
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
                className="w-full h-1.5 bg-custom-background-80 rounded-lg appearance-none cursor-pointer accent-custom-primary-100"
              />
              <div className="flex justify-between text-[10px] text-custom-text-400 mt-1">
                <span>Low (1)</span>
                <span>High (5)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-custom-text-200 flex items-center gap-1">
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
                className="w-full h-1.5 bg-custom-background-80 rounded-lg appearance-none cursor-pointer accent-custom-primary-100"
              />
              <div className="flex justify-between text-[10px] text-custom-text-400 mt-1">
                <span>Low (1)</span>
                <span>High (5)</span>
              </div>
            </div>
          </div>

          {/* Matrix placement preview */}
          <div className="p-3 rounded-lg border border-custom-border-200 bg-custom-background-80/50 text-xs">
            <span className="text-custom-text-300">Target Matrix Placement: </span>
            <span className="font-semibold text-custom-primary-100">{getQuadrant(impact, effort)}</span>
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
              {submitting ? "Submitting..." : "Save Idea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
