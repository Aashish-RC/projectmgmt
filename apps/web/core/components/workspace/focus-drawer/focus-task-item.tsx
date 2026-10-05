/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { Play, Pause, X, ChevronUp, ChevronDown, CheckCircle2, Circle } from "lucide-react";
import { useFocus } from "@/hooks/store/use-focus";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  issueId: string;
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export const FocusTaskItem: React.FC<Props> = observer(
  ({ issueId, index, totalCount, onMoveUp, onMoveDown, onRemove }) => {
    const { activeIssueId, isPaused, startTimer, pauseTimer, resumeTimer } = useFocus();
    const { issueMap } = useIssues();
    const { getProjectIdentifierById } = useProject();
    const { projectStates, getStateById } = useProjectState();

    const issue = issueMap?.[issueId];
    const isActive = activeIssueId === issueId;
    const projectIdentifier = issue?.project_id ? getProjectIdentifierById(issue.project_id) : "";
    const currentState = issue?.state_id ? getStateById(issue.state_id) : null;
    const isCompleted = currentState?.group === "completed" || currentState?.group === "cancelled";

    const handleToggleComplete = async () => {
      if (!issue) return;
      const completedState = projectStates?.find((s) => s.group === "completed");
      const unstartedState = projectStates?.find((s) => s.group === "unstarted") || projectStates?.[0];
      const targetStateId = isCompleted ? unstartedState?.id : completedState?.id;

      if (targetStateId && issue.project_id) {
        // Optimistically update
        issue.state_id = targetStateId;
      }
    };

    if (!issue) {
      return (
        <div className="border-custom-border-100 bg-custom-background-100 text-xs text-custom-text-300 flex items-center justify-between rounded-xl border p-3">
          <span>Task #{issueId.slice(0, 6)}</span>
          <button
            type="button"
            onClick={onRemove}
            className="text-custom-text-400 hover:text-custom-text-100 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      );
    }

    return (
      <div
        className={`group relative flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
          isActive
            ? "border-custom-primary-100/50 bg-custom-primary-100/5 shadow-xs"
            : "border-custom-border-100 bg-custom-background-100 hover:border-custom-border-200"
        }`}
      >
        {/* Checkbox & Details */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={handleToggleComplete}
            title={isCompleted ? "Mark incomplete" : "Mark completed"}
            className="text-custom-text-400 hover:text-emerald-500 shrink-0 cursor-pointer transition-colors"
          >
            {isCompleted ? (
              <CheckCircle2 size={17} className="text-emerald-500 fill-emerald-500/20" />
            ) : (
              <Circle size={17} />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="text-custom-text-300 font-mono mb-0.5 flex items-center gap-1.5 text-[11px]">
              {projectIdentifier && (
                <span>
                  {projectIdentifier}-{issue.sequence_id}
                </span>
              )}
              {currentState && (
                <span className="py-0.2 font-sans bg-custom-background-90 border-custom-border-100 rounded border px-1.5 text-[10px]">
                  {currentState.name}
                </span>
              )}
            </div>

            <p
              className={`text-xs text-custom-text-100 truncate font-medium ${
                isCompleted ? "text-custom-text-400 line-through" : ""
              }`}
            >
              {issue.name}
            </p>
          </div>
        </div>

        {/* Actions: Timer & Reorder & Remove */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isActive ? (
            isPaused ? (
              <button
                type="button"
                onClick={resumeTimer}
                title="Resume timer"
                className="bg-custom-primary-100 cursor-pointer rounded-lg p-1.5 text-white transition-opacity hover:opacity-90"
              >
                <Play size={12} className="fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseTimer}
                title="Pause timer"
                className="bg-custom-primary-100 animate-pulse cursor-pointer rounded-lg p-1.5 text-white transition-opacity hover:opacity-90"
              >
                <Pause size={12} className="fill-current" />
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => startTimer(issue.id)}
              title="Start timer on this task"
              className="border-custom-border-200 bg-custom-background-90 hover:bg-custom-primary-100 text-custom-text-200 cursor-pointer rounded-lg border p-1.5 transition-all hover:border-transparent hover:text-white"
            >
              <Play size={12} />
            </button>
          )}

          {/* Up / Down Reorder */}
          <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveUp}
              title="Move up"
              className="text-custom-text-400 hover:text-custom-text-100 cursor-pointer p-0.5 disabled:opacity-20"
            >
              <ChevronUp size={11} />
            </button>
            <button
              type="button"
              disabled={index === totalCount - 1}
              onClick={onMoveDown}
              title="Move down"
              className="text-custom-text-400 hover:text-custom-text-100 cursor-pointer p-0.5 disabled:opacity-20"
            >
              <ChevronDown size={11} />
            </button>
          </div>

          {/* Remove from Today */}
          <button
            type="button"
            onClick={onRemove}
            title="Remove from My Day"
            className="text-custom-text-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer rounded-md p-1 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }
);
