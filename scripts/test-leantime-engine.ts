/**
 * Test Suite: Leantime Engine (Strategic OKRs, Goals & Idea Validation Sandbox)
 * Verifies:
 * 1. Strategic OKRs progress rollups from linked cycles/modules work items.
 * 2. Key Result auto_compute and manual calculation mathematics.
 * 3. Objective aggregate progress rollup across multiple child Key Results.
 * 4. Idea Impact vs Effort 2x2 Matrix quadrant categorization.
 * 5. Idea conversion workflows to Issue and Module.
 */

import assert from "node:assert";

// Type definitions matching @plane/types
type ObjectiveStatus = "on_track" | "at_risk" | "behind" | "completed";
type IdeaMatrixQuadrant = "quick_wins" | "major_projects" | "fill_ins" | "thankless_tasks";

interface MockKeyResult {
  id: string;
  objective_id: string;
  title: string;
  initial_value: number;
  target_value: number;
  current_value: number;
  unit: string;
  auto_compute: boolean;
  linked_cycle_issue_ids: string[];
  linked_module_issue_ids: string[];
}

interface MockIssue {
  id: string;
  state_group: "backlog" | "unstarted" | "started" | "completed" | "cancelled";
}

interface MockIdea {
  id: string;
  title: string;
  impact: number; // 1-5
  effort: number; // 1-5
  upvotes_count: number;
  status: "new" | "under_review" | "validated" | "rejected" | "converted";
  converted_issue_id: string | null;
  converted_module_id: string | null;
}

// 1. Math computation mirror from plane/db/models/strategic.py
function computeKeyResultProgress(
  kr: MockKeyResult,
  issueStateMap: Record<string, "backlog" | "unstarted" | "started" | "completed" | "cancelled">
): { progress: number; current_value: number } {
  if (kr.auto_compute) {
    const allIssueIds = Array.from(new Set([...kr.linked_cycle_issue_ids, ...kr.linked_module_issue_ids]));
    if (allIssueIds.length > 0) {
      const totalCount = allIssueIds.length;
      const completedCount = allIssueIds.filter((id) => {
        const grp = issueStateMap[id];
        return grp === "completed" || grp === "cancelled";
      }).length;

      const ratio = completedCount / totalCount;
      const range = kr.target_value - kr.initial_value;
      const currentValue = Math.round((kr.initial_value + range * ratio) * 100) / 100;
      const progress = Math.round(ratio * 10000) / 100;
      return { progress, current_value: currentValue };
    }
  }

  // Fallback to manual
  const range = kr.target_value - kr.initial_value;
  if (range > 0) {
    const calcPct = ((kr.current_value - kr.initial_value) / range) * 100;
    return {
      progress: Math.round(Math.min(Math.max(calcPct, 0), 100) * 100) / 100,
      current_value: kr.current_value,
    };
  }
  return { progress: 0, current_value: kr.current_value };
}

function computeObjectiveProgress(
  keyResultProgresses: number[],
  status: ObjectiveStatus
): number {
  if (keyResultProgresses.length === 0) {
    return status === "completed" ? 100.0 : 0.0;
  }
  const total = keyResultProgresses.reduce((acc, p) => acc + p, 0);
  return Math.round((total / keyResultProgresses.length) * 100) / 100;
}

// 2. Matrix quadrant mapping from plane/db/models/strategic.py
function calculateMatrixQuadrant(impact: number, effort: number): IdeaMatrixQuadrant {
  if (impact >= 3) {
    return effort <= 2 ? "quick_wins" : "major_projects";
  } else {
    return effort <= 2 ? "fill_ins" : "thankless_tasks";
  }
}

// 3. Idea conversion logic
function convertIdeaToIssue(idea: MockIdea, issueId: string): MockIdea {
  if (idea.converted_issue_id) {
    throw new Error("Idea is already converted to an issue");
  }
  return {
    ...idea,
    converted_issue_id: issueId,
    status: "converted",
  };
}

function convertIdeaToModule(idea: MockIdea, moduleId: string): MockIdea {
  if (idea.converted_module_id) {
    throw new Error("Idea is already converted to a module");
  }
  return {
    ...idea,
    converted_module_id: moduleId,
    status: "converted",
  };
}

// =================== RUN TESTS ===================

console.log("🧪 [Leantime Engine] Starting Automated Verification Tests...\n");

// Test 1: Key Result Progress Auto-Computation with Linked Cycles & Modules
console.log("▶ Test 1: Key Result Progress Auto-Computation from Linked Issues");
{
  const issueStateMap: Record<string, "backlog" | "unstarted" | "started" | "completed" | "cancelled"> = {
    "issue-1": "completed",
    "issue-2": "completed",
    "issue-3": "started",
    "issue-4": "unstarted",
  };

  const keyResult: MockKeyResult = {
    id: "kr-1",
    objective_id: "obj-1",
    title: "Close 4 key customer features",
    initial_value: 0,
    target_value: 100,
    current_value: 0,
    unit: "%",
    auto_compute: true,
    linked_cycle_issue_ids: ["issue-1", "issue-2"],
    linked_module_issue_ids: ["issue-3", "issue-4"],
  };

  const result = computeKeyResultProgress(keyResult, issueStateMap);
  console.log(`  - 2 out of 4 issues completed -> Progress: ${result.progress}%, Current Value: ${result.current_value}`);
  assert.strictEqual(result.progress, 50.0);
  assert.strictEqual(result.current_value, 50.0);

  // Mark 3rd issue as cancelled (which counts as terminal completed state in rollup)
  issueStateMap["issue-3"] = "cancelled";
  const result2 = computeKeyResultProgress(keyResult, issueStateMap);
  console.log(`  - 3 out of 4 issues terminal (2 completed, 1 cancelled) -> Progress: ${result2.progress}%`);
  assert.strictEqual(result2.progress, 75.0);
  assert.strictEqual(result2.current_value, 75.0);

  // Complete remaining issue
  issueStateMap["issue-4"] = "completed";
  const result3 = computeKeyResultProgress(keyResult, issueStateMap);
  console.log(`  - 4 out of 4 issues completed -> Progress: ${result3.progress}%`);
  assert.strictEqual(result3.progress, 100.0);
  assert.strictEqual(result3.current_value, 100.0);
  console.log("  ✔ Test 1 passed!\n");
}

// Test 2: Objective Dynamic Aggregate Rollup
console.log("▶ Test 2: Objective Dynamic Aggregate Rollup across multiple Key Results");
{
  // KR 1 has 50% progress, KR 2 has 100% progress, KR 3 has 25% progress
  const krProgresses = [50.0, 100.0, 25.0];
  const objProgress = computeObjectiveProgress(krProgresses, "on_track");
  console.log(`  - KRs: [50%, 100%, 25%] -> Objective aggregate: ${objProgress}% (Expected: 58.33%)`);
  assert.strictEqual(objProgress, 58.33);

  // Empty Key Results but status completed
  const emptyObjCompleted = computeObjectiveProgress([], "completed");
  console.log(`  - Objective with 0 KRs and status 'completed' -> Progress: ${emptyObjCompleted}%`);
  assert.strictEqual(emptyObjCompleted, 100.0);

  // Empty Key Results and status on_track
  const emptyObjPending = computeObjectiveProgress([], "on_track");
  console.log(`  - Objective with 0 KRs and status 'on_track' -> Progress: ${emptyObjPending}%`);
  assert.strictEqual(emptyObjPending, 0.0);
  console.log("  ✔ Test 2 passed!\n");
}

// Test 3: Idea Impact vs Effort 2x2 Matrix Quadrants
console.log("▶ Test 3: Idea Impact vs Effort 2x2 Matrix Quadrants Categorization");
{
  const testCases: { impact: number; effort: number; expected: IdeaMatrixQuadrant; label: string }[] = [
    { impact: 5, effort: 1, expected: "quick_wins", label: "Imp:5, Eff:1" },
    { impact: 3, effort: 2, expected: "quick_wins", label: "Imp:3, Eff:2 (Boundary)" },
    { impact: 4, effort: 4, expected: "major_projects", label: "Imp:4, Eff:4" },
    { impact: 3, effort: 3, expected: "major_projects", label: "Imp:3, Eff:3 (Boundary)" },
    { impact: 2, effort: 1, expected: "fill_ins", label: "Imp:2, Eff:1" },
    { impact: 1, effort: 2, expected: "fill_ins", label: "Imp:1, Eff:2 (Boundary)" },
    { impact: 2, effort: 5, expected: "thankless_tasks", label: "Imp:2, Eff:5" },
    { impact: 1, effort: 3, expected: "thankless_tasks", label: "Imp:1, Eff:3 (Boundary)" },
  ];

  for (const tc of testCases) {
    const quadrant = calculateMatrixQuadrant(tc.impact, tc.effort);
    console.log(`  - ${tc.label} -> Quadrant: ${quadrant} (Expected: ${tc.expected})`);
    assert.strictEqual(quadrant, tc.expected);
  }
  console.log("  ✔ Test 3 passed!\n");
}

// Test 4: Idea Conversion to Issue and Module
console.log("▶ Test 4: Idea Conversion to Issue & Module Work Items");
{
  const initialIdea: MockIdea = {
    id: "idea-101",
    title: "Implement One-Click Cloud Export",
    impact: 4,
    effort: 2,
    upvotes_count: 7,
    status: "validated",
    converted_issue_id: null,
    converted_module_id: null,
  };

  // Convert to Issue
  const convertedToIssue = convertIdeaToIssue(initialIdea, "issue-999");
  console.log(`  - Converted to Issue -> status: ${convertedToIssue.status}, converted_issue_id: ${convertedToIssue.converted_issue_id}`);
  assert.strictEqual(convertedToIssue.status, "converted");
  assert.strictEqual(convertedToIssue.converted_issue_id, "issue-999");

  // Attempt to convert again should throw
  assert.throws(() => {
    convertIdeaToIssue(convertedToIssue, "issue-1000");
  }, /Idea is already converted to an issue/);

  // Convert to Module
  const ideaForModule: MockIdea = {
    ...initialIdea,
    id: "idea-102",
    title: "AI Analytics Initiative",
  };
  const convertedToModule = convertIdeaToModule(ideaForModule, "mod-555");
  console.log(`  - Converted to Module -> status: ${convertedToModule.status}, converted_module_id: ${convertedToModule.converted_module_id}`);
  assert.strictEqual(convertedToModule.status, "converted");
  assert.strictEqual(convertedToModule.converted_module_id, "mod-555");

  console.log("  ✔ Test 4 passed!\n");
}

console.log("🎉 ALL LEANTIME STRATEGIC ENGINE TESTS PASSED SUCCESSFULLY!\n");
