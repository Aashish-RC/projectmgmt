/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { 
  Play, 
  Pause, 
  Square, 
  Sun, 
  Coffee 
} from "lucide-react";
import { useFocus } from "@/hooks/store/use-focus";
import { useIssues } from "@/hooks/store/use-issues";
import { EIssuesStoreType } from "@plane/types";

// Format seconds to MM:SS
const formatTime = (totalSec: number) => {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const TopNavTimerWidget: React.FC = observer(() => {
  const {
    activeIssueId,
    timerMode,
    elapsedSeconds,
    pomodoroRemainingSeconds,
    isPaused,
    pomodoroStage,
    todayIssueIds,
    pauseTimer,
    resumeTimer,
    stopTimer,
    toggleDrawer,
  } = useFocus();

  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;
  const projectId = params?.projectId as string;

  const {
    issues: { getIssueById },
  } = useIssues(EIssuesStoreType.PROJECT);

  const activeIssue = activeIssueId ? getIssueById(activeIssueId) : null;

  const displayTime =
    timerMode === "pomodoro"
      ? formatTime(pomodoroRemainingSeconds)
      : formatTime(elapsedSeconds);

  // Global keyboard shortcut: 'd' or 'D' to toggle Focus Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.getAttribute("role") === "textbox")
      ) {
        return;
      }

      if ((e.key === "d" || e.key === "D") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleDrawer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleDrawer]);

  return (
    <div className="flex items-center gap-2">
      {/* Active Running Timer */}
      {activeIssueId && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-custom-primary-100/30 bg-custom-primary-100/10 text-xs shadow-xs animate-fade-in">
          {timerMode === "pomodoro" && pomodoroStage === "break" ? (
            <Coffee size={13} className="text-amber-500 animate-pulse" />
          ) : (
            <div className="relative flex h-2 w-2">
              {!isPaused && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-custom-primary-100 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-custom-primary-100" />
            </div>
          )}

          {activeIssue && (
            <span className="font-medium text-custom-text-100 max-w-[140px] truncate hidden sm:inline-block">
              {activeIssue.name}
            </span>
          )}

          <span className="font-mono font-bold text-custom-text-100 tracking-wider">
            {displayTime}
          </span>

          <div className="flex items-center gap-1 border-l border-custom-border-200 pl-1.5 ml-1">
            {isPaused ? (
              <button
                type="button"
                onClick={resumeTimer}
                title="Resume timer"
                className="p-1 rounded hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100 transition-colors cursor-pointer"
              >
                <Play size={12} className="fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseTimer}
                title="Pause timer"
                className="p-1 rounded hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100 transition-colors cursor-pointer"
              >
                <Pause size={12} className="fill-current" />
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                await stopTimer(workspaceSlug, projectId);
              }}
              title="Stop timer & log session"
              className="p-1 rounded hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
            >
              <Square size={12} className="fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* Focus Drawer Toggle Button */}
      <button
        type="button"
        onClick={() => toggleDrawer()}
        title="My Day / Focus scratchpad (Shortcut: D)"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-custom-border-200 bg-custom-background-100 hover:bg-custom-background-90 text-custom-text-200 hover:text-custom-text-100 transition-all cursor-pointer"
      >
        <Sun size={13} className="text-amber-500" />
        <span className="hidden md:inline">My Day</span>
        {todayIssueIds.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500">
            {todayIssueIds.length}
          </span>
        )}
        <kbd className="hidden lg:inline text-[9px] font-semibold px-1 py-0.5 rounded border border-custom-border-200 bg-custom-background-80 text-custom-text-400">
          D
        </kbd>
      </button>
    </div>
  );
});
