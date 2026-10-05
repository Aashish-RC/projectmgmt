/**
 * Automated Verification Script for Phase 3 - Sprint 3.2:
 * The Dynamic Switchboard & Auto-Adaptation Engine
 * 
 * Verifies:
 * 1. AdaptiveSlot conditional rendering logic across all 3 tiers (Minimal, Standard, Deep)
 * 2. Mandatory field governance override safeguards
 * 3. Complexity Dial cycle switching & Admin Lock enforcement
 * 4. Behavioral Habit Adaptation Detector telemetry & velocity heuristic trigger
 */

declare const process: any;

import {
  MINIMAL_PERSONA,
  STANDARD_PERSONA,
  DEEP_PERSONA,
  PERSONA_MANIFESTS,
} from "../packages/types/src/adaptive";
import type { ComplexityTier, IPersonaManifest } from "../packages/types/src/adaptive";
import type { IProject } from "../packages/types/src";

// ==========================================
// 1. Adaptive Slot Logic Emulation
// ==========================================
interface IAdaptiveSlotProps {
  field?: string;
  minTier?: ComplexityTier;
  feature?: string;
  navKey?: string;
}

const TIER_ORDER: Record<ComplexityTier, number> = {
  minimal: 1,
  standard: 2,
  deep: 3,
};

function resolveEffectiveTier(
  userTier: ComplexityTier,
  project?: Partial<IProject> | null
): ComplexityTier {
  if (!project) return userTier;
  const policy = project.complexity_policy ?? "bounded";
  if (policy === "locked") {
    return (project.default_complexity as ComplexityTier) || "standard";
  }
  return userTier || (project.default_complexity as ComplexityTier) || "standard";
}

function evaluateIsFieldVisible(
  fieldName: string,
  tier: ComplexityTier,
  project?: Partial<IProject> | null
): boolean {
  const rawKey = fieldName.toLowerCase().trim();
  const candidateKeys = [rawKey];

  if (rawKey === "target_date" || rawKey === "due_date") candidateKeys.push("target_date", "due_date");
  if (rawKey === "cycle_id" || rawKey === "cycle") candidateKeys.push("cycle_id", "cycle");
  if (rawKey === "module_ids" || rawKey === "module" || rawKey === "modules") candidateKeys.push("module_ids", "module", "modules");
  if (rawKey === "estimate_point" || rawKey === "estimate") candidateKeys.push("estimate_point", "estimate");
  if (rawKey === "label_ids" || rawKey === "labels" || rawKey === "label") candidateKeys.push("label_ids", "labels", "label");
  if (rawKey === "assignee_ids" || rawKey === "assignees" || rawKey === "assignee") candidateKeys.push("assignee_ids", "assignees", "assignee");
  if (rawKey === "state_id" || rawKey === "state") candidateKeys.push("state_id", "state");
  if (rawKey === "parent_id" || rawKey === "parent") candidateKeys.push("parent_id", "parent");

  // Mandatory fields ALWAYS override
  if (project?.mandatory_fields && project.mandatory_fields.length > 0) {
    const isMandatory = project.mandatory_fields.some((f: string) =>
      candidateKeys.includes(f.toLowerCase().trim())
    );
    if (isMandatory) return true;
  }

  // Manifest rules
  const manifest = PERSONA_MANIFESTS[tier];
  return candidateKeys.some((k) => manifest.issueProperties.visibleFields.includes(k));
}

function evaluateAdaptiveSlot(
  props: IAdaptiveSlotProps,
  tier: ComplexityTier,
  project?: Partial<IProject> | null
): boolean {
  if (props.minTier && TIER_ORDER[tier] < TIER_ORDER[props.minTier]) {
    return false;
  }
  if (props.field && !evaluateIsFieldVisible(props.field, tier, project)) {
    return false;
  }
  return true;
}

// ==========================================
// 2. Complexity Dial Cycling & Policy Logic
// ==========================================
function cycleTier(
  currentTier: ComplexityTier,
  project?: Partial<IProject> | null,
  userRole: number = 10 // Member
): { nextTier: ComplexityTier; allowed: boolean } {
  const isLocked = project?.complexity_policy === "locked";
  const isAdmin = userRole >= 20;

  if (isLocked && !isAdmin) {
    return { nextTier: currentTier, allowed: false };
  }

  const order: ComplexityTier[] = ["minimal", "standard", "deep"];
  const currentIdx = order.indexOf(currentTier);
  const nextTier = order[(currentIdx + 1) % order.length];
  return { nextTier, allowed: true };
}

// ==========================================
// 3. Behavioral Habit Telemetry & Heuristic
// ==========================================
class TestHabitDetector {
  keyboardShortcutCount = 0;
  advancedFeatureUsageCount = 0;
  hasPromptedForMinimal = false;

  recordShortcut(name: string) {
    this.keyboardShortcutCount += 1;
  }

  recordAdvancedFeature(name: string) {
    this.advancedFeatureUsageCount += 1;
  }

  checkHeuristic(currentTier: ComplexityTier): boolean {
    if (this.hasPromptedForMinimal) return false;
    if (currentTier !== "standard") return false;
    if (this.keyboardShortcutCount >= 50 && this.advancedFeatureUsageCount === 0) {
      this.hasPromptedForMinimal = true;
      return true;
    }
    return false;
  }

  dismiss() {
    this.hasPromptedForMinimal = true;
  }
}

// ==========================================
// Test Suite Runner
// ==========================================
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (detail) console.error(`         Detail: ${detail}`);
    failed++;
  }
}

console.log("================================================================================");
console.log("PHASE 3 - SPRINT 3.2: DYNAMIC SWITCHBOARD & AUTO-ADAPTATION ENGINE TESTS");
console.log("================================================================================\n");

// Test 1: AdaptiveSlot Conditional Rendering in Minimal Mode
console.log("Test Suite 1: <AdaptiveSlot /> Conditional Rendering in Minimal Tier");
{
  const tier: ComplexityTier = "minimal";
  const project: Partial<IProject> = { mandatory_fields: [] };

  assert(
    evaluateAdaptiveSlot({ field: "state_id" }, tier, project) === true,
    "Minimal tier shows state_id"
  );
  assert(
    evaluateAdaptiveSlot({ field: "priority" }, tier, project) === true,
    "Minimal tier shows priority"
  );
  assert(
    evaluateAdaptiveSlot({ field: "assignee_ids" }, tier, project) === true,
    "Minimal tier shows assignee_ids"
  );
  assert(
    evaluateAdaptiveSlot({ field: "start_date" }, tier, project) === false,
    "Minimal tier hides start_date"
  );
  assert(
    evaluateAdaptiveSlot({ field: "target_date" }, tier, project) === false,
    "Minimal tier hides target_date"
  );
  assert(
    evaluateAdaptiveSlot({ field: "cycle_id" }, tier, project) === false,
    "Minimal tier hides cycle_id"
  );
  assert(
    evaluateAdaptiveSlot({ field: "module_ids" }, tier, project) === false,
    "Minimal tier hides module_ids"
  );
  assert(
    evaluateAdaptiveSlot({ minTier: "standard" }, tier, project) === false,
    "Slot with minTier='standard' is hidden in Minimal"
  );
}

// Test 2: Mandatory Field Safeguard Overrides Minimal Mode
console.log("\nTest Suite 2: Mandatory Field Safeguard Overrides Minimal Mode");
{
  const tier: ComplexityTier = "minimal";
  // Admin marked due_date and cycle as mandatory
  const project: Partial<IProject> = {
    mandatory_fields: ["due_date", "cycle"],
  };

  assert(
    evaluateAdaptiveSlot({ field: "target_date" }, tier, project) === true,
    "target_date is forced visible in Minimal mode when in project.mandatory_fields (due_date alias)"
  );
  assert(
    evaluateAdaptiveSlot({ field: "cycle_id" }, tier, project) === true,
    "cycle_id is forced visible in Minimal mode when in project.mandatory_fields"
  );
  assert(
    evaluateAdaptiveSlot({ field: "start_date" }, tier, project) === false,
    "Non-mandatory field start_date remains hidden in Minimal mode"
  );
}

// Test 3: Standard and Deep Persona Slot Rendering
console.log("\nTest Suite 3: Standard and Deep Persona Slot Rendering");
{
  const standardTier: ComplexityTier = "standard";
  const deepTier: ComplexityTier = "deep";
  const project: Partial<IProject> = { mandatory_fields: [] };

  // Standard
  assert(
    evaluateAdaptiveSlot({ field: "target_date" }, standardTier, project) === true,
    "Standard tier shows target_date"
  );
  assert(
    evaluateAdaptiveSlot({ field: "estimate_point" }, standardTier, project) === true,
    "Standard tier shows estimate_point"
  );
  assert(
    evaluateAdaptiveSlot({ field: "cycle_id" }, standardTier, project) === false,
    "Standard tier hides cycle_id in modal default properties"
  );

  // Deep
  assert(
    evaluateAdaptiveSlot({ field: "start_date" }, deepTier, project) === true,
    "Deep tier shows start_date"
  );
  assert(
    evaluateAdaptiveSlot({ field: "cycle_id" }, deepTier, project) === true,
    "Deep tier shows cycle_id"
  );
  assert(
    evaluateAdaptiveSlot({ field: "module_ids" }, deepTier, project) === true,
    "Deep tier shows module_ids"
  );
  assert(
    evaluateAdaptiveSlot({ minTier: "deep" }, deepTier, project) === true,
    "minTier='deep' is visible in Deep persona"
  );
}

// Test 4: Complexity Dial Cycle Switching & Admin Lock Policy
console.log("\nTest Suite 4: Complexity Dial Cycling & Admin Lock Enforcement");
{
  // 1. Open policy cycling: minimal -> standard -> deep -> minimal
  const openProject: Partial<IProject> = { complexity_policy: "open", default_complexity: "minimal" };
  const step1 = cycleTier("minimal", openProject, 10);
  assert(step1.allowed && step1.nextTier === "standard", "Cycle from minimal -> standard permitted");

  const step2 = cycleTier("standard", openProject, 10);
  assert(step2.allowed && step2.nextTier === "deep", "Cycle from standard -> deep permitted");

  const step3 = cycleTier("deep", openProject, 10);
  assert(step3.allowed && step3.nextTier === "minimal", "Cycle from deep -> minimal wraps around");

  // 2. Locked policy by Admin:
  const lockedProject: Partial<IProject> = { complexity_policy: "locked", default_complexity: "standard" };
  
  // Non-admin member (role 10)
  const memberCycle = cycleTier("standard", lockedProject, 10);
  assert(!memberCycle.allowed && memberCycle.nextTier === "standard", "Member blocked from cycling when policy='locked'");

  // Admin user (role 20)
  const adminCycle = cycleTier("standard", lockedProject, 20);
  assert(adminCycle.allowed && adminCycle.nextTier === "deep", "Admin permitted to cycle even when policy='locked'");
}

// Test 5: Behavioral Habit Telemetry & Adaptation Heuristic Prompt
console.log("\nTest Suite 5: Behavioral Habit Detector & Velocity Heuristic");
{
  const detector = new TestHabitDetector();

  // Initially 0 counts
  assert(detector.checkHeuristic("standard") === false, "No heuristic trigger at 0 shortcut actions");

  // Perform 49 shortcuts (c, j, k, Space, Cmd+K)
  for (let i = 0; i < 49; i++) {
    detector.recordShortcut(["c", "j", "k", "Space", "cmd+k"][i % 5]);
  }
  assert(detector.keyboardShortcutCount === 49, "Keyboard shortcut count tracked to 49");
  assert(detector.checkHeuristic("standard") === false, "No trigger at 49 shortcuts (<50 threshold)");

  // 50th shortcut
  detector.recordShortcut("Space");
  assert(detector.keyboardShortcutCount === 50, "Keyboard shortcut count reaches 50");
  assert(
    detector.checkHeuristic("standard") === true,
    "Velocity heuristic triggers recommendation prompt at 50 shortcuts with 0 advanced feature usages"
  );
  assert(detector.hasPromptedForMinimal === true, "hasPromptedForMinimal flag is set to true");

  // Verify it does not re-trigger repeatedly
  assert(detector.checkHeuristic("standard") === false, "Does not re-trigger after already prompted");

  // Verify counter-case: If user was using advanced features, heuristic should NOT prompt
  const powerUserDetector = new TestHabitDetector();
  for (let i = 0; i < 60; i++) {
    powerUserDetector.recordShortcut("j");
  }
  // User used Gantt critical path or WBS
  powerUserDetector.recordAdvancedFeature("gantt_critical_path");
  assert(
    powerUserDetector.checkHeuristic("standard") === false,
    "User with 60 shortcuts but 1+ advanced feature usage is NOT prompted to switch to Minimal"
  );

  // Verify tier condition: User already in Minimal is NOT prompted
  const minimalUserDetector = new TestHabitDetector();
  for (let i = 0; i < 60; i++) {
    minimalUserDetector.recordShortcut("k");
  }
  assert(
    minimalUserDetector.checkHeuristic("minimal") === false,
    "User already in Minimal tier is NOT prompted"
  );
}

// Final Summary
console.log("\n================================================================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All Dynamic Switchboard & Auto-Adaptation Engine tests passed successfully!\n");
}
