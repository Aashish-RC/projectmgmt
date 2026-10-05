/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { APIService } from "@/services/api.service";
import type { TIssueTimeLog } from "@plane/types";

export class FocusService extends APIService {
  constructor() {
    super("/api");
  }

  async getTimeLogs(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueTimeLog[]> {
    return this.get(`/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-logs/`).then(
      (res) => res?.data
    );
  }

  async logTime(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    durationMinutes: number,
    notes?: string
  ): Promise<TIssueTimeLog> {
    return this.post(`/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-logs/`, {
      duration_minutes: durationMinutes,
      notes: notes || `Recorded focus session (${durationMinutes} min)`,
    }).then((res) => res?.data);
  }
}

export const focusService = new FocusService();
