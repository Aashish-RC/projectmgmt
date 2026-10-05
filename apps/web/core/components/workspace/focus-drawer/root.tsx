/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { format } from "date-fns";
import { 
  Sun, 
  X, 
  Clock, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Sparkles 
} from "lucide-react";
import { useFocus } from "@/hooks/store/use-focus";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { EIssuesStoreType } from "@plane/types";
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

  const {
    issues: { getIssueById, getProjectIssues },
  } = useIssues(EIssuesStoreType.PROJECT);
  const { getStateById } = useProjectState();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  if (!isDrawerOpen) return null;

  const todayDateFormatted = format(new Date(), "EEEE, MMMM d");

  // Determine completed issue IDs
  const completedIssueIds = todayIssueIds.filter((id) => {
    const issue = getIssueById(id);
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
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => toggleDrawer(false)}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-custom-border-200 bg-custom-background-100 shadow-2xl flex flex-col animate-slide-left">
          {/* Drawer Header */}
          <div className="p-5 border-b border-custom-border-100 bg-custom-background-90/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Sun size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-custom-text-100">My Day / Focus</h2>
                  <p className="text-xs text-custom-text-300 font-medium">{todayDateFormatted}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleDrawer(false)}
                className="p-1.5 rounded-lg text-custom-text-400 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Daily Stats & Mode Bar */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-custom-border-200 bg-custom-background-100 text-xs">
              <div className="flex items-center gap-1.5 text-custom-text-200">
                <Clock size={13} className="text-custom-primary-100" />
                <span>Focus Time:</span>
                <strong className="text-custom-text-100 font-mono">{totalFocusMinutes}m</strong>
              </div>

              <div className="flex items-center gap-1.5 text-custom-text-200">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>Completed:</span>
                <strong className="text-custom-text-100">
                  {completedIssueIds.length} / {todayIssueIds.length}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Task Add Input */}
          <div className="p-4 border-b border-custom-border-100 bg-custom-background-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Search or add task to My Day..."
                value={searchQuery}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-custom-border-200 bg-custom-background-90 text-xs text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:border-custom-primary-100 transition-colors"
              />
              <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-custom-text-400" />
            </div>

            {/* Quick Add Suggestions if searching */}
            {isSearching && searchQuery.trim().length > 0 && (
              <div className="mt-2 p-2 rounded-xl border border-custom-border-200 bg-custom-background-90 space-y-1 max-h-40 overflow-y-auto">
                {getProjectIssues()
                  .filter(
                    (issue) =>
                      issue.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                      !todayIssueIds.includes(issue.id)
                  )
                  .slice(0, 5)
                  .map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => {
                        startTimer(issue.id, timerMode);
                        setSearchQuery("");
                        setIsSearching(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-custom-background-80 text-xs text-custom-text-100 truncate flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="truncate">{issue.name}</span>
                      <span className="text-[10px] text-custom-primary-100 font-semibold shrink-0">
                        + Add & Focus
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Task Queue List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {todayIssueIds.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <Sparkles size={22} />
                </div>
                <h3 className="text-sm font-semibold text-custom-text-100">Ready for Focus</h3>
                <p className="text-xs text-custom-text-300 max-w-xs mt-1 mb-4">
                  Add 3 to 5 critical tasks to today's queue to enter flow-state with live Pomodoro tracking.
                </p>
                <div className="text-[11px] text-custom-text-400 flex items-center gap-1">
                  <span>Tip: Press</span>
                  <kbd className="px-1.5 py-0.5 rounded border border-custom-border-200 bg-custom-background-90 font-semibold text-custom-text-200">
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
            <div className="p-4 border-t border-custom-border-100 bg-custom-background-90 flex items-center justify-between text-xs">
              <span className="text-custom-text-400">
                {todayIssueIds.length} {todayIssueIds.length === 1 ? "task" : "tasks"} in queue
              </span>

              {completedIssueIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearCompletedToday(completedIssueIds)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
