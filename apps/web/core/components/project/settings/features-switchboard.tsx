/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import {
  Zap,
  GitBranch,
  Hash,
  CheckCircle2,
  Target,
  Clock,
  LayoutGrid,
  Layers,
  ShieldCheck,
  Check,
  Lock,
  Unlock,
  Calendar,
  Flag,
  Users,
  Award,
  FolderKanban,
  RotateCw,
  CheckSquare,
  Square,
} from "lucide-react";
// plane imports
import { setPromiseToast } from "@plane/propel/toast";
import type { IProject, TComplexityBaseline, TComplexityPolicy } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { PersonaPreviewCards } from "@/components/adaptive";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

interface SwitchboardFeature {
  id: string;
  property: keyof IProject;
  engine: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
}

const SWITCHBOARD_FEATURES: SwitchboardFeature[] = [
  {
    id: "speed_engine",
    property: "is_speed_engine_enabled",
    engine: "Huly",
    title: "Speed & Keyboard Flow Engine",
    description:
      "Sub-50ms instant dialogs, power keyboard shortcuts (C, K, D, Space), and optimistic UI synchronization.",
    icon: Zap,
    accentColor: "text-amber-500",
    badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    id: "cascading_gantt",
    property: "is_cascading_gantt_enabled",
    engine: "OpenProject",
    title: "Cascading Gantt & Critical Path",
    description:
      "Mathematical dependency constraints (FS, SS, FF, SF), automated cascading schedule shifts, and Critical Path highlighting.",
    icon: GitBranch,
    accentColor: "text-blue-500",
    badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    id: "wbs_numbering",
    property: "is_wbs_numbering_enabled",
    engine: "OpenProject",
    title: "Work Breakdown Structure (WBS)",
    description:
      "Hierarchical outline decimal numbering (e.g. 1.0, 1.1, 1.2.1) displayed across issues, subtasks, and Gantt charts.",
    icon: Hash,
    accentColor: "text-indigo-500",
    badgeBg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
  {
    id: "canonical_state",
    property: "is_canonical_state_enabled",
    engine: "Vikunja",
    title: "Universal 3-State Normalizer",
    description:
      "Normalizes all custom workflow states into three canonical primitives (Unstarted, In Progress, Completed) with recursive progress rollups.",
    icon: CheckCircle2,
    accentColor: "text-emerald-500",
    badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    id: "strategic_okr",
    property: "is_strategic_okr_enabled",
    engine: "Leantime",
    title: "Strategic Goals & OKRs",
    description:
      "Executive Objectives and Key Results directly connected to delivery Cycles and Modules with automated progress rollups.",
    icon: Target,
    accentColor: "text-rose-500",
    badgeBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  {
    id: "focus_timer",
    property: "is_focus_timer_enabled",
    engine: "Super Productivity",
    title: "Daily Focus & Pomodoro Timers",
    description:
      "Slide-out 'My Day' scratchpad (D shortcut), live MM:SS topbar stopwatch/Pomodoro timer, and auto work-logging.",
    icon: Clock,
    accentColor: "text-orange-500",
    badgeBg: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  {
    id: "tactile_kanban",
    property: "is_tactile_kanban_enabled",
    engine: "Planka",
    title: "Tactile Kanban & Clean Card Density",
    description:
      "Distraction-free clean card presentation mode, color sticker bars, and GPU-accelerated drag-and-drop feedback.",
    icon: LayoutGrid,
    accentColor: "text-purple-500",
    badgeBg: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
];

interface ComplexityTier {
  key: TComplexityBaseline;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  preset: Partial<IProject>;
}

const COMPLEXITY_TIERS: ComplexityTier[] = [
  {
    key: "minimal",
    title: "Minimal (Speed Flow)",
    subtitle: "Distraction-Free",
    description:
      "Focuses on rapid individual flow. Activates Huly keyboard speed, clean Planka Kanban, and Pomodoro timers without complex governance.",
    icon: Zap,
    preset: {
      default_complexity: "minimal",
      is_speed_engine_enabled: true,
      is_tactile_kanban_enabled: true,
      is_focus_timer_enabled: true,
      is_wbs_numbering_enabled: false,
      is_cascading_gantt_enabled: false,
      is_strategic_okr_enabled: false,
      is_canonical_state_enabled: true,
    },
  },
  {
    key: "standard",
    title: "Standard (Collaborative)",
    subtitle: "Balanced Delivery",
    description:
      "Recommended for teams. Balanced agile delivery with cycles, modules, strategic OKRs, cascading Gantt dependencies, and focus tools.",
    icon: Layers,
    preset: {
      default_complexity: "standard",
      is_speed_engine_enabled: true,
      is_tactile_kanban_enabled: true,
      is_focus_timer_enabled: true,
      is_wbs_numbering_enabled: true,
      is_cascading_gantt_enabled: true,
      is_strategic_okr_enabled: true,
      is_canonical_state_enabled: true,
    },
  },
  {
    key: "deep",
    title: "Deep (Agile/Enterprise)",
    subtitle: "Full Architecture",
    description:
      "Full enterprise depth: WBS decimal hierarchy, Critical Path analysis, Leantime OKRs + Idea validation sandbox, and canonical states.",
    icon: ShieldCheck,
    preset: {
      default_complexity: "deep",
      is_speed_engine_enabled: true,
      is_tactile_kanban_enabled: true,
      is_focus_timer_enabled: true,
      is_wbs_numbering_enabled: true,
      is_cascading_gantt_enabled: true,
      is_strategic_okr_enabled: true,
      is_canonical_state_enabled: true,
    },
  },
];

interface PolicyOption {
  key: TComplexityPolicy;
  title: string;
  badge?: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMPLEXITY_POLICIES: PolicyOption[] = [
  {
    key: "open",
    title: "Open",
    subtitle: "Complete Member Autonomy",
    description:
      "Members can freely choose their UI complexity level and switch between minimal, standard, and deep views.",
    icon: Unlock,
  },
  {
    key: "bounded",
    title: "Bounded",
    badge: "Recommended",
    subtitle: "Adaptive Layouts with Enforced Guardrails",
    description:
      "Members can adapt layouts and visual density, but mandatory organizational fields are strictly enforced.",
    icon: ShieldCheck,
  },
  {
    key: "locked",
    title: "Locked",
    subtitle: "Strict Project Standard",
    description: "All members use the strict project default tier. Only project admins can modify complexity settings.",
    icon: Lock,
  },
];

interface MandatoryFieldOption {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const MANDATORY_FIELD_OPTIONS: MandatoryFieldOption[] = [
  {
    key: "target_date",
    label: "Target Date",
    icon: Calendar,
    description: "Due date must be specified before work items can be completed.",
  },
  {
    key: "priority",
    label: "Priority",
    icon: Flag,
    description: "Urgent/High/Medium/Low priority must be selected.",
  },
  {
    key: "assignees",
    label: "Assignees",
    icon: Users,
    description: "At least one member must be assigned to the work item.",
  },
  {
    key: "estimate_point",
    label: "Estimate / Points",
    icon: Award,
    description: "Estimation points or sizing required for capacity planning.",
  },
  {
    key: "module",
    label: "Module",
    icon: FolderKanban,
    description: "Work item must be categorized under an active module.",
  },
  {
    key: "cycle",
    label: "Cycle",
    icon: RotateCw,
    description: "Work item must be scheduled within a cycle/sprint.",
  },
];

export const FeaturesSwitchboard: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, isAdmin } = props;
  const { getProjectById, updateProject } = useProject();
  const project = getProjectById(projectId);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  const currentComplexity: TComplexityBaseline = (project?.default_complexity as TComplexityBaseline) || "standard";
  const currentPolicy: TComplexityPolicy = (project?.complexity_policy as TComplexityPolicy) || "bounded";
  const mandatoryFields: string[] = (project?.mandatory_fields as string[]) || [];

  const handlePolicyChange = async (policy: TComplexityPolicy) => {
    if (!isAdmin || !workspaceSlug || !projectId) return;

    const updatePromise = updateProject(workspaceSlug, projectId, {
      complexity_policy: policy,
    });

    setPromiseToast(updatePromise, {
      loading: "Updating governance policy...",
      success: {
        title: "Policy Updated",
        message: () => `Project governance policy changed to ${policy.toUpperCase()}.`,
      },
      error: {
        title: "Error",
        message: () => "Failed to update governance policy. Please try again.",
      },
    });
  };

  const handleToggleMandatoryField = async (fieldKey: string) => {
    if (!isAdmin || !workspaceSlug || !projectId) return;

    const exists = mandatoryFields.includes(fieldKey);
    const newFields = exists ? mandatoryFields.filter((f) => f !== fieldKey) : [...mandatoryFields, fieldKey];

    const updatePromise = updateProject(workspaceSlug, projectId, {
      mandatory_fields: newFields,
    });

    setPromiseToast(updatePromise, {
      loading: exists ? `Removing ${fieldKey} requirement...` : `Enforcing ${fieldKey}...`,
      success: {
        title: exists ? "Field Optional" : "Field Mandatory",
        message: () => (exists ? `${fieldKey} is now optional.` : `${fieldKey} is now strictly required.`),
      },
      error: {
        title: "Error",
        message: () => "Failed to update mandatory fields.",
      },
    });
  };

  const handleToggle = async (property: keyof IProject, currentValue: boolean) => {
    if (!isAdmin || !workspaceSlug || !projectId) return;

    const newValue = !currentValue;
    const updatePromise = updateProject(workspaceSlug, projectId, {
      [property]: newValue,
    });

    setPromiseToast(updatePromise, {
      loading: "Updating engine switch...",
      success: {
        title: "Updated",
        message: () => "Engine switch preference saved successfully.",
      },
      error: {
        title: "Error",
        message: () => "Failed to update engine switch. Please try again.",
      },
    });
  };

  const handleApplyComplexity = async (tier: ComplexityTier) => {
    if (!isAdmin || !workspaceSlug || !projectId) return;

    setIsApplyingPreset(true);
    try {
      const updatePromise = updateProject(workspaceSlug, projectId, tier.preset);
      setPromiseToast(updatePromise, {
        loading: `Applying ${tier.title} preset...`,
        success: {
          title: "Preset Applied",
          message: () => `Project complexity set to ${tier.title}. All engine switches configured.`,
        },
        error: {
          title: "Error",
          message: () => "Failed to apply complexity preset.",
        },
      });
      await updatePromise;
    } finally {
      setIsApplyingPreset(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. Header & Baseline Complexity Selector */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary">Default Complexity Baseline & Adaptive Personas</h2>
          <p className="text-sm text-tertiary">
            Choose an operating baseline for this project. Adaptive personas configure default active navigation, visual
            card density, and engine switches to match your team’s operating rhythm.
          </p>
        </div>

        <PersonaPreviewCards
          selectedTier={currentComplexity}
          onSelectTier={(tierKey) => {
            const tierObj = COMPLEXITY_TIERS.find((t) => t.key === tierKey);
            if (tierObj) handleApplyComplexity(tierObj);
          }}
          disabled={!isAdmin || isApplyingPreset}
          policy={currentPolicy}
        />
      </div>

      {/* 2. Governance & Member Freedom */}
      <div className="border-border-100 flex flex-col gap-6 border-t pt-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-primary">Governance & Member Freedom</h2>
            <span className="bg-primary-500/10 text-primary-500 border-primary-500/20 rounded-full border px-2 py-0.5 text-[10px] font-semibold">
              Policy Matrix
            </span>
          </div>
          <p className="text-sm text-tertiary">
            Define permissions governing member complexity adaptation and enforce critical organizational fields across
            all complexity modes.
          </p>
        </div>

        {/* Complexity Policy Selector */}
        <div className="flex flex-col gap-3">
          <span className="text-xs tracking-wider font-semibold text-secondary uppercase">
            Complexity Governance Policy
          </span>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COMPLEXITY_POLICIES.map((policy) => {
              const isSelected = currentPolicy === policy.key;
              const Icon = policy.icon;
              return (
                <button
                  type="button"
                  key={policy.key}
                  onClick={() => handlePolicyChange(policy.key)}
                  disabled={!isAdmin}
                  className={cn(
                    "relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 text-left transition-all select-none",
                    isSelected
                      ? "border-primary-500 bg-primary-500/5 shadow-sm ring-primary-500/20 ring-1"
                      : "border-border-200 hover:border-border-300 bg-surface-1 hover:bg-surface-2",
                    !isAdmin && "cursor-not-allowed opacity-75"
                  )}
                >
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "rounded-lg p-1.5",
                            isSelected ? "bg-primary-500/10 text-primary-500" : "bg-surface-2 text-tertiary"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold text-primary">{policy.title}</span>
                        {policy.badge && (
                          <span className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold">
                            {policy.badge}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="bg-primary-500 flex h-5 w-5 items-center justify-center rounded-full text-white">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-secondary">{policy.subtitle}</span>
                    <p className="text-xs mt-1 leading-relaxed text-tertiary">{policy.description}</p>
                  </div>

                  <div className="border-border-100 mt-4 flex w-full items-center justify-between border-t pt-3">
                    <span className="tracking-wider text-[11px] font-medium text-placeholder uppercase">
                      {isSelected ? "Active Policy" : "Click to apply"}
                    </span>
                    <span className="text-xs text-primary-500 font-semibold">
                      {isSelected ? "Enforced" : "Select Policy"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mandatory Field Enforcer */}
        <div className="mt-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs tracking-wider font-semibold text-secondary uppercase">
                Mandatory Field Enforcer
              </span>
              <p className="text-xs text-tertiary">
                Selected fields must be non-empty upon work item creation or completion when in Bounded or Locked modes.
              </p>
            </div>
            <span className="text-xs font-medium text-tertiary">
              {mandatoryFields.length} of {MANDATORY_FIELD_OPTIONS.length} Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {MANDATORY_FIELD_OPTIONS.map((field) => {
              const isMandatory = mandatoryFields.includes(field.key);
              const Icon = field.icon;

              return (
                <button
                  type="button"
                  key={field.key}
                  onClick={() => handleToggleMandatoryField(field.key)}
                  disabled={!isAdmin}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all select-none",
                    isMandatory
                      ? "border-primary-500/50 bg-primary-500/5 shadow-xs"
                      : "border-border-200 hover:border-border-300 bg-surface-1 hover:bg-surface-2",
                    !isAdmin && "cursor-not-allowed opacity-75"
                  )}
                >
                  <div className="text-primary-500 mt-0.5 shrink-0">
                    {isMandatory ? (
                      <CheckSquare className="text-primary-500 fill-primary-500/20 h-4.5 w-4.5" />
                    ) : (
                      <Square className="h-4.5 w-4.5 text-placeholder" />
                    )}
                  </div>
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", isMandatory ? "text-primary-500" : "text-tertiary")} />
                      <span className={cn("text-xs font-semibold", isMandatory ? "text-primary" : "text-secondary")}>
                        {field.label}
                      </span>
                      {isMandatory && (
                        <span className="text-primary-500 tracking-wider ml-auto text-[10px] font-bold uppercase">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-snug text-tertiary">{field.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Enriched Engines Switchboard */}
      <div className="border-border-100 flex flex-col gap-4 border-t pt-6">
        <div>
          <h2 className="text-lg font-semibold text-primary">Enriched Engine Switchboard</h2>
          <p className="text-sm text-tertiary">
            Toggle any of the 6 specialized productivity engines on or off. Disabled engines will hide associated
            navigation tabs, widgets, and calculation overhead.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {SWITCHBOARD_FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isEnabled = Boolean(project?.[feature.property] ?? true);

            return (
              <div
                key={feature.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 transition-all",
                  isEnabled
                    ? "border-border-200 shadow-sm bg-surface-1"
                    : "border-border-100 bg-surface-1/40 opacity-75"
                )}
              >
                <div className="flex max-w-2xl items-start gap-3.5">
                  <div className={cn("mt-0.5 shrink-0 rounded-lg bg-surface-2 p-2", feature.accentColor)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{feature.title}</span>
                      <span
                        className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", feature.badgeBg)}
                      >
                        {feature.engine}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-tertiary">{feature.description}</p>
                  </div>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <span className="text-xs font-medium text-secondary">{isEnabled ? "Enabled" : "Disabled"}</span>
                  <ToggleSwitch
                    value={isEnabled}
                    onChange={() => handleToggle(feature.property, isEnabled)}
                    disabled={!isAdmin || isApplyingPreset}
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
