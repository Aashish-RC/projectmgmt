/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type ComplexityTier = "minimal" | "standard" | "deep";

export interface IPersonaManifest {
  tier: ComplexityTier;
  label: string;
  description: string;
  targetAudience: string;
  navigation: {
    visibleItems: string[];
    defaultView: "kanban" | "list" | "timeline";
  };
  issueProperties: {
    visibleFields: string[];
    cardDensity: "compact_minimal" | "detailed_agile";
  };
  views: {
    enableGanttCriticalPath: boolean;
    enableWbsDisplay: boolean;
    enableOkrRollup: boolean;
    enableFocusDrawer: boolean;
  };
}

export const MINIMAL_PERSONA: IPersonaManifest = {
  tier: "minimal",
  label: "Minimal (Speed Flow)",
  description: "Distraction-free execution for individual contributors and high-velocity engineering squads.",
  targetAudience: "Individual contributors, developers, and agile squads seeking sub-50ms speed without clutter.",
  navigation: {
    visibleItems: ["issues", "pages"],
    defaultView: "kanban",
  },
  issueProperties: {
    visibleFields: ["state", "priority", "assignees"],
    cardDensity: "compact_minimal",
  },
  views: {
    enableGanttCriticalPath: false,
    enableWbsDisplay: false,
    enableOkrRollup: false,
    enableFocusDrawer: true,
  },
};

export const STANDARD_PERSONA: IPersonaManifest = {
  tier: "standard",
  label: "Standard (Collaborative)",
  description: "Balanced collaboration with sprint cycles, milestone modules, and flexible list/board views.",
  targetAudience: "Cross-functional product teams, engineering groups, and project coordinators.",
  navigation: {
    visibleItems: ["issues", "cycles", "modules", "views", "pages"],
    defaultView: "list",
  },
  issueProperties: {
    visibleFields: ["state", "priority", "assignees", "due_date", "labels", "estimate"],
    cardDensity: "detailed_agile",
  },
  views: {
    enableGanttCriticalPath: false,
    enableWbsDisplay: false,
    enableOkrRollup: false,
    enableFocusDrawer: true,
  },
};

export const DEEP_PERSONA: IPersonaManifest = {
  tier: "deep",
  label: "Deep (Agile & Enterprise)",
  description: "Enterprise project management with cascading Gantt schedules, WBS numbering, and strategic OKR rollups.",
  targetAudience: "Program Managers, PMO leaders, Enterprise Architects, and multi-team programs.",
  navigation: {
    visibleItems: ["issues", "cycles", "modules", "views", "pages", "goals", "analytics"],
    defaultView: "timeline",
  },
  issueProperties: {
    visibleFields: ["state", "priority", "assignees", "start_date", "due_date", "labels", "estimate", "module", "cycle", "wbs"],
    cardDensity: "detailed_agile",
  },
  views: {
    enableGanttCriticalPath: true,
    enableWbsDisplay: true,
    enableOkrRollup: true,
    enableFocusDrawer: true,
  },
};

export const PERSONA_MANIFESTS: Record<ComplexityTier, IPersonaManifest> = {
  minimal: MINIMAL_PERSONA,
  standard: STANDARD_PERSONA,
  deep: DEEP_PERSONA,
};
