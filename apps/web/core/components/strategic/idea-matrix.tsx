/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { ThumbsUp, ArrowRight, Layers, Sparkles, Flame, Clock, Coffee, CheckCircle2, Plus } from "lucide-react";
import type { IdeaMatrixQuadrant, TIdea } from "@plane/types";

type Props = {
  ideas: TIdea[];
  onUpvote: (ideaId: string) => Promise<void>;
  onConvertToIssue: (ideaId: string) => Promise<void>;
  onConvertToModule: (ideaId: string) => Promise<void>;
  onAddNewIdea: () => void;
};

const QUADRANTS: {
  id: IdeaMatrixQuadrant;
  title: string;
  subtitle: string;
  icon: any;
  accent: string;
  badgeBg: string;
}[] = [
  {
    id: "quick_wins",
    title: "Quick Wins",
    subtitle: "High Impact, Low Effort (Do First)",
    icon: Flame,
    accent: "border-emerald-500/30 bg-emerald-500/5",
    badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    id: "major_projects",
    title: "Major Projects",
    subtitle: "High Impact, High Effort (Plan Carefully)",
    icon: Sparkles,
    accent: "border-blue-500/30 bg-blue-500/5",
    badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    id: "fill_ins",
    title: "Fill-ins",
    subtitle: "Low Impact, Low Effort (Do When Time Permits)",
    icon: Coffee,
    accent: "border-amber-500/30 bg-amber-500/5",
    badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    id: "thankless_tasks",
    title: "Thankless Tasks",
    subtitle: "Low Impact, High Effort (Deprioritize / Avoid)",
    icon: Clock,
    accent: "border-rose-500/30 bg-rose-500/5",
    badgeBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
];

export const IdeaMatrix: React.FC<Props> = observer(
  ({ ideas, onUpvote, onConvertToIssue, onConvertToModule, onAddNewIdea }) => {
    const [convertingId, setConvertingId] = useState<string | null>(null);

    const handleConvert = async (ideaId: string, type: "issue" | "module") => {
      setConvertingId(ideaId);
      try {
        if (type === "issue") {
          await onConvertToIssue(ideaId);
        } else {
          await onConvertToModule(ideaId);
        }
      } finally {
        setConvertingId(null);
      }
    };

    const getQuadrantIdeas = (quadrant: IdeaMatrixQuadrant) => {
      return ideas.filter((idea) => {
        if (idea.matrix_quadrant) return idea.matrix_quadrant === quadrant;
        // Fallback calculation
        if (idea.impact >= 3) {
          return idea.effort <= 2 ? quadrant === "quick_wins" : quadrant === "major_projects";
        } else {
          return idea.effort <= 2 ? quadrant === "fill_ins" : quadrant === "thankless_tasks";
        }
      });
    };

    return (
      <div className="space-y-4">
        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {QUADRANTS.map((quadrant) => {
            const QuadrantIcon = quadrant.icon;
            const quadrantIdeas = getQuadrantIdeas(quadrant.id);

            return (
              <div
                key={quadrant.id}
                className={`rounded-2xl border ${quadrant.accent} flex min-h-[320px] flex-col p-4 transition-all`}
              >
                {/* Quadrant Header */}
                <div className="border-custom-border-100/60 mb-3 flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-lg border p-1.5 ${quadrant.badgeBg}`}>
                      <QuadrantIcon size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm text-custom-text-100 flex items-center gap-2 font-bold">
                        {quadrant.title}
                        <span className="text-xs py-0.2 bg-custom-background-80 text-custom-text-300 font-normal rounded-full px-2">
                          {quadrantIdeas.length}
                        </span>
                      </h3>
                      <p className="text-custom-text-300 text-[11px]">{quadrant.subtitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onAddNewIdea}
                    title="Add Idea"
                    className="text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80 cursor-pointer rounded-md p-1 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Ideas Cards inside Quadrant */}
                <div className="max-h-[460px] flex-1 space-y-2.5 overflow-y-auto pr-1">
                  {quadrantIdeas.length === 0 ? (
                    <div className="text-xs text-custom-text-400 flex h-full flex-col items-center justify-center p-6 text-center">
                      No ideas in this quadrant yet.
                    </div>
                  ) : (
                    quadrantIdeas.map((idea) => {
                      const isConverting = convertingId === idea.id;
                      const isConverted =
                        idea.status === "converted" || Boolean(idea.converted_issue) || Boolean(idea.converted_module);

                      return (
                        <div
                          key={idea.id}
                          className="border-custom-border-200 bg-custom-background-100 shadow-sm hover:border-custom-border-300 flex flex-col justify-between gap-3 rounded-xl border p-3.5 transition-all"
                        >
                          <div>
                            <div className="mb-1.5 flex items-start justify-between gap-2">
                              <h4 className="text-xs text-custom-text-100 line-clamp-2 font-semibold">{idea.title}</h4>
                              <span className="bg-custom-background-80 text-custom-text-300 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize">
                                {idea.status}
                              </span>
                            </div>

                            <div className="text-custom-text-300 mb-2 flex items-center gap-2 text-[10px]">
                              <span className="bg-custom-background-90 border-custom-border-100 rounded border px-1.5 py-0.5 font-medium">
                                Impact: {idea.impact}/5
                              </span>
                              <span className="bg-custom-background-90 border-custom-border-100 rounded border px-1.5 py-0.5 font-medium">
                                Effort: {idea.effort}/5
                              </span>
                            </div>
                          </div>

                          {/* Card Actions: Upvote & 1-Click Convert */}
                          <div className="border-custom-border-100/60 flex items-center justify-between border-t pt-2">
                            <button
                              type="button"
                              onClick={() => onUpvote(idea.id)}
                              className="text-xs bg-custom-background-90 hover:bg-custom-background-80 text-custom-text-200 border-custom-border-200 inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 font-medium transition-colors"
                            >
                              <ThumbsUp size={12} className="text-custom-primary-100" />
                              <span>{idea.upvotes_count || 0}</span>
                            </button>

                            {isConverted ? (
                              <span className="text-emerald-500 inline-flex items-center gap-1 text-[11px] font-medium">
                                <CheckCircle2 size={13} />
                                Converted
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isConverting}
                                  onClick={() => handleConvert(idea.id, "issue")}
                                  title="Convert to Issue / Work Item"
                                  className="bg-custom-primary-100/10 text-custom-primary-100 hover:bg-custom-primary-100/20 border-custom-primary-100/20 inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all disabled:opacity-50"
                                >
                                  <ArrowRight size={11} />
                                  <span>To Issue</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isConverting}
                                  onClick={() => handleConvert(idea.id, "module")}
                                  title="Convert to Module"
                                  className="bg-custom-background-90 text-custom-text-200 hover:bg-custom-background-80 border-custom-border-200 inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all disabled:opacity-50"
                                >
                                  <Layers size={11} />
                                  <span>To Module</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
