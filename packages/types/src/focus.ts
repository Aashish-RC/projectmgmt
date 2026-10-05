/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TimerMode = "stopwatch" | "pomodoro";
export type PomodoroStage = "work" | "break";

export type TIssueTimeLog = {
  id: string;
  workspace: string;
  project: string;
  issue: string;
  duration_minutes: number;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TFocusState = {
  todayIssueIds: string[];
  activeIssueId: string | null;
  timerMode: TimerMode;
  elapsedSeconds: number;
  pomodoroRemainingSeconds: number;
  isPaused: boolean;
  pomodoroStage: PomodoroStage;
};
