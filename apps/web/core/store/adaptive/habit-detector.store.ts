/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable } from "mobx";
import type { ComplexityTier } from "@plane/types";

const TELEMETRY_STORAGE_KEY = "plane_habit_telemetry_v1";

export interface IHabitTelemetry {
  keyboardShortcutCount: number;
  advancedFeatureUsageCount: number;
  hasPromptedForMinimal: boolean;
}

export interface IHabitDetectorStore {
  keyboardShortcutCount: number;
  advancedFeatureUsageCount: number;
  hasPromptedForMinimal: boolean;
  recordKeyboardShortcut: () => void;
  recordShortcutAction: (shortcutName?: string) => void;
  recordAdvancedFeatureUsage: (featureName?: string) => void;
  checkAdaptationHeuristic: (
    currentTier: ComplexityTier,
    onSuggestMinimal: () => void
  ) => boolean;
  dismissPrompt: () => void;
  resetTelemetry: () => void;
}

export class HabitDetectorStore implements IHabitDetectorStore {
  keyboardShortcutCount = 0;
  advancedFeatureUsageCount = 0;
  hasPromptedForMinimal = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(TELEMETRY_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<IHabitTelemetry>;
          this.keyboardShortcutCount = parsed.keyboardShortcutCount || 0;
          this.advancedFeatureUsageCount = parsed.advancedFeatureUsageCount || 0;
          this.hasPromptedForMinimal = Boolean(parsed.hasPromptedForMinimal);
        }
      } catch (_e) {
        // Ignore storage parsing error
      }
    }

    makeObservable(this, {
      keyboardShortcutCount: observable,
      advancedFeatureUsageCount: observable,
      hasPromptedForMinimal: observable,
      recordKeyboardShortcut: action,
      recordAdvancedFeatureUsage: action,
      dismissPrompt: action,
      resetTelemetry: action,
    });
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        const data: IHabitTelemetry = {
          keyboardShortcutCount: this.keyboardShortcutCount,
          advancedFeatureUsageCount: this.advancedFeatureUsageCount,
          hasPromptedForMinimal: this.hasPromptedForMinimal,
        };
        localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(data));
      } catch (_e) {
        // Ignore storage error
      }
    }
  }

  recordKeyboardShortcut = () => {
    this.keyboardShortcutCount += 1;
    this.persist();
  };

  recordShortcutAction = (_shortcutName?: string) => {
    this.recordKeyboardShortcut();
  };

  recordAdvancedFeatureUsage = (_featureName?: string) => {
    this.advancedFeatureUsageCount += 1;
    this.persist();
  };

  /**
   * Evaluates behavioral adaptation heuristic:
   * If a user is in "standard" mode, has performed 50+ shortcut actions, and 0 advanced feature interactions,
   * triggers the callback to prompt them about switching to Minimal (Speed Flow).
   * Returns true if prompt was triggered.
   */
  checkAdaptationHeuristic = (
    currentTier: ComplexityTier,
    onSuggestMinimal: () => void
  ): boolean => {
    if (this.hasPromptedForMinimal) return false;
    if (currentTier !== "standard") return false;

    if (this.keyboardShortcutCount >= 50 && this.advancedFeatureUsageCount === 0) {
      this.hasPromptedForMinimal = true;
      this.persist();
      onSuggestMinimal();
      return true;
    }

    return false;
  };

  dismissPrompt = () => {
    this.hasPromptedForMinimal = true;
    this.persist();
  };

  resetTelemetry = () => {
    this.keyboardShortcutCount = 0;
    this.advancedFeatureUsageCount = 0;
    this.hasPromptedForMinimal = false;
    this.persist();
  };
}
