/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import type { PomodoroStage, TimerMode } from "@plane/types";
import { focusService } from "@/services/focus.service";
import type { RootStore } from "@/store/root.store";

const WORK_SESSION_SECONDS = 25 * 60; // 25 minutes
const BREAK_SESSION_SECONDS = 5 * 60; // 5 minutes
const STORAGE_KEY_PREFIX = "plane_focus_state_";

export interface IFocusStore {
  // Observables
  todayIssueIds: string[];
  activeIssueId: string | null;
  timerMode: TimerMode;
  elapsedSeconds: number;
  pomodoroRemainingSeconds: number;
  isPaused: boolean;
  pomodoroStage: PomodoroStage;
  isDrawerOpen: boolean;

  // Actions
  toggleDrawer: (open?: boolean) => void;
  addToToday: (issueId: string) => void;
  removeFromToday: (issueId: string) => void;
  reorderToday: (sourceIndex: number, destinationIndex: number) => void;
  clearCompletedToday: (completedIssueIds: string[]) => void;
  isInToday: (issueId: string) => boolean;

  // Timer Actions
  startTimer: (issueId: string, mode?: TimerMode) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (workspaceSlug?: string, projectId?: string) => Promise<number>;
  resetTimer: () => void;
  switchPomodoroStage: (stage?: PomodoroStage) => void;
}

export class FocusStore implements IFocusStore {
  todayIssueIds: string[] = [];
  activeIssueId: string | null = null;
  timerMode: TimerMode = "stopwatch";
  elapsedSeconds = 0;
  pomodoroRemainingSeconds = WORK_SESSION_SECONDS;
  isPaused = true;
  pomodoroStage: PomodoroStage = "work";
  isDrawerOpen = false;

  private tickerInterval: ReturnType<typeof setInterval> | null = null;
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      todayIssueIds: observable,
      activeIssueId: observable,
      timerMode: observable,
      elapsedSeconds: observable,
      pomodoroRemainingSeconds: observable,
      isPaused: observable,
      pomodoroStage: observable,
      isDrawerOpen: observable,
      toggleDrawer: action,
      addToToday: action,
      removeFromToday: action,
      reorderToday: action,
      clearCompletedToday: action,
      startTimer: action,
      pauseTimer: action,
      resumeTimer: action,
      stopTimer: action,
      resetTimer: action,
      switchPomodoroStage: action,
      tick: action,
    });
    this.rootStore = rootStore;
    this.initializeFromStorage();
    this.startTickerLoop();
  }

  private getStorageKey(): string {
    const slug = this.rootStore.workspaceRoot?.currentWorkspace?.slug || "default";
    return `${STORAGE_KEY_PREFIX}${slug}`;
  }

  private initializeFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.todayIssueIds)) {
          this.todayIssueIds = parsed.todayIssueIds;
        }
        if (parsed.activeIssueId) {
          this.activeIssueId = parsed.activeIssueId;
          this.timerMode = parsed.timerMode || "stopwatch";
          this.elapsedSeconds = parsed.elapsedSeconds || 0;
          this.pomodoroRemainingSeconds = parsed.pomodoroRemainingSeconds ?? WORK_SESSION_SECONDS;
          this.isPaused = parsed.isPaused ?? true;
          this.pomodoroStage = parsed.pomodoroStage || "work";
        }
      }
    } catch (e) {
      console.warn("Failed to load focus store from localStorage", e);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      const payload = {
        todayIssueIds: this.todayIssueIds,
        activeIssueId: this.activeIssueId,
        timerMode: this.timerMode,
        elapsedSeconds: this.elapsedSeconds,
        pomodoroRemainingSeconds: this.pomodoroRemainingSeconds,
        isPaused: this.isPaused,
        pomodoroStage: this.pomodoroStage,
      };
      localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to persist focus store to localStorage", e);
    }
  }

  private startTickerLoop() {
    if (typeof window === "undefined") return;
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  tick = () => {
    if (this.isPaused || !this.activeIssueId) return;

    this.elapsedSeconds += 1;

    if (this.timerMode === "pomodoro") {
      if (this.pomodoroRemainingSeconds > 0) {
        this.pomodoroRemainingSeconds -= 1;
      }

      if (this.pomodoroRemainingSeconds === 0) {
        // Toggle Pomodoro stage
        if (this.pomodoroStage === "work") {
          this.pomodoroStage = "break";
          this.pomodoroRemainingSeconds = BREAK_SESSION_SECONDS;
          this.notifySessionEnded("Pomodoro Work Session Complete!", "Time for a 5-minute break.");
        } else {
          this.pomodoroStage = "work";
          this.pomodoroRemainingSeconds = WORK_SESSION_SECONDS;
          this.notifySessionEnded("Break Complete!", "Ready to dive back into your focus task?");
        }
      }
    }

    // Persist every 10 seconds
    if (this.elapsedSeconds % 10 === 0) {
      this.saveToStorage();
    }
  };

  private notifySessionEnded(title: string, body: string) {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        const _notification = new Notification(title, { body, icon: "/favicon.ico" });
        void _notification;
      }
    }
  }

  toggleDrawer = (open?: boolean) => {
    this.isDrawerOpen = open !== undefined ? open : !this.isDrawerOpen;
  };

  addToToday = (issueId: string) => {
    if (!this.todayIssueIds.includes(issueId)) {
      this.todayIssueIds.push(issueId);
      this.saveToStorage();
    }
  };

  removeFromToday = (issueId: string) => {
    this.todayIssueIds = this.todayIssueIds.filter((id) => id !== issueId);
    if (this.activeIssueId === issueId) {
      this.resetTimer();
    }
    this.saveToStorage();
  };

  reorderToday = (sourceIndex: number, destinationIndex: number) => {
    if (
      sourceIndex < 0 ||
      sourceIndex >= this.todayIssueIds.length ||
      destinationIndex < 0 ||
      destinationIndex >= this.todayIssueIds.length
    ) {
      return;
    }
    const result = Array.from(this.todayIssueIds);
    const [removed] = result.splice(sourceIndex, 1);
    result.splice(destinationIndex, 0, removed);
    this.todayIssueIds = result;
    this.saveToStorage();
  };

  clearCompletedToday = (completedIssueIds: string[]) => {
    this.todayIssueIds = this.todayIssueIds.filter((id) => !completedIssueIds.includes(id));
    this.saveToStorage();
  };

  isInToday = (issueId: string): boolean => {
    return this.todayIssueIds.includes(issueId);
  };

  startTimer = (issueId: string, mode: TimerMode = "stopwatch") => {
    // If switching tasks, log or reset
    if (this.activeIssueId && this.activeIssueId !== issueId) {
      this.resetTimer();
    }

    this.activeIssueId = issueId;
    this.timerMode = mode;
    this.isPaused = false;
    if (mode === "pomodoro" && this.pomodoroRemainingSeconds <= 0) {
      this.pomodoroRemainingSeconds = WORK_SESSION_SECONDS;
      this.pomodoroStage = "work";
    }

    // Auto-add to today's queue if not present
    this.addToToday(issueId);
    this.saveToStorage();

    // Request notification permission if needed
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  };

  pauseTimer = () => {
    this.isPaused = true;
    this.saveToStorage();
  };

  resumeTimer = () => {
    if (this.activeIssueId) {
      this.isPaused = false;
      this.saveToStorage();
    }
  };

  stopTimer = async (workspaceSlug?: string, projectId?: string): Promise<number> => {
    const elapsedMinutes = Math.max(Math.round(this.elapsedSeconds / 60), 0);
    const currentActiveIssueId = this.activeIssueId;

    if (elapsedMinutes > 0 && currentActiveIssueId && workspaceSlug && projectId) {
      try {
        await focusService.logTime(workspaceSlug, projectId, currentActiveIssueId, elapsedMinutes);
      } catch (err) {
        console.warn("Failed to log focus time to backend API", err);
      }
    }

    runInAction(() => {
      this.resetTimer();
    });

    return elapsedMinutes;
  };

  resetTimer = () => {
    this.activeIssueId = null;
    this.elapsedSeconds = 0;
    this.pomodoroRemainingSeconds = WORK_SESSION_SECONDS;
    this.isPaused = true;
    this.pomodoroStage = "work";
    this.saveToStorage();
  };

  switchPomodoroStage = (stage?: PomodoroStage) => {
    if (stage) {
      this.pomodoroStage = stage;
    } else {
      this.pomodoroStage = this.pomodoroStage === "work" ? "break" : "work";
    }
    this.pomodoroRemainingSeconds = this.pomodoroStage === "work" ? WORK_SESSION_SECONDS : BREAK_SESSION_SECONDS;
    this.saveToStorage();
  };
}
