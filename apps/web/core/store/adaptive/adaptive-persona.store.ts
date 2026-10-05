/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable } from "mobx";
import type { ComplexityTier, IPersonaManifest, IProject, IPartialProject } from "@plane/types";
import { PERSONA_MANIFESTS, STANDARD_PERSONA } from "@plane/types";
import { canUserToggleComplexity } from "@/store/project";
import type { CoreRootStore } from "../root.store";
import { HabitDetectorStore, type IHabitDetectorStore } from "./habit-detector.store";

const STORAGE_KEY = "plane_user_adaptive_persona_tier";

export interface IAdaptivePersonaStore {
  currentTier: ComplexityTier | null;
  activeManifest: IPersonaManifest;
  habitDetector: IHabitDetectorStore;
  getEffectiveTier: (project?: IProject | IPartialProject | null) => ComplexityTier;
  getManifestForProject: (project?: IProject | IPartialProject | null) => IPersonaManifest;
  setTier: (
    tier: ComplexityTier,
    project?: IProject | IPartialProject | null,
    userRole?: number | string | null
  ) => boolean;
  isFieldVisible: (fieldName: string, project?: IProject | IPartialProject | null) => boolean;
  isNavigationVisible: (navKey: string, project?: IProject | IPartialProject | null) => boolean;
  isFeatureAllowed: (featureKey: string, project?: IProject | IPartialProject | null) => boolean;
  resetToDefault: (project?: IProject | IPartialProject | null) => void;
}

export class AdaptivePersonaStore implements IAdaptivePersonaStore {
  currentTier: ComplexityTier | null = null;
  habitDetector: IHabitDetectorStore;
  rootStore: CoreRootStore;

  constructor(rootStore: CoreRootStore) {
    this.rootStore = rootStore;
    this.habitDetector = new HabitDetectorStore();

    // Load initial tier from local storage if available in browser
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as ComplexityTier | null;
        if (stored && (stored === "minimal" || stored === "standard" || stored === "deep")) {
          this.currentTier = stored;
        }
      } catch (_e) {
        // Fallback silently if localStorage is restricted
      }
    }

    makeObservable(this, {
      currentTier: observable,
      activeManifest: computed,
      setTier: action,
      resetToDefault: action,
    });
  }

  /**
   * Resolves the effective complexity tier considering:
   * 1. Project policy: If "locked", project.default_complexity strictly overrides member preference.
   * 2. Otherwise: Member's personal preferred currentTier (or project default_complexity if unset).
   */
  getEffectiveTier = (project?: IProject | IPartialProject | null): ComplexityTier => {
    if (!project) return this.currentTier ?? "standard";

    const policy = project.complexity_policy ?? "bounded";
    if (policy === "locked") {
      return (project.default_complexity as ComplexityTier) || "standard";
    }

    return this.currentTier ?? (project.default_complexity as ComplexityTier) ?? "standard";
  };

  /**
   * Computes the active manifest for the current general context.
   */
  get activeManifest(): IPersonaManifest {
    return (this.currentTier && PERSONA_MANIFESTS[this.currentTier]) || STANDARD_PERSONA;
  }

  /**
   * Computes the manifest for a specific project context taking into account policy lock.
   */
  getManifestForProject = (project?: IProject | IPartialProject | null): IPersonaManifest => {
    const tier = this.getEffectiveTier(project);
    return PERSONA_MANIFESTS[tier] || STANDARD_PERSONA;
  };

  /**
   * Sets the user's preferred complexity tier.
   * Validates against project governance policy and user permissions.
   */
  setTier = (
    tier: ComplexityTier,
    project?: IProject | IPartialProject | null,
    userRole?: number | string | null
  ): boolean => {
    if (project && !canUserToggleComplexity(project, userRole)) {
      return false;
    }

    this.currentTier = tier;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, tier);
      } catch (_e) {
        // Ignore storage error
      }
    }
    return true;
  };

  /**
   * Clears the user's preference so the current project's default applies.
   */
  resetToDefault = (_project?: IProject | IPartialProject | null): void => {
    this.currentTier = null;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_e) {
        // Ignore
      }
    }
  };

  /**
   * Determines if an issue property/field is visible in the current or project persona.
   * IMPORTANT: If a field is specified in project.mandatory_fields, it is ALWAYS visible
   * regardless of the persona manifest.
   */
  isFieldVisible = (fieldName: string, project?: IProject | IPartialProject | null): boolean => {
    const rawKey = fieldName.toLowerCase().trim();
    const candidateKeys = [rawKey];

    // Canonical alias mappings
    if (rawKey === "target_date" || rawKey === "due_date") candidateKeys.push("target_date", "due_date");
    if (rawKey === "cycle_id" || rawKey === "cycle") candidateKeys.push("cycle_id", "cycle");
    if (rawKey === "module_ids" || rawKey === "module" || rawKey === "modules")
      candidateKeys.push("module_ids", "module", "modules");
    if (rawKey === "estimate_point" || rawKey === "estimate") candidateKeys.push("estimate_point", "estimate");
    if (rawKey === "label_ids" || rawKey === "labels" || rawKey === "label")
      candidateKeys.push("label_ids", "labels", "label");
    if (rawKey === "assignee_ids" || rawKey === "assignees" || rawKey === "assignee")
      candidateKeys.push("assignee_ids", "assignees", "assignee");
    if (rawKey === "state_id" || rawKey === "state") candidateKeys.push("state_id", "state");
    if (rawKey === "parent_id" || rawKey === "parent") candidateKeys.push("parent_id", "parent");

    // 1. Mandatory organizational fields are ALWAYS visible
    if (project?.mandatory_fields && project.mandatory_fields.length > 0) {
      const isMandatory = project.mandatory_fields.some((f) => candidateKeys.includes(f.toLowerCase().trim()));
      if (isMandatory) return true;
    }

    // 2. Otherwise check manifest rules
    const manifest = this.getManifestForProject(project);
    return candidateKeys.some((k) => manifest.issueProperties.visibleFields.includes(k));
  };

  /**
   * Determines if a navigation item is visible under the persona and engine switches.
   */
  isNavigationVisible = (navKey: string, project?: IProject | IPartialProject | null): boolean => {
    const rawKey = navKey.toLowerCase().trim();
    const candidateKeys = [rawKey];
    if (rawKey === "work_items" || rawKey === "issues") {
      candidateKeys.push("work_items", "issues");
    }

    // Engine switch overrides
    if ((rawKey === "goals" || rawKey === "okrs") && project && project.is_strategic_okr_enabled === false) {
      return false;
    }
    if (rawKey === "gantt" && project && project.is_cascading_gantt_enabled === false) {
      return false;
    }

    const manifest = this.getManifestForProject(project);
    return candidateKeys.some((k) => manifest.navigation.visibleItems.includes(k));
  };

  /**
   * Determines if an enriched view/engine feature is enabled by the persona manifest.
   */
  isFeatureAllowed = (featureKey: string, project?: IProject | IPartialProject | null): boolean => {
    const manifest = this.getManifestForProject(project);

    switch (featureKey) {
      case "gantt_critical_path":
        return manifest.views.enableGanttCriticalPath && (project?.is_cascading_gantt_enabled ?? true);
      case "wbs_display":
        return manifest.views.enableWbsDisplay && (project?.is_wbs_numbering_enabled ?? true);
      case "okr_rollup":
        return manifest.views.enableOkrRollup && (project?.is_strategic_okr_enabled ?? true);
      case "focus_drawer":
        return manifest.views.enableFocusDrawer && (project?.is_focus_timer_enabled ?? true);
      default:
        return true;
    }
  };
}
