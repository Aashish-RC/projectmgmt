/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { APIService } from "@/services/api.service";
import type { TIdea, TKeyResult, TObjective } from "@plane/types";

export class StrategicService extends APIService {
  constructor() {
    super("/api");
  }

  // Objectives
  async getObjectives(workspaceSlug: string, projectId: string): Promise<TObjective[]> {
    return this.get(`/workspaces/${workspaceSlug}/projects/${projectId}/objectives/`).then((res) => res?.data);
  }

  async getObjective(workspaceSlug: string, projectId: string, objectiveId: string): Promise<TObjective> {
    return this.get(`/workspaces/${workspaceSlug}/projects/${projectId}/objectives/${objectiveId}/`).then(
      (res) => res?.data
    );
  }

  async createObjective(workspaceSlug: string, projectId: string, data: Partial<TObjective>): Promise<TObjective> {
    return this.post(`/workspaces/${workspaceSlug}/projects/${projectId}/objectives/`, data).then((res) => res?.data);
  }

  async updateObjective(
    workspaceSlug: string,
    projectId: string,
    objectiveId: string,
    data: Partial<TObjective>
  ): Promise<TObjective> {
    return this.patch(`/workspaces/${workspaceSlug}/projects/${projectId}/objectives/${objectiveId}/`, data).then(
      (res) => res?.data
    );
  }

  async deleteObjective(workspaceSlug: string, projectId: string, objectiveId: string): Promise<any> {
    return this.delete(`/workspaces/${workspaceSlug}/projects/${projectId}/objectives/${objectiveId}/`).then(
      (res) => res?.data
    );
  }

  // Key Results
  async getKeyResults(workspaceSlug: string, projectId: string, objectiveId?: string): Promise<TKeyResult[]> {
    const params = objectiveId ? { params: { objective_id: objectiveId } } : {};
    return this.get(`/workspaces/${workspaceSlug}/projects/${projectId}/key-results/`, params).then((res) => res?.data);
  }

  async createKeyResult(workspaceSlug: string, projectId: string, data: Partial<TKeyResult>): Promise<TKeyResult> {
    return this.post(`/workspaces/${workspaceSlug}/projects/${projectId}/key-results/`, data).then((res) => res?.data);
  }

  async updateKeyResult(
    workspaceSlug: string,
    projectId: string,
    keyResultId: string,
    data: Partial<TKeyResult>
  ): Promise<TKeyResult> {
    return this.patch(`/workspaces/${workspaceSlug}/projects/${projectId}/key-results/${keyResultId}/`, data).then(
      (res) => res?.data
    );
  }

  async deleteKeyResult(workspaceSlug: string, projectId: string, keyResultId: string): Promise<any> {
    return this.delete(`/workspaces/${workspaceSlug}/projects/${projectId}/key-results/${keyResultId}/`).then(
      (res) => res?.data
    );
  }

  // Ideas
  async getIdeas(workspaceSlug: string, projectId: string): Promise<TIdea[]> {
    return this.get(`/workspaces/${workspaceSlug}/projects/${projectId}/ideas/`).then((res) => res?.data);
  }

  async createIdea(workspaceSlug: string, projectId: string, data: Partial<TIdea>): Promise<TIdea> {
    return this.post(`/workspaces/${workspaceSlug}/projects/${projectId}/ideas/`, data).then((res) => res?.data);
  }

  async updateIdea(workspaceSlug: string, projectId: string, ideaId: string, data: Partial<TIdea>): Promise<TIdea> {
    return this.patch(`/workspaces/${workspaceSlug}/projects/${projectId}/ideas/${ideaId}/`, data).then(
      (res) => res?.data
    );
  }

  async deleteIdea(workspaceSlug: string, projectId: string, ideaId: string): Promise<any> {
    return this.delete(`/workspaces/${workspaceSlug}/projects/${projectId}/ideas/${ideaId}/`).then((res) => res?.data);
  }

  async upvoteIdea(workspaceSlug: string, projectId: string, ideaId: string): Promise<TIdea> {
    return this.post(`/workspaces/${workspaceSlug}/projects/${projectId}/ideas/${ideaId}/upvote/`).then(
      (res) => res?.data
    );
  }

  async convertIdeaToIssue(
    workspaceSlug: string,
    projectId: string,
    ideaId: string
  ): Promise<{ idea: TIdea; issue_id: string }> {
    return this.post(`/workspaces/${workspaceSlug}/projects/${projectId}/ideas/${ideaId}/convert-to-issue/`).then(
      (res) => res?.data
    );
  }

  async convertIdeaToModule(
    workspaceSlug: string,
    projectId: string,
    ideaId: string
  ): Promise<{ idea: TIdea; module_id: string }> {
    return this.post(`/workspaces/${workspaceSlug}/projects/${projectId}/ideas/${ideaId}/convert-to-module/`).then(
      (res) => res?.data
    );
  }
}

export const strategicService = new StrategicService();
