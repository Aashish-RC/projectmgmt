/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isEqual, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// components
import type {
  ChartDataType,
  IBlockUpdateDependencyData,
  IGanttBlock,
  TGanttViews,
  EGanttBlockType,
} from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";
import { currentViewDataWithView } from "@/components/gantt-chart/data";
import { computeCriticalPath } from "@/components/gantt-chart/helpers/critical-path";
import {
  getDateFromPositionOnGantt,
  getItemPositionWidth,
  getPositionFromDate,
} from "@/components/gantt-chart/views/helpers";
// helpers
// store
import type { RootStore } from "@/store/root.store";

// types
type BlockData = {
  id: string;
  name: string;
  sort_order: number | null;
  start_date?: string | undefined | null;
  target_date?: string | undefined | null;
  project_id?: string | undefined | null;
};

export interface IBaseTimelineStore {
  // observables
  currentView: TGanttViews;
  currentViewData: ChartDataType | undefined;
  activeBlockId: string | null;
  renderView: any;
  isDragging: boolean;
  isDependencyEnabled: boolean;
  showCriticalPath: boolean;
  //
  setBlockIds: (ids: string[]) => void;
  getBlockById: (blockId: string) => IGanttBlock;
  // computed functions
  getIsCurrentDependencyDragging: (blockId: string) => boolean;
  isBlockActive: (blockId: string) => boolean;
  criticalBlockIds: string[];
  isBlockOnCriticalPath: (blockId: string) => boolean;
  getDependenciesForBlock: (blockId: string) => { predecessors: string[]; successors: string[] };
  // actions
  updateCurrentView: (view: TGanttViews) => void;
  updateCurrentViewData: (data: ChartDataType | undefined) => void;
  updateActiveBlockId: (blockId: string | null) => void;
  updateRenderView: (data: any) => void;
  setShowCriticalPath: (show: boolean) => void;
  updateAllBlocksOnChartChangeWhileDragging: (addedWidth: number) => void;
  getUpdatedPositionAfterDrag: (
    id: string,
    shouldUpdateHalfBlock: boolean,
    ignoreDependencies?: boolean
  ) => IBlockUpdateDependencyData[];
  updateBlockPosition: (id: string, deltaLeft: number, deltaWidth: number, ignoreDependencies?: boolean) => void;
  getNumberOfDaysFromPosition: (position: number | undefined) => number | undefined;
  setIsDragging: (isDragging: boolean) => void;
  initGantt: () => void;

  getDateFromPositionOnGantt: (position: number, offsetDays: number) => Date | undefined;
  getPositionFromDateOnGantt: (date: string | Date, offSetWidth: number) => number | undefined;
}

export class BaseTimeLineStore implements IBaseTimelineStore {
  blocksMap: Record<string, IGanttBlock> = {};
  blockIds: string[] | undefined = undefined;

  isDragging: boolean = false;
  currentView: TGanttViews = "week";
  currentViewData: ChartDataType | undefined = undefined;
  activeBlockId: string | null = null;
  renderView: any = [];

  rootStore: RootStore;

  isDependencyEnabled = true;
  showCriticalPath: boolean = false;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      blocksMap: observable,
      blockIds: observable,
      isDragging: observable.ref,
      currentView: observable.ref,
      currentViewData: observable,
      activeBlockId: observable.ref,
      renderView: observable,
      showCriticalPath: observable.ref,
      // computed
      criticalBlockIds: computed,
      // actions
      setIsDragging: action,
      setBlockIds: action.bound,
      initGantt: action.bound,
      updateCurrentView: action.bound,
      updateCurrentViewData: action.bound,
      updateActiveBlockId: action.bound,
      updateRenderView: action.bound,
      setShowCriticalPath: action.bound,
    });

    this.initGantt();

    this.rootStore = _rootStore;
  }

  /**
   * Update Block Ids to derive blocks from
   * @param ids
   */
  setBlockIds = (ids: string[]) => {
    this.blockIds = ids;
  };

  /**
   * setIsDragging
   * @param isDragging
   */
  setIsDragging = (isDragging: boolean) => {
    runInAction(() => {
      this.isDragging = isDragging;
    });
  };

  /**
   * @description check if block is active
   * @param {string} blockId
   */
  isBlockActive = computedFn((blockId: string): boolean => this.activeBlockId === blockId);

  /**
   * @description update current view
   * @param {TGanttViews} view
   */
  updateCurrentView = (view: TGanttViews) => {
    this.currentView = view;
  };

  /**
   * @description update current view data
   * @param {ChartDataType | undefined} data
   */
  updateCurrentViewData = (data: ChartDataType | undefined) => {
    runInAction(() => {
      this.currentViewData = data;
    });
  };

  /**
   * @description update active block
   * @param {string | null} block
   */
  updateActiveBlockId = (blockId: string | null) => {
    this.activeBlockId = blockId;
  };

  /**
   * @description update render view
   * @param {any[]} data
   */
  updateRenderView = (data: any[]) => {
    this.renderView = data;
  };

  /**
   * @description initialize gantt chart with month view
   */
  initGantt = () => {
    const newCurrentViewData = currentViewDataWithView(this.currentView);

    runInAction(() => {
      this.currentViewData = newCurrentViewData;
      this.blocksMap = {};
      this.blockIds = undefined;
    });
  };

  /** Gets Block from Id */
  getBlockById = computedFn((blockId: string) => this.blocksMap[blockId]);

  /**
   * updates the BlocksMap from blockIds
   * @param getDataById
   * @returns
   */
  updateBlocks(getDataById: (id: string) => BlockData | undefined | null, type?: EGanttBlockType, index?: number) {
    if (!this.blockIds || !Array.isArray(this.blockIds) || this.isDragging) return true;

    const updatedBlockMaps: { path: string[]; value: any }[] = [];
    const newBlocks: IGanttBlock[] = [];

    // Loop through blockIds to generate blocks Data
    for (const blockId of this.blockIds) {
      const blockData = getDataById(blockId);
      if (!blockData) continue;

      const block: IGanttBlock = {
        data: blockData,
        id: blockData?.id,
        name: blockData.name,
        sort_order: blockData?.sort_order ?? undefined,
        start_date: blockData?.start_date ?? undefined,
        target_date: blockData?.target_date ?? undefined,
        meta: {
          type,
          index,
          project_id: blockData?.project_id,
        },
      };
      if (this.currentViewData && (this.currentViewData?.data?.startDate || this.currentViewData?.data?.dayWidth)) {
        block.position = getItemPositionWidth(this.currentViewData, block);
      }

      // create block updates if the block already exists, or push them to newBlocks
      if (this.blocksMap[blockId]) {
        for (const key of Object.keys(block)) {
          const currValue = this.blocksMap[blockId][key as keyof IGanttBlock];
          const nextValue = block[key as keyof IGanttBlock];
          if (!isEqual(currValue, nextValue)) {
            updatedBlockMaps.push({ path: [blockId, key], value: nextValue });
          }
        }
      } else {
        newBlocks.push(block);
      }
    }

    // update the store with the block updates
    runInAction(() => {
      for (const updatedBlock of updatedBlockMaps) {
        set(this.blocksMap, updatedBlock.path, updatedBlock.value);
      }

      for (const newBlock of newBlocks) {
        set(this.blocksMap, [newBlock.id], newBlock);
      }
    });
  }

  /**
   * returns number of days that the position pixels span across the timeline chart
   * @param position
   * @returns
   */
  getNumberOfDaysFromPosition = (position: number | undefined) => {
    if (!this.currentViewData || !position) return;

    return Math.round(position / this.currentViewData.data.dayWidth);
  };

  /**
   * returns position of the date on chart
   */
  getPositionFromDateOnGantt = computedFn((date: string | Date, offSetWidth: number) => {
    if (!this.currentViewData) return;

    return getPositionFromDate(this.currentViewData, date, offSetWidth);
  });

  /**
   * returns the date at which the position corresponds to on the timeline chart
   */
  getDateFromPositionOnGantt = computedFn((position: number, offsetDays: number) => {
    if (!this.currentViewData) return;

    return getDateFromPositionOnGantt(position, this.currentViewData, offsetDays);
  });

  /**
   * Adds width on Chart position change while the blocks are being dragged
   * @param addedWidth
   */
  updateAllBlocksOnChartChangeWhileDragging = action((addedWidth: number) => {
    if (!this.blockIds || !this.isDragging) return;

    runInAction(() => {
      this.blockIds?.forEach((blockId) => {
        const currBlock = this.blocksMap[blockId];

        if (!currBlock || !currBlock.position) return;

        currBlock.position.marginLeft += addedWidth;
      });
    });
  });

  /**
   * returns updates dates of blocks post drag.
   * @param id
   * @param shouldUpdateHalfBlock if is a half block then update the incomplete block only if this is true
   * @returns
   */
  setShowCriticalPath = (show: boolean) => {
    this.showCriticalPath = show;
  };

  get criticalBlockIds(): string[] {
    if (!this.blockIds || !this.showCriticalPath) return [];
    const criticalSet = computeCriticalPath(this.blockIds, this.blocksMap, this.getDependenciesForBlock);
    return Array.from(criticalSet);
  }

  isBlockOnCriticalPath = computedFn((blockId: string): boolean => {
    if (!this.showCriticalPath) return false;
    return this.criticalBlockIds.includes(blockId);
  });

  getDependenciesForBlock = (blockId: string): { predecessors: string[]; successors: string[] } => {
    const predecessors: string[] = [];
    const successors: string[] = [];

    // Check relations from issue store if available
    const issue = this.rootStore?.issue?.issues?.getIssueById(blockId);
    if (issue) {
      if (issue.issue_relation) {
        for (const rel of issue.issue_relation) {
          if (["finish_to_start", "successor", "blocking"].includes(rel.relation_type)) {
            successors.push(rel.id);
          } else if (["predecessor", "blocked_by"].includes(rel.relation_type)) {
            predecessors.push(rel.id);
          }
        }
      }
      if (issue.issue_related) {
        for (const rel of issue.issue_related) {
          if (["predecessor", "blocked_by"].includes(rel.relation_type)) {
            successors.push(rel.id);
          } else if (["finish_to_start", "successor", "blocking"].includes(rel.relation_type)) {
            predecessors.push(rel.id);
          }
        }
      }
    }

    // Check relationMap from issueDetail relation store if available
    const relationStore = this.rootStore?.issue?.issueDetail?.relation;
    if (relationStore) {
      const rels = relationStore.getRelationsByIssueId(blockId);
      if (rels) {
        if (rels.blocking) successors.push(...rels.blocking);
        if (rels.successor) successors.push(...rels.successor);
        if (rels.finish_to_start) successors.push(...rels.finish_to_start);
        if (rels.blocked_by) predecessors.push(...rels.blocked_by);
        if (rels.predecessor) predecessors.push(...rels.predecessor);
      }
    }

    return {
      predecessors: Array.from(new Set(predecessors)),
      successors: Array.from(new Set(successors)),
    };
  };

  /**
   * returns updates dates of blocks post drag with cascading dependency recalculation.
   * @param id
   * @param shouldUpdateHalfBlock if is a half block then update the incomplete block only if this is true
   * @returns
   */
  getUpdatedPositionAfterDrag = action((id: string, shouldUpdateHalfBlock: boolean) => {
    const currBlock = this.blocksMap[id];

    if (!currBlock?.position || !this.currentViewData) return [];

    const updatesMap = new Map<string, IBlockUpdateDependencyData>();

    const updatePayload: IBlockUpdateDependencyData = { id, meta: currBlock.meta };
    let newStartDate: string | undefined = undefined;
    let newTargetDate: string | undefined = undefined;

    // If shouldUpdateHalfBlock or the start date is available then update start date
    if (shouldUpdateHalfBlock || currBlock.start_date) {
      newStartDate = renderFormattedPayloadDate(
        getDateFromPositionOnGantt(currBlock.position.marginLeft, this.currentViewData)
      );
      updatePayload.start_date = newStartDate;
    }
    // If shouldUpdateHalfBlock or the target date is available then update target date
    if (shouldUpdateHalfBlock || currBlock.target_date) {
      newTargetDate = renderFormattedPayloadDate(
        getDateFromPositionOnGantt(currBlock.position.marginLeft + currBlock.position.width, this.currentViewData, -1)
      );
      updatePayload.target_date = newTargetDate;
    }

    updatesMap.set(id, updatePayload);

    // Cascading Gantt Dependency Engine
    // Detect all downstream successor tasks linked by FINISH_TO_START
    // If Task A's target_date is pushed past Task B's start_date,
    // automatically adjust Task B's start and target dates forward by matching delta,
    // and recursively cascade through all connected successors.
    const visited = new Set<string>([id]);
    const queue: { taskId: string; targetDate: string }[] = [];

    if (newTargetDate) {
      queue.push({ taskId: id, targetDate: newTargetDate });
    }

    while (queue.length > 0) {
      const { taskId, targetDate: predTargetStr } = queue.shift()!;
      const { successors } = this.getDependenciesForBlock(taskId);

      for (const succId of successors) {
        if (visited.has(succId)) continue;

        const succBlock = this.blocksMap[succId];
        if (!succBlock || !succBlock.start_date) continue;

        const succStartStr = succBlock.start_date;
        const succTargetStr = succBlock.target_date;

        const predTargetTime = new Date(predTargetStr).getTime();
        const succStartTime = new Date(succStartStr).getTime();

        if (predTargetTime > succStartTime) {
          visited.add(succId);

          const diffMs = predTargetTime - succStartTime;
          const deltaDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          const succStartDateObj = new Date(succStartStr);
          succStartDateObj.setDate(succStartDateObj.getDate() + deltaDays);
          const cascadedStart = renderFormattedPayloadDate(succStartDateObj);

          let cascadedTarget: string | undefined = undefined;
          if (succTargetStr) {
            const succTargetDateObj = new Date(succTargetStr);
            succTargetDateObj.setDate(succTargetDateObj.getDate() + deltaDays);
            cascadedTarget = renderFormattedPayloadDate(succTargetDateObj);
          }

          const succUpdate: IBlockUpdateDependencyData = {
            id: succId,
            meta: succBlock.meta,
            start_date: cascadedStart,
            target_date: cascadedTarget,
          };
          updatesMap.set(succId, succUpdate);

          // Update position in blocksMap so the chart bar visually shifts
          if (this.currentViewData) {
            succBlock.start_date = cascadedStart;
            succBlock.target_date = cascadedTarget;
            succBlock.position = getItemPositionWidth(this.currentViewData, succBlock);
          }

          if (cascadedTarget) {
            queue.push({ taskId: succId, targetDate: cascadedTarget });
          }
        }
      }
    }

    return Array.from(updatesMap.values());
  });

  /**
   * updates the block's position such as marginLeft and width while dragging
   * @param id
   * @param deltaLeft
   * @param deltaWidth
   * @returns
   */
  updateBlockPosition = action((id: string, deltaLeft: number, deltaWidth: number) => {
    const currBlock = this.blocksMap[id];

    if (!currBlock?.position) return;

    const newMarginLeft = currBlock.position.marginLeft + deltaLeft;
    const newWidth = currBlock.position.width + deltaWidth;

    runInAction(() => {
      set(this.blocksMap, [id, "position"], {
        marginLeft: newMarginLeft ?? currBlock.position?.marginLeft,
        width: newWidth ?? currBlock.position?.width,
      });
    });
  });

  // Dummy method to return if the current Block's dependency is being dragged
  getIsCurrentDependencyDragging = computedFn((_blockId: string) => false);
}
