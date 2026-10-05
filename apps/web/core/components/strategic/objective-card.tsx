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
  RefreshCw 
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
  const progress = keyResults.length > 0
    ? Math.round(keyResults.reduce((acc, kr) => acc + (kr.progress_percentage || 0), 0) / keyResults.length)
    : (objective.progress || 0);

  return (
    <div className="rounded-xl border border-custom-border-200 bg-custom-background-100 shadow-sm transition-all hover:border-custom-border-300 overflow-hidden">
      {/* Card Header */}
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-custom-border-100 bg-custom-background-90/50">
        <div className="flex items-start gap-3 flex-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 mt-0.5 rounded text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                <StatusIcon size={12} />
                {statusConfig.label}
              </span>
              
              {objective.target_date && (
                <span className="inline-flex items-center gap-1 text-xs text-custom-text-300">
                  <Calendar size={12} />
                  Target: {format(new Date(objective.target_date), "MMM d, yyyy")}
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-xs text-custom-text-300">
                <Target size={12} />
                {keyResults.length} Key {keyResults.length === 1 ? "Result" : "Results"}
              </span>
            </div>

            <h3 className="text-base font-semibold text-custom-text-100 tracking-tight">
              {objective.title}
            </h3>
            {objective.description && (
              <p className="text-xs text-custom-text-300 mt-1 line-clamp-2 max-w-3xl">
                {objective.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress & Quick Actions */}
        <div className="flex items-center gap-6 self-end md:self-center">
          <div className="flex flex-col items-end gap-1.5 min-w-[130px]">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-custom-text-300 font-medium">Progress</span>
              <span className="font-semibold text-custom-text-100">{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-custom-background-80 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-custom-primary-100/10 text-custom-primary-100 hover:bg-custom-primary-100/20 border border-custom-primary-100/20 transition-all shrink-0"
          >
            <Plus size={14} />
            <span>Add KR</span>
          </button>
        </div>
      </div>

      {/* Expanded Key Results Breakdown */}
      {expanded && (
        <div className="p-4 space-y-3 bg-custom-background-100/40">
          {keyResults.length === 0 ? (
            <div className="py-6 text-center text-xs text-custom-text-400">
              No Key Results defined yet. Click "Add KR" to track measurable outcomes.
            </div>
          ) : (
            keyResults.map((kr) => {
              const krProgress = Math.round(kr.progress_percentage || 0);
              return (
                <div
                  key={kr.id}
                  className="p-3.5 rounded-lg border border-custom-border-100 bg-custom-background-90/80 hover:border-custom-border-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs text-custom-text-100 truncate">
                        {kr.title}
                      </span>
                      {kr.auto_compute && (
                        <span
                          title="Auto-computes from completed issues in linked Cycles and Modules"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        >
                          <RefreshCw size={10} className="animate-spin-slow" />
                          Auto-rollup
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-custom-text-300">
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
                  <div className="flex items-center gap-3 sm:w-44 shrink-0">
                    <div className="flex-1 h-1.5 rounded-full bg-custom-background-80 overflow-hidden">
                      <div
                        className="h-full bg-custom-primary-100 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(Math.max(krProgress, 0), 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-custom-text-200 w-10 text-right">
                      {krProgress}%
                    </span>
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
