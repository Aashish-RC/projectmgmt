/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IPartialProject, IProject, TIssue } from "@plane/types";

export interface IMandatoryFieldRule {
  key: string;
  label: string;
  checkMissing: (issue: Partial<TIssue>) => boolean;
}

export const MANDATORY_FIELD_CONFIG: Record<string, { label: string; checkMissing: (issue: Partial<TIssue>) => boolean }> = {
  target_date: {
    label: "Target Date",
    checkMissing: (issue) => !issue.target_date,
  },
  due_date: {
    label: "Target Date",
    checkMissing: (issue) => !issue.target_date,
  },
  start_date: {
    label: "Start Date",
    checkMissing: (issue) => !issue.start_date,
  },
  priority: {
    label: "Priority",
    checkMissing: (issue) => !issue.priority || issue.priority === "none",
  },
  assignees: {
    label: "Assignees",
    checkMissing: (issue) => !issue.assignee_ids || issue.assignee_ids.length === 0,
  },
  assignee_ids: {
    label: "Assignees",
    checkMissing: (issue) => !issue.assignee_ids || issue.assignee_ids.length === 0,
  },
  estimate_point: {
    label: "Estimate / Points",
    checkMissing: (issue) => !issue.estimate_point && issue.point === undefined && issue.point === null,
  },
  estimate: {
    label: "Estimate / Points",
    checkMissing: (issue) => !issue.estimate_point && issue.point === undefined && issue.point === null,
  },
  module: {
    label: "Module",
    checkMissing: (issue) => !issue.module_ids || issue.module_ids.length === 0,
  },
  cycle: {
    label: "Cycle",
    checkMissing: (issue) => !issue.cycle_id,
  },
  description: {
    label: "Description",
    checkMissing: (issue) =>
      !issue.description_html ||
      issue.description_html.trim() === "" ||
      issue.description_html.trim() === "<p></p>",
  },
};

/**
 * Validates mandatory fields according to project governance policy.
 * Returns true if valid, false if a mandatory field is missing.
 * Shows a toast if a mandatory field is missing.
 */
export const checkMandatoryFieldsGuard = (
  project: IProject | IPartialProject | undefined | null,
  issueData: Partial<TIssue>,
  options?: {
    isCreation?: boolean;
    targetStateGroup?: string;
  }
): boolean => {
  if (!project) return true;
  const policy = project.complexity_policy ?? "bounded";
  if (policy === "open") return true;

  const mandatoryFields = project.mandatory_fields;
  if (!mandatoryFields || mandatoryFields.length === 0) return true;

  const isTerminal =
    options?.targetStateGroup === "completed" || options?.targetStateGroup === "cancelled";

  // Enforce on creation OR when transitioning to terminal state
  const shouldEnforce = Boolean(options?.isCreation || isTerminal);
  if (!shouldEnforce) return true;

  for (const field of mandatoryFields) {
    const config = MANDATORY_FIELD_CONFIG[field.toLowerCase().trim()];
    if (config && config.checkMissing(issueData)) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Required by project policy",
        message: `Please specify ${config.label} before proceeding.`,
      });
      return false;
    }
  }

  return true;
};
