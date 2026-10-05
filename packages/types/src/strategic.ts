/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type ObjectiveStatus = "on_track" | "at_risk" | "behind" | "completed";

export type TObjective = {
  id: string;
  workspace: string;
  project: string;
  title: string;
  description: string | null;
  start_date: string | null;
  target_date: string | null;
  status: ObjectiveStatus;
  owner: string | null;
  owner_details?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    display_name?: string;
  } | null;
  progress: number;
  key_results_count: number;
  key_results?: TKeyResult[];
  created_at: string;
  updated_at: string;
};

export type TKeyResult = {
  id: string;
  workspace: string;
  project: string;
  objective: string;
  title: string;
  initial_value: number;
  target_value: number;
  current_value: number;
  unit: string;
  auto_compute: boolean;
  progress_percentage: number;
  linked_cycles_count?: number;
  linked_modules_count?: number;
  created_at: string;
  updated_at: string;
};

export type IdeaStatus = "new" | "under_review" | "validated" | "rejected" | "converted";
export type IdeaMatrixQuadrant = "quick_wins" | "major_projects" | "fill_ins" | "thankless_tasks";

export type TIdea = {
  id: string;
  workspace: string;
  project: string;
  title: string;
  description_html: string;
  status: IdeaStatus;
  effort: number; // 1-5
  impact: number; // 1-5
  upvotes_count: number;
  converted_issue: string | null;
  converted_module: string | null;
  matrix_quadrant: IdeaMatrixQuadrant;
  created_at: string;
  updated_at: string;
};
