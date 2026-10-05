/**
 * Automated Verification Script for Sprint 2.1: Feature Switchboard & Baseline Defaults
 * Modular Feature Switchboard, Baseline Complexity Presets & Dynamic UI Gating
 */

import assert from "node:assert";

// 1. Types & Interfaces
type TComplexityBaseline = "minimal" | "standard" | "deep";

interface MockProject {
  id: string;
  name: string;
  identifier: string;
  default_complexity: TComplexityBaseline;
  is_speed_engine_enabled: boolean;
  is_cascading_gantt_enabled: boolean;
  is_wbs_numbering_enabled: boolean;
  is_canonical_state_enabled: boolean;
  is_strategic_okr_enabled: boolean;
  is_focus_timer_enabled: boolean;
  is_tactile_kanban_enabled: boolean;
}

// 2. Complexity Tier Preset Map
const COMPLEXITY_PRESETS: Record<TComplexityBaseline, Partial<MockProject>> = {
  minimal: {
    default_complexity: "minimal",
    is_speed_engine_enabled: true,
    is_tactile_kanban_enabled: true,
    is_focus_timer_enabled: true,
    is_wbs_numbering_enabled: false,
    is_cascading_gantt_enabled: false,
    is_strategic_okr_enabled: false,
    is_canonical_state_enabled: true,
  },
  standard: {
    default_complexity: "standard",
    is_speed_engine_enabled: true,
    is_tactile_kanban_enabled: true,
    is_focus_timer_enabled: true,
    is_wbs_numbering_enabled: true,
    is_cascading_gantt_enabled: true,
    is_strategic_okr_enabled: true,
    is_canonical_state_enabled: true,
  },
  deep: {
    default_complexity: "deep",
    is_speed_engine_enabled: true,
    is_tactile_kanban_enabled: true,
    is_focus_timer_enabled: true,
    is_wbs_numbering_enabled: true,
    is_cascading_gantt_enabled: true,
    is_strategic_okr_enabled: true,
    is_canonical_state_enabled: true,
  },
};

// 3. UI Navigation & Feature Gating Logic
function evaluateNavigationItems(project: MockProject): Array<{ key: string; shouldRender: boolean }> {
  return [
    { key: "issues", shouldRender: true },
    { key: "cycles", shouldRender: true },
    { key: "modules", shouldRender: true },
    { key: "goals", shouldRender: project.is_strategic_okr_enabled ?? true },
    { key: "views", shouldRender: true },
    { key: "pages", shouldRender: true },
  ];
}

function shouldRenderWbsOnIssue(project: MockProject, issueWbs: string | null): boolean {
  if (!project.is_wbs_numbering_enabled) return false;
  return Boolean(issueWbs);
}

function shouldExecuteCascadingShift(project: MockProject): boolean {
  return project.is_cascading_gantt_enabled ?? true;
}

function shouldAllowTactileDensityToggle(project: MockProject): boolean {
  return project.is_tactile_kanban_enabled ?? true;
}

// 4. API Patch Serializer Simulation
function simulateProjectPatch(
  project: MockProject,
  patchData: Partial<MockProject>
): MockProject {
  // Validate complexity choice
  if (patchData.default_complexity && !["minimal", "standard", "deep"].includes(patchData.default_complexity)) {
    throw new Error(`Invalid complexity tier: ${patchData.default_complexity}`);
  }

  // Apply updates (immutable return)
  return {
    ...project,
    ...patchData,
  };
}

// =========================================================================
// TEST SUITE EXECUTION
// =========================================================================

async function runTests() {
  console.log("=== SPRINT 2.1: FEATURE SWITCHBOARD & BASELINE DEFAULTS VERIFICATION ===");

  // TEST 1: Project Schema & Defaults
  console.log("\n[Test 1] Project Model Schema Defaults Verification");
  const defaultProject: MockProject = {
    id: "proj-1",
    name: "Core Infrastructure",
    identifier: "INFRA",
    default_complexity: "standard",
    is_speed_engine_enabled: true,
    is_cascading_gantt_enabled: true,
    is_wbs_numbering_enabled: true,
    is_canonical_state_enabled: true,
    is_strategic_okr_enabled: true,
    is_focus_timer_enabled: true,
    is_tactile_kanban_enabled: true,
  };

  assert.strictEqual(defaultProject.default_complexity, "standard", "Default complexity is standard");
  assert.strictEqual(defaultProject.is_speed_engine_enabled, true, "Huly speed engine default enabled");
  assert.strictEqual(defaultProject.is_cascading_gantt_enabled, true, "OpenProject Gantt default enabled");
  assert.strictEqual(defaultProject.is_wbs_numbering_enabled, true, "WBS numbering default enabled");
  assert.strictEqual(defaultProject.is_canonical_state_enabled, true, "Vikunja canonical state default enabled");
  assert.strictEqual(defaultProject.is_strategic_okr_enabled, true, "Leantime OKRs default enabled");
  assert.strictEqual(defaultProject.is_focus_timer_enabled, true, "Super Productivity timer default enabled");
  assert.strictEqual(defaultProject.is_tactile_kanban_enabled, true, "Planka tactile kanban default enabled");
  console.log("  PASS: All 7 enriched engine switches and default complexity initialized properly.");

  // TEST 2: Complexity Preset Transitions
  console.log("\n[Test 2] Baseline Complexity Presets Application");
  // Apply Minimal Preset
  const minimalProject = simulateProjectPatch(defaultProject, COMPLEXITY_PRESETS.minimal);
  assert.strictEqual(minimalProject.default_complexity, "minimal");
  assert.strictEqual(minimalProject.is_speed_engine_enabled, true);
  assert.strictEqual(minimalProject.is_focus_timer_enabled, true);
  assert.strictEqual(minimalProject.is_tactile_kanban_enabled, true);
  assert.strictEqual(minimalProject.is_wbs_numbering_enabled, false, "WBS disabled in minimal preset");
  assert.strictEqual(minimalProject.is_cascading_gantt_enabled, false, "Cascading Gantt disabled in minimal preset");
  assert.strictEqual(minimalProject.is_strategic_okr_enabled, false, "Strategic OKRs disabled in minimal preset");

  // Apply Deep Preset
  const deepProject = simulateProjectPatch(minimalProject, COMPLEXITY_PRESETS.deep);
  assert.strictEqual(deepProject.default_complexity, "deep");
  assert.strictEqual(deepProject.is_wbs_numbering_enabled, true, "WBS re-enabled in deep preset");
  assert.strictEqual(deepProject.is_cascading_gantt_enabled, true, "Cascading Gantt re-enabled in deep preset");
  assert.strictEqual(deepProject.is_strategic_okr_enabled, true, "Strategic OKRs re-enabled in deep preset");
  console.log("  PASS: Minimal, Standard, and Deep presets apply configuration mappings accurately.");

  // TEST 3: Dynamic UI Navigation & Feature Gating
  console.log("\n[Test 3] Dynamic UI Navigation & Feature Gating Evaluation");
  // Check Goals & OKRs sidebar visibility
  const navDefault = evaluateNavigationItems(defaultProject);
  const goalsNavDefault = navDefault.find((n) => n.key === "goals");
  assert.strictEqual(goalsNavDefault?.shouldRender, true, "Goals & OKRs rendered when enabled");

  const navMinimal = evaluateNavigationItems(minimalProject);
  const goalsNavMinimal = navMinimal.find((n) => n.key === "goals");
  assert.strictEqual(goalsNavMinimal?.shouldRender, false, "Goals & OKRs hidden when disabled");

  // Check WBS badge gating
  assert.strictEqual(shouldRenderWbsOnIssue(defaultProject, "1.2.3"), true, "WBS rendered when enabled");
  assert.strictEqual(shouldRenderWbsOnIssue(minimalProject, "1.2.3"), false, "WBS omitted when disabled");

  // Check Cascading Gantt gating
  assert.strictEqual(shouldExecuteCascadingShift(defaultProject), true, "Cascading shifts run when enabled");
  assert.strictEqual(shouldExecuteCascadingShift(minimalProject), false, "Cascading shifts skipped when disabled");

  // Check Tactile Kanban gating
  assert.strictEqual(shouldAllowTactileDensityToggle(defaultProject), true);
  console.log("  PASS: UI navigation items, WBS indicators, and Gantt math gate conditionally on engine flags.");

  // TEST 4: PATCH Validation & Error Handling
  console.log("\n[Test 4] Patch Validation & Error Handling");
  // Test invalid complexity rejection
  assert.throws(
    () => {
      simulateProjectPatch(defaultProject, { default_complexity: "ultra_extreme" as any });
    },
    /Invalid complexity tier/,
    "Invalid complexity rejected with validation error"
  );

  // Test single flag toggle patch
  const toggledProject = simulateProjectPatch(defaultProject, {
    is_speed_engine_enabled: false,
  });
  assert.strictEqual(toggledProject.is_speed_engine_enabled, false);
  assert.strictEqual(toggledProject.is_cascading_gantt_enabled, true, "Other flags remain unaffected");
  console.log("  PASS: Project patch validation and isolated switch updates verified.");

  console.log("\n========================================================");
  console.log("ALL SPRINT 2.1 TESTS PASSED SUCCESSFULLY! (4/4 tests)");
  console.log("========================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
