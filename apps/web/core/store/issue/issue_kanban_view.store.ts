/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { DRAG_ALLOWED_GROUPS } from "@plane/constants";
// types
import type { TIssueGroupByOptions, TCardDisplayDensity } from "@plane/types";
// constants
// store
import type { IssueRootStore } from "./root.store";

export interface IIssueKanBanViewStore {
  kanBanToggle: {
    groupByHeaderMinMax: string[];
    subgroupByIssuesVisibility: string[];
  };
  isDragging: boolean;
  cardDisplayDensity: TCardDisplayDensity;
  // computed
  getCanUserDragDrop: (
    group_by: TIssueGroupByOptions | undefined,
    sub_group_by: TIssueGroupByOptions | undefined
  ) => boolean;
  canUserDragDropVertically: boolean;
  canUserDragDropHorizontally: boolean;
  // actions
  handleKanBanToggle: (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => void;
  setIsDragging: (isDragging: boolean) => void;
  setCardDisplayDensity: (density: TCardDisplayDensity) => void;
  toggleCardDisplayDensity: () => void;
}

export class IssueKanBanViewStore implements IIssueKanBanViewStore {
  kanBanToggle: {
    groupByHeaderMinMax: string[];
    subgroupByIssuesVisibility: string[];
  } = { groupByHeaderMinMax: [], subgroupByIssuesVisibility: [] };
  isDragging = false;
  cardDisplayDensity: TCardDisplayDensity = "detailed_agile";
  // root store
  rootStore;

  constructor(_rootStore: IssueRootStore) {
    makeObservable(this, {
      kanBanToggle: observable,
      isDragging: observable.ref,
      cardDisplayDensity: observable,
      // computed
      canUserDragDropVertically: computed,
      canUserDragDropHorizontally: computed,

      // actions
      handleKanBanToggle: action,
      setIsDragging: action.bound,
      setCardDisplayDensity: action.bound,
      toggleCardDisplayDensity: action.bound,
    });

    this.rootStore = _rootStore;
    this.loadDensityPreference();
  }

  loadDensityPreference = () => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("plane_kanban_card_density");
        if (saved === "compact_minimal" || saved === "detailed_agile") {
          this.cardDisplayDensity = saved;
        }
      } catch {
        // ignore
      }
    }
  };

  setCardDisplayDensity = (density: TCardDisplayDensity) => {
    this.cardDisplayDensity = density;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("plane_kanban_card_density", density);
      } catch {
        // ignore
      }
    }
  };

  toggleCardDisplayDensity = () => {
    this.setCardDisplayDensity(this.cardDisplayDensity === "compact_minimal" ? "detailed_agile" : "compact_minimal");
  };

  setIsDragging = (isDragging: boolean) => {
    this.isDragging = isDragging;
  };

  getCanUserDragDrop = computedFn(
    (group_by: TIssueGroupByOptions | undefined, sub_group_by: TIssueGroupByOptions | undefined) => {
      if (group_by && DRAG_ALLOWED_GROUPS.includes(group_by)) {
        if (!sub_group_by) return true;
        if (sub_group_by && DRAG_ALLOWED_GROUPS.includes(sub_group_by)) return true;
      }
      return false;
    }
  );

  get canUserDragDropVertically() {
    return false;
  }

  get canUserDragDropHorizontally() {
    return false;
  }

  handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    this.kanBanToggle = {
      ...this.kanBanToggle,
      [toggle]: this.kanBanToggle[toggle].includes(value)
        ? this.kanBanToggle[toggle].filter((v) => v !== value)
        : [...this.kanBanToggle[toggle], value],
    };
  };
}
