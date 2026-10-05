/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Target,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  RefreshCw,
} from "lucide-react";
import type { ObjectiveStatus, TKeyResult, TObjective } from "@plane/types";

type Props = {
  objective: TObjective;
  keyResults: TKeyResult[];
  onAddKeyResult: (objectiveId: string) => void;
};

const STATUS_CONFIG: Record<ObjectiveStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
  on_track: {
    label: "On Track",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  at_risk: {
    label: "At Risk",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    icon: AlertTriangle,
  },
  behind: {
    label: "Behind",
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/20",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    icon: CheckCircle2,
  },
};

export const ObjectiveCard: React.FC<Props> = observer(({ objective, keyResults, onAddKeyResult }) => {
  const [expanded, setExpanded] = useState(true);

  const statusConfig = STATUS_CONFIG[objective.status] || STATUS_CONFIG.on_track;
  const StatusIcon = statusConfig.icon;

  // Calculate live progress: if auto-computed, average child key results
  const progress =
    keyResults.length > 0
      ? Math.round(keyResults.reduce((acc, kr) => acc + (kr.progress_percentage || 0), 0) / keyResults.length)
      : objective.progress || 0;

  return (
    <div className="border-custom-border-200 bg-custom-background-100 shadow-sm hover:border-custom-border-300 overflow-hidden rounded-xl border transition-all">
      {/* Card Header */}
      <div className="border-custom-border-100 bg-custom-background-90/50 flex flex-col justify-between gap-4 border-b p-5 md:flex-row md:items-center">
        <div className="flex flex-1 items-start gap-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 mt-0.5 rounded p-1 transition-colors"
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          <div className="flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <span
                className={`text-xs inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                <StatusIcon size={12} />
                {statusConfig.label}
              </span>

              {objective.target_date && (
                <span className="text-xs text-custom-text-300 inline-flex items-center gap-1">
                  <Calendar size={12} />
                  Target: {format(new Date(objective.target_date), "MMM d, yyyy")}
                </span>
              )}

              <span className="text-xs text-custom-text-300 inline-flex items-center gap-1">
                <Target size={12} />
                {keyResults.length} Key {keyResults.length === 1 ? "Result" : "Results"}
              </span>
            </div>

            <h3 className="text-base text-custom-text-100 font-semibold tracking-tight">{objective.title}</h3>
            {objective.description && (
              <p className="text-xs text-custom-text-300 mt-1 line-clamp-2 max-w-3xl">{objective.description}</p>
            )}
          </div>
        </div>

        {/* Progress & Quick Actions */}
        <div className="flex items-center gap-6 self-end md:self-center">
          <div className="flex min-w-[130px] flex-col items-end gap-1.5">
            <div className="text-xs flex w-full items-center justify-between">
              <span className="text-custom-text-300 font-medium">Progress</span>
              <span className="text-custom-text-100 font-semibold">{progress}%</span>
            </div>
            <div className="bg-custom-background-80 h-2 w-full overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress >= 100
                    ? "bg-blue-500"
                    : progress >= 60
                      ? "bg-emerald-500"
                      : progress >= 30
                        ? "bg-amber-500"
                        : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAddKeyResult(objective.id)}
            className="text-xs bg-custom-primary-100/10 text-custom-primary-100 hover:bg-custom-primary-100/20 border-custom-primary-100/20 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 font-medium transition-all"
          >
            <Plus size={14} />
            <span>Add KR</span>
          </button>
        </div>
      </div>

      {/* Expanded Key Results Breakdown */}
      {expanded && (
        <div className="bg-custom-background-100/40 space-y-3 p-4">
          {keyResults.length === 0 ? (
            <div className="text-xs text-custom-text-400 py-6 text-center">
              No Key Results defined yet. Click "Add KR" to track measurable outcomes.
            </div>
          ) : (
            keyResults.map((kr) => {
              const krProgress = Math.round(kr.progress_percentage || 0);
              return (
                <div
                  key={kr.id}
                  className="border-custom-border-100 bg-custom-background-90/80 hover:border-custom-border-200 flex flex-col justify-between gap-3 rounded-lg border p-3.5 transition-all sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs text-custom-text-100 truncate font-medium">{kr.title}</span>
                      {kr.auto_compute && (
                        <span
                          title="Auto-computes from completed issues in linked Cycles and Modules"
                          className="bg-sky-500/10 text-sky-400 border-sky-500/20 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium"
                        >
                          <RefreshCw size={10} className="animate-spin-slow" />
                          Auto-rollup
                        </span>
                      )}
                    </div>

                    <div className="text-custom-text-300 flex items-center gap-3 text-[11px]">
                      <span>
                        Value: {kr.current_value} / {kr.target_value} {kr.unit}
                      </span>
                      {(kr.linked_cycles_count || 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Layers size={11} /> {kr.linked_cycles_count} Cycles
                        </span>
                      )}
                      {(kr.linked_modules_count || 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Layers size={11} /> {kr.linked_modules_count} Modules
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KR Progress */}
                  <div className="flex shrink-0 items-center gap-3 sm:w-44">
                    <div className="bg-custom-background-80 h-1.5 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-custom-primary-100 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(Math.max(krProgress, 0), 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-custom-text-200 w-10 text-right font-semibold">{krProgress}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});
