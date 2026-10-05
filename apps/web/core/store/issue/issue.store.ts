/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { clone, set, update } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
// helpers
import { getCurrentDateTimeInISO } from "@plane/utils";
import { rootStore } from "@/lib/store-context";
// services
import { IssueService } from "@/services/issue";

export type IIssueStore = {
  // observables
  issuesMap: Record<string, TIssue>; // Record defines issue_id as key and TIssue as value
  issuesIdentifierMap: Record<string, string>; // Record defines issue_identifier as key and issue_id as value
  // actions
  getIssues(workspaceSlug: string, projectId: string, issueIds: string[]): Promise<TIssue[]>;
  addIssue(issues: TIssue[]): void;
  addIssueIdentifier(issueIdentifier: string, issueId: string): void;
  updateIssue(issueId: string, issue: Partial<TIssue>): void;
  removeIssue(issueId: string): void;
  // helper methods
  getIssueById(issueId: string): undefined | TIssue;
  getIssueIdByIdentifier(issueIdentifier: string): undefined | string;
  getIssuesByIds(issueIds: string[], type: "archived" | "un-archived"): TIssue[]; // Record defines issue_id as key and TIssue as value
  // optimistic mutation pipeline
  captureSnapshot(issueId: string): TIssue | undefined;
  rollbackSnapshot(issueId: string): void;
  clearSnapshot(issueId: string): void;
  optimisticPatchIssue(workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>): Promise<any>;
};

export class IssueStore implements IIssueStore {
  // observables
  issuesMap: { [issue_id: string]: TIssue } = {};
  issuesIdentifierMap: { [issue_identifier: string]: string } = {};
  // snapshot cache for optimistic mutation rollbacks
  issueSnapshots: Map<string, TIssue> = new Map();
  // service
  issueService;

  constructor() {
    makeObservable(this, {
      // observable
      issuesMap: observable,
      issuesIdentifierMap: observable,
      // actions
      addIssue: action,
      addIssueIdentifier: action,
      updateIssue: action,
      removeIssue: action,
      rollbackSnapshot: action,
      optimisticPatchIssue: action,
    });
    this.issueService = new IssueService();
  }

  // actions
  /**
   * @description This method will add issues to the issuesMap
   * @param {TIssue[]} issues
   * @returns {void}
   */
  addIssue = (issues: TIssue[]) => {
    if (issues && issues.length <= 0) return;
    runInAction(() => {
      issues.forEach((issue) => {
        // add issue identifier to the issuesIdentifierMap
        const projectIdentifier = rootStore.projectRoot.project.getProjectIdentifierById(issue?.project_id);
        const workItemSequenceId = issue?.sequence_id;
        const issueIdentifier = `${projectIdentifier}-${workItemSequenceId}`;
        set(this.issuesIdentifierMap, issueIdentifier, issue.id);

        if (!this.issuesMap[issue.id]) set(this.issuesMap, issue.id, issue);
        else update(this.issuesMap, issue.id, (prevIssue) => ({ ...prevIssue, ...issue }));
      });
    });
  };

  /**
   * @description This method will add issue_identifier to the issuesIdentifierMap
   * @param issueIdentifier
   * @param issueId
   * @returns {void}
   */
  addIssueIdentifier = (issueIdentifier: string, issueId: string) => {
    if (!issueIdentifier || !issueId) return;
    runInAction(() => {
      set(this.issuesIdentifierMap, issueIdentifier, issueId);
    });
  };

  getIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    const issues = await this.issueService.retrieveIssues(workspaceSlug, projectId, issueIds);

    runInAction(() => {
      issues.forEach((issue) => {
        if (!this.issuesMap[issue.id]) set(this.issuesMap, issue.id, issue);
      });
    });

    return issues;
  };

  /**
   * @description This method will update the issue in the issuesMap
   * @param {string} issueId
   * @param {Partial<TIssue>} issue
   * @returns {void}
   */
  updateIssue = (issueId: string, issue: Partial<TIssue>) => {
    if (!issue || !issueId || !this.issuesMap[issueId]) return;
    runInAction(() => {
      set(this.issuesMap, [issueId, "updated_at"], getCurrentDateTimeInISO());
      Object.keys(issue).forEach((key) => {
        set(this.issuesMap, [issueId, key], issue[key as keyof TIssue]);
      });
    });
  };

  /**
   * @description This method will remove the issue from the issuesMap
   * @param {string} issueId
   * @returns {void}
   */
  removeIssue = (issueId: string) => {
    if (!issueId || !this.issuesMap[issueId]) return;
    runInAction(() => {
      delete this.issuesMap[issueId];
    });
  };

  // helper methods
  /**
   * @description This method will return the issue from the issuesMap
   * @param {string} issueId
   * @returns {TIssue | undefined}
   */
  getIssueById = computedFn((issueId: string) => {
    if (!issueId || !this.issuesMap[issueId]) return undefined;
    return this.issuesMap[issueId];
  });

  /**
   * @description This method will return the issue_id from the issuesIdentifierMap
   * @param {string} issueIdentifier
   * @returns {string | undefined}
   */
  getIssueIdByIdentifier = computedFn((issueIdentifier: string) => {
    if (!issueIdentifier || !this.issuesIdentifierMap[issueIdentifier]) return undefined;
    return this.issuesIdentifierMap[issueIdentifier];
  });

  /**
   * @description This method will return the issues from the issuesMap
   * @param {string[]} issueIds
   * @param {boolean} archivedIssues
   * @returns {Record<string, TIssue> | undefined}
   */
  getIssuesByIds = computedFn((issueIds: string[], type: "archived" | "un-archived") => {
    if (!issueIds || issueIds.length <= 0) return [];
    const filteredIssues: TIssue[] = [];
    Object.values(issueIds).forEach((issueId) => {
      // if type is archived then check archived_at is not null
      // if type is un-archived then check archived_at is null
      const issue = this.issuesMap[issueId];
      if (issue && ((type === "archived" && issue.archived_at) || (type === "un-archived" && !issue?.archived_at))) {
        filteredIssues.push(issue);
      }
    });
    return filteredIssues;
  });

  // optimistic mutation pipeline
  /**
   * @description Capture snapshot of the issue state before mutation
   */
  captureSnapshot = (issueId: string): TIssue | undefined => {
    const current = this.issuesMap[issueId];
    if (!current) return undefined;
    const snapshot = clone(current);
    this.issueSnapshots.set(issueId, snapshot);
    return snapshot;
  };

  /**
   * @description Roll back issue in issuesMap to its captured snapshot
   */
  rollbackSnapshot = (issueId: string): void => {
    const snapshot = this.issueSnapshots.get(issueId);
    if (!snapshot) return;
    runInAction(() => {
      set(this.issuesMap, issueId, snapshot);
    });
    this.issueSnapshots.delete(issueId);
  };

  /**
   * @description Clear snapshot cache entry
   */
  clearSnapshot = (issueId: string): void => {
    this.issueSnapshots.delete(issueId);
  };

  /**
   * @description Optimistic mutation pipeline:
   * 1. Captures snapshot of issue
   * 2. Applies change instantly (<16ms) to issuesMap using runInAction
   * 3. Dispatches async network request in background
   * 4. On failure, catches error, rolls back issuesMap to snapshot, and displays toast notification
   */
  optimisticPatchIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>
  ): Promise<any> => {
    const snapshot = this.captureSnapshot(issueId);

    runInAction(() => {
      this.updateIssue(issueId, data);
    });

    try {
      const response = await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);
      this.clearSnapshot(issueId);
      return response;
    } catch (error: any) {
      if (snapshot) {
        this.rollbackSnapshot(issueId);
      }
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Update failed",
        message: error?.message || error?.detail || "Could not update work item. Reverted changes.",
      });
      throw error;
    }
  };
}
