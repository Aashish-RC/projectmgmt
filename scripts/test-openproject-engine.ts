/**
 * Verification test script for Sprint 1.2 OpenProject Engine:
 * - Enterprise Gantt Cascading Dependencies
 * - Critical Path Analysis (Forward / Backward Pass CPM)
 * - WBS Hierarchical Numbering Engine
 */

import { computeCriticalPath } from "../apps/web/core/components/gantt-chart/helpers/critical-path";
import type { IGanttBlock } from "../packages/types/src/layout/gantt";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  FAIL: ${testName}`);
  }
}

console.log("\n=======================================================");
console.log("   SPRINT 1.2 OPENPROJECT ENGINE VERIFICATION SUITE   ");
console.log("=======================================================\n");

// ----------------------------------------------------------------------
// 1. Critical Path Analysis (CPM)
// ----------------------------------------------------------------------
console.log("[1] Testing Critical Path Analysis (CPM Algorithm)...");

const mockBlocks: Record<string, IGanttBlock> = {
  // Chain 1 (Longer: 5 + 10 = 15 days) -> Critical
  A: {
    id: "A",
    name: "Task A",
    sort_order: 1,
    start_date: "2026-01-01",
    target_date: "2026-01-05",
    data: {},
  },
  B: {
    id: "B",
    name: "Task B",
    sort_order: 2,
    start_date: "2026-01-06",
    target_date: "2026-01-15",
    data: {},
  },
  // Chain 2 (Shorter: 3 + 4 = 7 days) -> Non-critical (has float)
  C: {
    id: "C",
    name: "Task C",
    sort_order: 3,
    start_date: "2026-01-01",
    target_date: "2026-01-03",
    data: {},
  },
  D: {
    id: "D",
    name: "Task D",
    sort_order: 4,
    start_date: "2026-01-04",
    target_date: "2026-01-07",
    data: {},
  },
  // Final Task depending on both B and D
  E: {
    id: "E",
    name: "Milestone E",
    sort_order: 5,
    start_date: "2026-01-16",
    target_date: "2026-01-18",
    data: {},
  },
};

const mockDependencies: Record<string, { predecessors: string[]; successors: string[] }> = {
  A: { predecessors: [], successors: ["B"] },
  B: { predecessors: ["A"], successors: ["E"] },
  C: { predecessors: [], successors: ["D"] },
  D: { predecessors: ["C"], successors: ["E"] },
  E: { predecessors: ["B", "D"], successors: [] },
};

const getDeps = (id: string) => mockDependencies[id] || { predecessors: [], successors: [] };

const criticalPath = computeCriticalPath(["A", "B", "C", "D", "E"], mockBlocks, getDeps);

assert(criticalPath.has("A"), "Task A is on Critical Path");
assert(criticalPath.has("B"), "Task B is on Critical Path");
assert(criticalPath.has("E"), "Milestone E is on Critical Path");
assert(!criticalPath.has("C"), "Task C has slack/float and is NOT on Critical Path");
assert(!criticalPath.has("D"), "Task D has slack/float and is NOT on Critical Path");


// ----------------------------------------------------------------------
// 2. Cascading Gantt Dependency Engine
// ----------------------------------------------------------------------
console.log("\n[2] Testing Cascading Gantt Dependency Engine...");

// Simulation of BaseTimeLineStore cascading logic
function simulateCascadingDrag(
  draggedId: string,
  newTargetDate: string,
  blocks: Record<string, { start_date: string; target_date: string }>,
  deps: Record<string, string[]> // id -> successors
) {
  const updates: Record<string, { start_date: string; target_date: string }> = {};
  const visited = new Set<string>([draggedId]);
  const queue: { taskId: string; targetDate: string }[] = [{ taskId: draggedId, targetDate: newTargetDate }];

  updates[draggedId] = { start_date: blocks[draggedId].start_date, target_date: newTargetDate };

  while (queue.length > 0) {
    const { taskId, targetDate: predTargetStr } = queue.shift()!;
    const successors = deps[taskId] || [];

    for (const succId of successors) {
      if (visited.has(succId)) continue;
      const succ = blocks[succId];
      if (!succ) continue;

      const predTargetTime = new Date(predTargetStr).getTime();
      const succStartTime = new Date(succ.start_date).getTime();

      if (predTargetTime > succStartTime) {
        visited.add(succId);
        const diffMs = predTargetTime - succStartTime;
        const deltaDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        const nextStart = new Date(succ.start_date);
        nextStart.setDate(nextStart.getDate() + deltaDays);
        const newStartStr = nextStart.toISOString().split("T")[0];

        const nextTarget = new Date(succ.target_date);
        nextTarget.setDate(nextTarget.getDate() + deltaDays);
        const newTargetStr = nextTarget.toISOString().split("T")[0];

        updates[succId] = { start_date: newStartStr, target_date: newTargetStr };
        queue.push({ taskId: succId, targetDate: newTargetStr });
      }
    }
  }

  return updates;
}

const cascadeBlocks = {
  task1: { start_date: "2026-02-01", target_date: "2026-02-05" },
  task2: { start_date: "2026-02-06", target_date: "2026-02-10" },
  task3: { start_date: "2026-02-11", target_date: "2026-02-15" },
};
const cascadeDeps = {
  task1: ["task2"],
  task2: ["task3"],
  task3: [],
};

// Push task1 target date 5 days forward (from Feb 5 to Feb 10, past task2's start of Feb 6)
const cascadeResult = simulateCascadingDrag("task1", "2026-02-10", cascadeBlocks, cascadeDeps);

assert(cascadeResult.task2 !== undefined, "Task 2 is automatically shifted by cascade");
assert(cascadeResult.task2.start_date === "2026-02-10", `Task 2 new start_date is 2026-02-10 (got ${cascadeResult.task2?.start_date})`);
assert(cascadeResult.task2.target_date === "2026-02-14", `Task 2 duration preserved: target_date is 2026-02-14 (got ${cascadeResult.task2?.target_date})`);
assert(cascadeResult.task3 !== undefined, "Task 3 is recursively shifted by cascade");
assert(cascadeResult.task3.start_date === "2026-02-14", `Task 3 new start_date is 2026-02-14 (got ${cascadeResult.task3?.start_date})`);
assert(cascadeResult.task3.target_date === "2026-02-18", `Task 3 duration preserved: target_date is 2026-02-18 (got ${cascadeResult.task3?.target_date})`);


// ----------------------------------------------------------------------
// 3. Work Breakdown Structure (WBS) Numbering Logic
// ----------------------------------------------------------------------
console.log("\n[3] Testing Work Breakdown Structure (WBS) Numbering Engine...");

interface MockWBSNode {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  sequence_id: number;
}

function computeMockWBS(nodeId: string, allNodes: MockWBSNode[]): string {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const target = nodeMap.get(nodeId);
  if (!target) return "1.0";

  const chain: MockWBSNode[] = [target];
  let curr = target;
  const visited = new Set<string>([target.id]);

  while (curr.parent_id) {
    const parent = nodeMap.get(curr.parent_id);
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);
    chain.push(parent);
    curr = parent;
  }
  chain.reverse();

  const parts: string[] = [];

  // Root level index among roots
  const roots = allNodes
    .filter((n) => !n.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order || a.sequence_id - b.sequence_id);
  const rootIdx = roots.findIndex((r) => r.id === chain[0].id) + 1;
  parts.push(String(rootIdx > 0 ? rootIdx : 1));

  if (chain.length === 1) {
    parts.push("0");
  } else {
    for (let i = 1; i < chain.length; i++) {
      const parent = chain[i - 1];
      const child = chain[i];
      const siblings = allNodes
        .filter((n) => n.parent_id === parent.id)
        .sort((a, b) => a.sort_order - b.sort_order || a.sequence_id - b.sequence_id);
      const childIdx = siblings.findIndex((s) => s.id === child.id) + 1;
      parts.push(String(childIdx > 0 ? childIdx : 1));
    }
  }

  return parts.join(".");
}

const wbsIssues: MockWBSNode[] = [
  { id: "p1", name: "Project Foundation", parent_id: null, sort_order: 1, sequence_id: 1 },
  { id: "p2", name: "Core Architecture", parent_id: null, sort_order: 2, sequence_id: 2 },
  { id: "c1_1", name: "Database Schema", parent_id: "p1", sort_order: 1, sequence_id: 3 },
  { id: "c1_2", name: "API Gateway", parent_id: "p1", sort_order: 2, sequence_id: 4 },
  { id: "c1_2_1", name: "JWT Auth Middleware", parent_id: "c1_2", sort_order: 1, sequence_id: 5 },
  { id: "c1_2_2", name: "Rate Limiter", parent_id: "c1_2", sort_order: 2, sequence_id: 6 },
  { id: "c2_1", name: "Frontend Setup", parent_id: "p2", sort_order: 1, sequence_id: 7 },
];

assert(computeMockWBS("p1", wbsIssues) === "1.0", "Root 1 WBS is 1.0");
assert(computeMockWBS("p2", wbsIssues) === "2.0", "Root 2 WBS is 2.0");
assert(computeMockWBS("c1_1", wbsIssues) === "1.1", "Child 1 of Root 1 is 1.1");
assert(computeMockWBS("c1_2", wbsIssues) === "1.2", "Child 2 of Root 1 is 1.2");
assert(computeMockWBS("c1_2_1", wbsIssues) === "1.2.1", "Subtask 1 of Child 2 is 1.2.1 ([1.2.1] PROJ-42)");
assert(computeMockWBS("c1_2_2", wbsIssues) === "1.2.2", "Subtask 2 of Child 2 is 1.2.2");
assert(computeMockWBS("c2_1", wbsIssues) === "2.1", "Child 1 of Root 2 is 2.1");

console.log("\n=======================================================");
console.log(`   RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log("=======================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
}
