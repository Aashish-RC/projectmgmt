/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { IdeaMatrixQuadrant, TIdea, TKeyResult, TObjective } from "@plane/types";
import { strategicService } from "@/services/strategic.service";
import type { RootStore } from "@/store/root.store";

export interface IOkrStore {
  // Observables
  objectiveMap: Record<string, TObjective>;
  keyResultMap: Record<string, TKeyResult>;
  ideaMap: Record<string, TIdea>;
  loader: Record<string, boolean>;

  // Computed / Accessors
  getObjectiveById: (id: string | null | undefined) => TObjective | undefined;
  getProjectObjectives: (projectId: string | null | undefined) => TObjective[];
  getKeyResultById: (id: string | null | undefined) => TKeyResult | undefined;
  getKeyResultsByObjectiveId: (objectiveId: string | null | undefined) => TKeyResult[];
  getIdeaById: (id: string | null | undefined) => TIdea | undefined;
  getProjectIdeas: (projectId: string | null | undefined) => TIdea[];
  getIdeasByQuadrant: (projectId: string | null | undefined, quadrant: IdeaMatrixQuadrant) => TIdea[];

  // Objectives Actions
  fetchObjectives: (workspaceSlug: string, projectId: string) => Promise<TObjective[]>;
  createObjective: (workspaceSlug: string, projectId: string, data: Partial<TObjective>) => Promise<TObjective>;
  updateObjective: (
    workspaceSlug: string,
    projectId: string,
    objectiveId: string,
    data: Partial<TObjective>
  ) => Promise<TObjective>;
  deleteObjective: (workspaceSlug: string, projectId: string, objectiveId: string) => Promise<void>;

  // Key Results Actions
  fetchKeyResults: (workspaceSlug: string, projectId: string, objectiveId?: string) => Promise<TKeyResult[]>;
  createKeyResult: (workspaceSlug: string, projectId: string, data: Partial<TKeyResult>) => Promise<TKeyResult>;
  updateKeyResult: (
    workspaceSlug: string,
    projectId: string,
    keyResultId: string,
    data: Partial<TKeyResult>
  ) => Promise<TKeyResult>;
  deleteKeyResult: (workspaceSlug: string, projectId: string, keyResultId: string) => Promise<void>;

  // Ideas Actions
  fetchIdeas: (workspaceSlug: string, projectId: string) => Promise<TIdea[]>;
  createIdea: (workspaceSlug: string, projectId: string, data: Partial<TIdea>) => Promise<TIdea>;
  updateIdea: (workspaceSlug: string, projectId: string, ideaId: string, data: Partial<TIdea>) => Promise<TIdea>;
  deleteIdea: (workspaceSlug: string, projectId: string, ideaId: string) => Promise<void>;
  upvoteIdea: (workspaceSlug: string, projectId: string, ideaId: string) => Promise<TIdea>;
  convertIdeaToIssue: (
    workspaceSlug: string,
    projectId: string,
    ideaId: string
  ) => Promise<{ idea: TIdea; issue_id: string }>;
  convertIdeaToModule: (
    workspaceSlug: string,
    projectId: string,
    ideaId: string
  ) => Promise<{ idea: TIdea; module_id: string }>;
}

export class OkrStore implements IOkrStore {
  objectiveMap: Record<string, TObjective> = {};
  keyResultMap: Record<string, TKeyResult> = {};
  ideaMap: Record<string, TIdea> = {};
  loader: Record<string, boolean> = {};

  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      objectiveMap: observable,
      keyResultMap: observable,
      ideaMap: observable,
      loader: observable,
      fetchObjectives: action,
      createObjective: action,
      updateObjective: action,
      deleteObjective: action,
      fetchKeyResults: action,
      createKeyResult: action,
      updateKeyResult: action,
      deleteKeyResult: action,
      fetchIdeas: action,
      createIdea: action,
      updateIdea: action,
      deleteIdea: action,
      upvoteIdea: action,
      convertIdeaToIssue: action,
      convertIdeaToModule: action,
    });
    this.rootStore = rootStore;
  }

  getObjectiveById = computedFn((id: string | null | undefined): TObjective | undefined => {
    if (!id) return undefined;
    return this.objectiveMap[id];
  });

  getProjectObjectives = computedFn((projectId: string | null | undefined): TObjective[] => {
    if (!projectId) return [];
    return Object.values(this.objectiveMap).filter((obj) => obj.project === projectId);
  });

  getKeyResultById = computedFn((id: string | null | undefined): TKeyResult | undefined => {
    if (!id) return undefined;
    return this.keyResultMap[id];
  });

  getKeyResultsByObjectiveId = computedFn((objectiveId: string | null | undefined): TKeyResult[] => {
    if (!objectiveId) return [];
    return Object.values(this.keyResultMap).filter((kr) => kr.objective === objectiveId);
  });

  getIdeaById = computedFn((id: string | null | undefined): TIdea | undefined => {
    if (!id) return undefined;
    return this.ideaMap[id];
  });

  getProjectIdeas = computedFn((projectId: string | null | undefined): TIdea[] => {
    if (!projectId) return [];
    return Object.values(this.ideaMap).filter((idea) => idea.project === projectId);
  });

  getIdeasByQuadrant = computedFn((projectId: string | null | undefined, quadrant: IdeaMatrixQuadrant): TIdea[] => {
    if (!projectId) return [];
    return this.getProjectIdeas(projectId).filter((idea) => idea.matrix_quadrant === quadrant);
  });

  // Objective Methods
  fetchObjectives = async (workspaceSlug: string, projectId: string): Promise<TObjective[]> => {
    this.loader[`objectives_${projectId}`] = true;
    try {
      const response = await strategicService.getObjectives(workspaceSlug, projectId);
      runInAction(() => {
        response.forEach((obj) => {
          this.objectiveMap[obj.id] = obj;
          if (obj.key_results) {
            obj.key_results.forEach((kr) => {
              this.keyResultMap[kr.id] = kr;
            });
          }
        });
      });
      return response;
    } finally {
      runInAction(() => {
        this.loader[`objectives_${projectId}`] = false;
      });
    }
  };

  createObjective = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TObjective>
  ): Promise<TObjective> => {
    const response = await strategicService.createObjective(workspaceSlug, projectId, data);
    runInAction(() => {
      this.objectiveMap[response.id] = response;
    });
    return response;
  };

  updateObjective = async (
    workspaceSlug: string,
    projectId: string,
    objectiveId: string,
    data: Partial<TObjective>
  ): Promise<TObjective> => {
    const response = await strategicService.updateObjective(workspaceSlug, projectId, objectiveId, data);
    runInAction(() => {
      this.objectiveMap[response.id] = {
        ...this.objectiveMap[response.id],
        ...response,
      };
    });
    return response;
  };

  deleteObjective = async (workspaceSlug: string, projectId: string, objectiveId: string): Promise<void> => {
    await strategicService.deleteObjective(workspaceSlug, projectId, objectiveId);
    runInAction(() => {
      delete this.objectiveMap[objectiveId];
      // remove associated key results
      Object.keys(this.keyResultMap).forEach((krId) => {
        if (this.keyResultMap[krId]?.objective === objectiveId) {
          delete this.keyResultMap[krId];
        }
      });
    });
  };

  // Key Result Methods
  fetchKeyResults = async (workspaceSlug: string, projectId: string, objectiveId?: string): Promise<TKeyResult[]> => {
    const response = await strategicService.getKeyResults(workspaceSlug, projectId, objectiveId);
    runInAction(() => {
      response.forEach((kr) => {
        this.keyResultMap[kr.id] = kr;
      });
    });
    return response;
  };

  createKeyResult = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TKeyResult>
  ): Promise<TKeyResult> => {
    const response = await strategicService.createKeyResult(workspaceSlug, projectId, data);
    runInAction(() => {
      this.keyResultMap[response.id] = response;
      if (response.objective && this.objectiveMap[response.objective]) {
        const obj = this.objectiveMap[response.objective];
        obj.key_results_count = (obj.key_results_count || 0) + 1;
      }
    });
    return response;
  };

  updateKeyResult = async (
    workspaceSlug: string,
    projectId: string,
    keyResultId: string,
    data: Partial<TKeyResult>
  ): Promise<TKeyResult> => {
    const response = await strategicService.updateKeyResult(workspaceSlug, projectId, keyResultId, data);
    runInAction(() => {
      this.keyResultMap[response.id] = {
        ...this.keyResultMap[response.id],
        ...response,
      };
    });
    return response;
  };

  deleteKeyResult = async (workspaceSlug: string, projectId: string, keyResultId: string): Promise<void> => {
    const objectiveId = this.keyResultMap[keyResultId]?.objective;
    await strategicService.deleteKeyResult(workspaceSlug, projectId, keyResultId);
    runInAction(() => {
      delete this.keyResultMap[keyResultId];
      if (objectiveId && this.objectiveMap[objectiveId]) {
        const obj = this.objectiveMap[objectiveId];
        obj.key_results_count = Math.max((obj.key_results_count || 1) - 1, 0);
      }
    });
  };

  // Ideas Methods
  fetchIdeas = async (workspaceSlug: string, projectId: string): Promise<TIdea[]> => {
    this.loader[`ideas_${projectId}`] = true;
    try {
      const response = await strategicService.getIdeas(workspaceSlug, projectId);
      runInAction(() => {
        response.forEach((idea) => {
          this.ideaMap[idea.id] = idea;
        });
      });
      return response;
    } finally {
      runInAction(() => {
        this.loader[`ideas_${projectId}`] = false;
      });
    }
  };

  createIdea = async (workspaceSlug: string, projectId: string, data: Partial<TIdea>): Promise<TIdea> => {
    const response = await strategicService.createIdea(workspaceSlug, projectId, data);
    runInAction(() => {
      this.ideaMap[response.id] = response;
    });
    return response;
  };

  updateIdea = async (
    workspaceSlug: string,
    projectId: string,
    ideaId: string,
    data: Partial<TIdea>
  ): Promise<TIdea> => {
    const response = await strategicService.updateIdea(workspaceSlug, projectId, ideaId, data);
    runInAction(() => {
      this.ideaMap[response.id] = {
        ...this.ideaMap[response.id],
        ...response,
      };
    });
    return response;
  };

  deleteIdea = async (workspaceSlug: string, projectId: string, ideaId: string): Promise<void> => {
    await strategicService.deleteIdea(workspaceSlug, projectId, ideaId);
    runInAction(() => {
      delete this.ideaMap[ideaId];
    });
  };

  upvoteIdea = async (workspaceSlug: string, projectId: string, ideaId: string): Promise<TIdea> => {
    const response = await strategicService.upvoteIdea(workspaceSlug, projectId, ideaId);
    runInAction(() => {
      this.ideaMap[response.id] = response;
    });
    return response;
  };

  convertIdeaToIssue = async (
    workspaceSlug: string,
    projectId: string,
    ideaId: string
  ): Promise<{ idea: TIdea; issue_id: string }> => {
    const response = await strategicService.convertIdeaToIssue(workspaceSlug, projectId, ideaId);
    runInAction(() => {
      if (response.idea) {
        this.ideaMap[response.idea.id] = response.idea;
      }
    });
    return response;
  };

  convertIdeaToModule = async (
    workspaceSlug: string,
    projectId: string,
    ideaId: string
  ): Promise<{ idea: TIdea; module_id: string }> => {
    const response = await strategicService.convertIdeaToModule(workspaceSlug, projectId, ideaId);
    runInAction(() => {
      if (response.idea) {
        this.ideaMap[response.idea.id] = response.idea;
      }
    });
    return response;
  };
}
