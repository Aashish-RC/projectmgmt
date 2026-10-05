/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Zap, Layers, GitBranch } from "lucide-react";
import type { ComplexityTier, IPersonaManifest } from "@plane/types";
import { MINIMAL_PERSONA, STANDARD_PERSONA, DEEP_PERSONA, PERSONA_MANIFESTS } from "@plane/types";

export { MINIMAL_PERSONA, STANDARD_PERSONA, DEEP_PERSONA, PERSONA_MANIFESTS };

export interface IPersonaVisualMetadata {
  tier: ComplexityTier;
  manifest: IPersonaManifest;
  headline: string;
  badge: string;
  badgeBg: string;
  accentColor: string;
  icon: React.ComponentType<{ className?: string }>;
  keyHighlights: string[];
  disabledHighlights: string[];
  previewElements: {
    sidebarCount: string;
    cardDensityText: string;
    defaultLayout: string;
  };
}

export const ADAPTIVE_PERSONA_VISUALS: Record<ComplexityTier, IPersonaVisualMetadata> = {
  minimal: {
    tier: "minimal",
    manifest: MINIMAL_PERSONA,
    headline: "Speed Flow (Linear / Trello style)",
    badge: "Speed & Flow",
    badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    accentColor: "text-amber-500",
    icon: Zap,
    keyHighlights: [
      "Sub-50ms instant dialogs & shortcuts",
      "Planka tactile minimal card density",
      "Daily Focus & Pomodoro scratchpad",
      "Distraction-free issue create modal",
    ],
    disabledHighlights: [
      "No cycle / sprint overhead",
      "No complex Gantt dependencies",
      "Hidden non-essential sidebar tabs",
    ],
    previewElements: {
      sidebarCount: "2 Active Items (Issues, Pages)",
      cardDensityText: "Compact Minimal (State + Title)",
      defaultLayout: "Tactile Kanban Board",
    },
  },
  standard: {
    tier: "standard",
    manifest: STANDARD_PERSONA,
    headline: "Collaborative (Asana / Monday style)",
    badge: "Collaborative Default",
    badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    accentColor: "text-blue-500",
    icon: Layers,
    keyHighlights: [
      "Sprint Cycles & Milestone Modules",
      "Flexible List, Kanban & Calendar views",
      "Universal 3-State category normalizer",
      "Multi-assignee & label filters",
    ],
    disabledHighlights: ["Critical path calculation disabled", "WBS numbering hidden by default"],
    previewElements: {
      sidebarCount: "5 Active Items (Cycles, Modules, etc.)",
      cardDensityText: "Detailed Agile (Chips + Estimates)",
      defaultLayout: "Interactive List & Board",
    },
  },
  deep: {
    tier: "deep",
    manifest: DEEP_PERSONA,
    headline: "Agile & Enterprise (Jira / OpenProject style)",
    badge: "Enterprise Agile",
    badgeBg: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    accentColor: "text-purple-500",
    icon: GitBranch,
    keyHighlights: [
      "Cascading Gantt & Critical Path Analysis",
      "Work Breakdown Structure (WBS) numbering",
      "Leantime Strategic OKRs & Idea Sandbox",
      "Strict Mandatory Fields governance",
    ],
    disabledHighlights: [],
    previewElements: {
      sidebarCount: "7+ Active Items (OKRs, Analytics, etc.)",
      cardDensityText: "Deep Enterprise (Full Meta & WBS)",
      defaultLayout: "Enterprise Timeline / Gantt",
    },
  },
};
