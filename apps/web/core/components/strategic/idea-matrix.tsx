/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { 
  ThumbsUp, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  Flame, 
  Clock, 
  Coffee, 
  CheckCircle2,
  Plus
} from "lucide-react";
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

export const IdeaMatrix: React.FC<Props> = observer(({
  ideas,
  onUpvote,
  onConvertToIssue,
  onConvertToModule,
  onAddNewIdea,
}) => {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {QUADRANTS.map((quadrant) => {
          const QuadrantIcon = quadrant.icon;
          const quadrantIdeas = getQuadrantIdeas(quadrant.id);

          return (
            <div
              key={quadrant.id}
              className={`rounded-2xl border ${quadrant.accent} p-4 flex flex-col min-h-[320px] transition-all`}
            >
              {/* Quadrant Header */}
              <div className="flex items-center justify-between pb-3 border-b border-custom-border-100/60 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${quadrant.badgeBg}`}>
                    <QuadrantIcon size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-custom-text-100 flex items-center gap-2">
                      {quadrant.title}
                      <span className="text-xs px-2 py-0.2 rounded-full bg-custom-background-80 text-custom-text-300 font-normal">
                        {quadrantIdeas.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-custom-text-300">{quadrant.subtitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAddNewIdea}
                  title="Add Idea"
                  className="p-1 rounded-md text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Ideas Cards inside Quadrant */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
                {quadrantIdeas.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-custom-text-400">
                    No ideas in this quadrant yet.
                  </div>
                ) : (
                  quadrantIdeas.map((idea) => {
                    const isConverting = convertingId === idea.id;
                    const isConverted = idea.status === "converted" || Boolean(idea.converted_issue) || Boolean(idea.converted_module);

                    return (
                      <div
                        key={idea.id}
                        className="rounded-xl border border-custom-border-200 bg-custom-background-100 p-3.5 shadow-sm hover:border-custom-border-300 transition-all flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="text-xs font-semibold text-custom-text-100 line-clamp-2">
                              {idea.title}
                            </h4>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-custom-background-80 text-custom-text-300 capitalize shrink-0">
                              {idea.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-custom-text-300 mb-2">
                            <span className="px-1.5 py-0.5 rounded bg-custom-background-90 border border-custom-border-100 font-medium">
                              Impact: {idea.impact}/5
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-custom-background-90 border border-custom-border-100 font-medium">
                              Effort: {idea.effort}/5
                            </span>
                          </div>
                        </div>

                        {/* Card Actions: Upvote & 1-Click Convert */}
                        <div className="flex items-center justify-between pt-2 border-t border-custom-border-100/60">
                          <button
                            type="button"
                            onClick={() => onUpvote(idea.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-custom-background-90 hover:bg-custom-background-80 text-custom-text-200 border border-custom-border-200 transition-colors cursor-pointer"
                          >
                            <ThumbsUp size={12} className="text-custom-primary-100" />
                            <span>{idea.upvotes_count || 0}</span>
                          </button>

                          {isConverted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-custom-primary-100/10 text-custom-primary-100 hover:bg-custom-primary-100/20 border border-custom-primary-100/20 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <ArrowRight size={11} />
                                <span>To Issue</span>
                              </button>
                              <button
                                type="button"
                                disabled={isConverting}
                                onClick={() => handleConvert(idea.id, "module")}
                                title="Convert to Module"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-custom-background-90 text-custom-text-200 hover:bg-custom-background-80 border border-custom-border-200 transition-all disabled:opacity-50 cursor-pointer"
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
});
