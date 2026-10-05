/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { format } from "date-fns";
import { Sun, X, Clock, Trash2, Plus, CheckCircle2, Sparkles } from "lucide-react";
import { useFocus } from "@/hooks/store/use-focus";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import type { TIssue } from "@plane/types";
import { FocusTaskItem } from "./focus-task-item";

export const FocusDrawer: React.FC = observer(() => {
  const {
    isDrawerOpen,
    toggleDrawer,
    todayIssueIds,
    removeFromToday,
    reorderToday,
    clearCompletedToday,
    timerMode,
    startTimer,
    elapsedSeconds,
  } = useFocus();

  const { issueMap } = useIssues();
  const { getStateById } = useProjectState();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  if (!isDrawerOpen) return null;

  const todayDateFormatted = format(new Date(), "EEEE, MMMM d");

  // Determine completed issue IDs
  const completedIssueIds = todayIssueIds.filter((id) => {
    const issue = issueMap?.[id];
    if (!issue?.state_id) return false;
    const state = getStateById(issue.state_id);
    return state?.group === "completed" || state?.group === "cancelled";
  });

  // Calculate total focus minutes today
  const totalFocusMinutes = Math.floor(elapsedSeconds / 60);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      {/* oxlint-disable-next-line jsx_a11y/click-events-have-key-events oxlint-disable-next-line jsx_a11y/no-static-element-interactions */}
      <div
        className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => toggleDrawer(false)}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="border-custom-border-200 bg-custom-background-100 shadow-2xl animate-slide-left flex w-screen max-w-md flex-col border-l">
          {/* Drawer Header */}
          <div className="border-custom-border-100 bg-custom-background-90/80 border-b p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/10 text-amber-500 rounded-xl p-2">
                  <Sun size={20} />
                </div>
                <div>
                  <h2 className="text-base text-custom-text-100 font-bold">My Day / Focus</h2>
                  <p className="text-xs text-custom-text-300 font-medium">{todayDateFormatted}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleDrawer(false)}
                className="text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80 cursor-pointer rounded-lg p-1.5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Daily Stats & Mode Bar */}
            <div className="border-custom-border-200 bg-custom-background-100 text-xs flex items-center justify-between rounded-xl border p-2.5">
              <div className="text-custom-text-200 flex items-center gap-1.5">
                <Clock size={13} className="text-custom-primary-100" />
                <span>Focus Time:</span>
                <strong className="text-custom-text-100 font-mono">{totalFocusMinutes}m</strong>
              </div>

              <div className="text-custom-text-200 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>Completed:</span>
                <strong className="text-custom-text-100">
                  {completedIssueIds.length} / {todayIssueIds.length}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Task Add Input */}
          <div className="border-custom-border-100 bg-custom-background-100 border-b p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search or add task to My Day..."
                value={searchQuery}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 w-full rounded-xl border py-2 pr-4 pl-9 transition-colors focus:outline-none"
              />
              <Plus size={14} className="text-custom-text-400 absolute top-1/2 left-3 -translate-y-1/2" />
            </div>

            {/* Quick Add Suggestions if searching */}
            {isSearching && searchQuery.trim().length > 0 && (
              <div className="border-custom-border-200 bg-custom-background-90 mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border p-2">
                {(Object.values(issueMap ?? {}) as TIssue[])
                  .filter(
                    (issue: TIssue) =>
                      Boolean(issue.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
                      !todayIssueIds.includes(issue.id)
                  )
                  .slice(0, 5)
                  .map((issue: TIssue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => {
                        startTimer(issue.id, timerMode);
                        setSearchQuery("");
                        setIsSearching(false);
                      }}
                      className="hover:bg-custom-background-80 text-xs text-custom-text-100 flex w-full cursor-pointer items-center justify-between gap-2 truncate rounded-lg p-2 text-left"
                    >
                      <span className="truncate">{issue.name}</span>
                      <span className="text-custom-primary-100 shrink-0 text-[10px] font-semibold">+ Add & Focus</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Task Queue List */}
          <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
            {todayIssueIds.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="bg-amber-500/10 text-amber-500 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Sparkles size={22} />
                </div>
                <h3 className="text-sm text-custom-text-100 font-semibold">Ready for Focus</h3>
                <p className="text-xs text-custom-text-300 mt-1 mb-4 max-w-xs">
                  Add 3 to 5 critical tasks to today's queue to enter flow-state with live Pomodoro tracking.
                </p>
                <div className="text-custom-text-400 flex items-center gap-1 text-[11px]">
                  <span>Tip: Press</span>
                  <kbd className="border-custom-border-200 bg-custom-background-90 text-custom-text-200 rounded border px-1.5 py-0.5 font-semibold">
                    D
                  </kbd>
                  <span>anywhere to toggle this drawer</span>
                </div>
              </div>
            ) : (
              todayIssueIds.map((issueId, idx) => (
                <FocusTaskItem
                  key={issueId}
                  issueId={issueId}
                  index={idx}
                  totalCount={todayIssueIds.length}
                  onMoveUp={() => reorderToday(idx, idx - 1)}
                  onMoveDown={() => reorderToday(idx, idx + 1)}
                  onRemove={() => removeFromToday(issueId)}
                />
              ))
            )}
          </div>

          {/* Footer with Clear Completed */}
          {todayIssueIds.length > 0 && (
            <div className="border-custom-border-100 bg-custom-background-90 text-xs flex items-center justify-between border-t p-4">
              <span className="text-custom-text-400">
                {todayIssueIds.length} {todayIssueIds.length === 1 ? "task" : "tasks"} in queue
              </span>

              {completedIssueIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearCompletedToday(completedIssueIds)}
                  className="text-rose-500 hover:bg-rose-500/10 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Clear Completed ({completedIssueIds.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
