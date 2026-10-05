/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IGanttBlock } from "@plane/types";

export interface ICriticalPathNode {
  id: string;
  duration: number; // in days
  es: number; // early start
  ef: number; // early finish
  ls: number; // late start
  lf: number; // late finish
  slack: number;
  predecessors: string[];
  successors: string[];
}

export type TDependencyFetcher = (id: string) => {
  predecessors: string[];
  successors: string[];
};

/**
 * Computes Critical Path using CPM Forward and Backward pass algorithm.
 * Identifies the sequence of tasks with zero total float/slack that determines project duration.
 */
export const computeCriticalPath = (
  blockIds: string[],
  blocksMap: Record<string, IGanttBlock>,
  getDependencies: TDependencyFetcher
): Set<string> => {
  const criticalIds = new Set<string>();
  if (!blockIds || blockIds.length === 0) return criticalIds;

  // Filter blocks that have at least some date information
  const validBlocks = blockIds
    .map((id) => blocksMap[id])
    .filter((b): b is IGanttBlock => !!b && (!!b.start_date || !!b.target_date));

  if (validBlocks.length === 0) return criticalIds;

  const validNodeIds = new Set(validBlocks.map((block) => block.id));
  const nodes: Map<string, ICriticalPathNode> = new Map();

  for (const block of validBlocks) {
    const start = block.start_date ? new Date(block.start_date).getTime() : new Date().getTime();
    const target = block.target_date ? new Date(block.target_date).getTime() : start;
    const durationDays = Math.max(1, Math.round(Math.abs(target - start) / (1000 * 60 * 60 * 24)) + 1);

    const deps = getDependencies(block.id);
    const validPreds = deps.predecessors.filter((pId) => validNodeIds.has(pId));
    const validSuccs = deps.successors.filter((sId) => validNodeIds.has(sId));

    nodes.set(block.id, {
      id: block.id,
      duration: durationDays,
      es: 0,
      ef: durationDays,
      ls: Infinity,
      lf: Infinity,
      slack: 0,
      predecessors: validPreds,
      successors: validSuccs,
    });
  }

  // Check if any dependencies exist at all
  let hasAnyDependency = false;
  for (const node of nodes.values()) {
    if (node.predecessors.length > 0 || node.successors.length > 0) {
      hasAnyDependency = true;
      break;
    }
  }

  // If no dependencies between any tasks, critical path is the task(s) with longest duration
  if (!hasAnyDependency) {
    let maxDuration = 0;
    for (const node of nodes.values()) {
      if (node.duration > maxDuration) {
        maxDuration = node.duration;
      }
    }
    for (const node of nodes.values()) {
      if (node.duration === maxDuration && maxDuration > 0) {
        criticalIds.add(node.id);
      }
    }
    return criticalIds;
  }

  // Forward Pass (Early Start & Early Finish)
  const inDegree: Map<string, number> = new Map();
  for (const [id, node] of nodes.entries()) {
    inDegree.set(id, node.predecessors.length);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const currId = queue.shift()!;
    topoOrder.push(currId);
    const currNode = nodes.get(currId)!;

    for (const succId of currNode.successors) {
      const succNode = nodes.get(succId);
      if (succNode) {
        succNode.es = Math.max(succNode.es, currNode.ef);
        succNode.ef = succNode.es + succNode.duration;

        const newDeg = (inDegree.get(succId) || 1) - 1;
        inDegree.set(succId, newDeg);
        if (newDeg === 0) {
          queue.push(succId);
        }
      }
    }
  }

  if (topoOrder.length !== nodes.size) {
    throw new Error("Cannot compute the critical path because task dependencies contain a cycle.");
  }

  // Project Finish Date (max of all EF)
  let projectFinish = 0;
  for (const node of nodes.values()) {
    if (node.ef > projectFinish) {
      projectFinish = node.ef;
    }
  }

  // Backward Pass (Late Start & Late Finish)
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const currId = topoOrder[i];
    const currNode = nodes.get(currId);
    if (!currNode) continue;

    if (currNode.successors.length === 0) {
      currNode.lf = projectFinish;
    } else {
      let minSuccLS = Infinity;
      for (const succId of currNode.successors) {
        const succNode = nodes.get(succId);
        if (succNode && succNode.ls < minSuccLS) {
          minSuccLS = succNode.ls;
        }
      }
      currNode.lf = minSuccLS === Infinity ? projectFinish : minSuccLS;
    }

    currNode.ls = currNode.lf - currNode.duration;
    currNode.slack = currNode.ls - currNode.es;

    // Zero float (or near-zero float) on dependency chains
    if (Math.abs(currNode.slack) <= 0.01 && (currNode.predecessors.length > 0 || currNode.successors.length > 0)) {
      criticalIds.add(currId);
    }
  }

  return criticalIds;
};
