/**
 * Automated Verification Script for Phase 3 - Sprint 3.1: Adaptive Personas Manifest Engine
 * Tests:
 * 1. Persona Manifest Schema & Properties across all 3 tiers
 * 2. Effective Tier Resolution (User Preference vs Project Baseline vs Governance Policy)
 * 3. Field Visibility & Mandatory Organizational Override
 * 4. Navigation Gating & Engine Switch Overrides
 */

import {
  MINIMAL_PERSONA,
  STANDARD_PERSONA,
  DEEP_PERSONA,
  PERSONA_MANIFESTS,
} from "../packages/types/src/adaptive";
import type { ComplexityTier, IPersonaManifest, IProject } from "../packages/types/src/adaptive";

// Inlined resolution and visibility logic matching AdaptivePersonaStore
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

function isFieldVisible(
  fieldName: string,
  effectiveTier: ComplexityTier,
  project?: Partial<IProject> | null
): boolean {
  const fieldKey = fieldName.toLowerCase().trim();

  // 1. Mandatory fields ALWAYS override and remain visible
  if (project?.mandatory_fields && project.mandatory_fields.length > 0) {
    const isMandatory = project.mandatory_fields.some(
      (f) => f.toLowerCase().trim() === fieldKey
    );
    if (isMandatory) return true;
  }

  // 2. Persona manifest rules
  const manifest = PERSONA_MANIFESTS[effectiveTier];
  return manifest.issueProperties.visibleFields.includes(fieldKey);
}

function isNavigationVisible(
  navKey: string,
  effectiveTier: ComplexityTier,
  project?: Partial<IProject> | null
): boolean {
  const key = navKey.toLowerCase().trim();

  // Engine switches
  if (key === "goals" && project && project.is_strategic_okr_enabled === false) {
    return false;
  }
  if (key === "gantt" && project && project.is_cascading_gantt_enabled === false) {
    return false;
  }

  const manifest = PERSONA_MANIFESTS[effectiveTier];
  return manifest.navigation.visibleItems.includes(key);
}

async function runAdaptivePersonaTests() {
  console.log("=== SPRINT 3.1: ADAPTIVE PERSONAS MANIFEST ENGINE VERIFICATION ===\n");

  let passedTests = 0;
  const totalTests = 4;

  // [Test 1] Persona Manifest Schema Verification
  console.log("[Test 1] Persona Manifest Schema & Properties Verification");
  const tiers: ComplexityTier[] = ["minimal", "standard", "deep"];

  for (const tier of tiers) {
    const manifest = PERSONA_MANIFESTS[tier];
    if (!manifest) throw new Error(`Missing manifest for tier: ${tier}`);
    if (manifest.tier !== tier) throw new Error(`Manifest tier mismatch: ${manifest.tier} vs ${tier}`);
    if (!manifest.label || !manifest.description || !manifest.targetAudience) {
      throw new Error(`Incomplete metadata in manifest for ${tier}`);
    }
  }

  // Minimal profile assertions
  if (MINIMAL_PERSONA.issueProperties.cardDensity !== "compact_minimal") {
    throw new Error("Minimal persona must use compact_minimal card density");
  }
  if (MINIMAL_PERSONA.views.enableGanttCriticalPath !== false) {
    throw new Error("Minimal persona must disable Gantt Critical Path");
  }

  // Deep profile assertions
  if (DEEP_PERSONA.views.enableGanttCriticalPath !== true || DEEP_PERSONA.views.enableWbsDisplay !== true) {
    throw new Error("Deep persona must enable Critical Path and WBS Display");
  }
  if (!DEEP_PERSONA.navigation.visibleItems.includes("goals")) {
    throw new Error("Deep persona must include 'goals' in visibleItems");
  }

  console.log("  PASS: All 3 persona manifests correctly defined with explicit view/card rules.");
  passedTests++;

  // [Test 2] Effective Tier Resolution Logic
  console.log("\n[Test 2] Effective Tier Resolution Logic (Policy Lock vs Member Preference)");
  
  // Case A: Locked policy overrides member preference
  const lockedProject: Partial<IProject> = {
    default_complexity: "standard",
    complexity_policy: "locked",
  };
  const resolvedA = resolveEffectiveTier("minimal", lockedProject);
  if (resolvedA !== "standard") {
    throw new Error(`Locked project failed to enforce default_complexity. Expected 'standard', got '${resolvedA}'`);
  }

  // Case B: Bounded policy allows member preferred tier
  const boundedProject: Partial<IProject> = {
    default_complexity: "deep",
    complexity_policy: "bounded",
  };
  const resolvedB = resolveEffectiveTier("minimal", boundedProject);
  if (resolvedB !== "minimal") {
    throw new Error(`Bounded project should allow member preference. Expected 'minimal', got '${resolvedB}'`);
  }

  // Case C: Open policy allows member preferred tier
  const openProject: Partial<IProject> = {
    default_complexity: "standard",
    complexity_policy: "open",
  };
  const resolvedC = resolveEffectiveTier("deep", openProject);
  if (resolvedC !== "deep") {
    throw new Error(`Open project should allow member preference. Expected 'deep', got '${resolvedC}'`);
  }

  console.log("  PASS: Governance policy resolution accurately enforces locking and respects member autonomy.");
  passedTests++;

  // [Test 3] Field Visibility & Mandatory Organizational Override
  console.log("\n[Test 3] Field Visibility & Mandatory Organizational Override");

  // In minimal mode without mandatory fields, 'estimate' and 'due_date' are hidden
  const standardGovProject: Partial<IProject> = {
    mandatory_fields: [],
  };
  if (isFieldVisible("estimate", "minimal", standardGovProject)) {
    throw new Error("Estimate field should be hidden in minimal mode by default");
  }
  if (!isFieldVisible("state", "minimal", standardGovProject)) {
    throw new Error("State field must be visible in minimal mode");
  }

  // If 'estimate' is added to mandatory_fields, it MUST become visible even in minimal mode!
  const enforcedProject: Partial<IProject> = {
    mandatory_fields: ["estimate", "due_date"],
  };
  if (!isFieldVisible("estimate", "minimal", enforcedProject)) {
    throw new Error("Mandatory estimate field must be visible even under minimal persona");
  }
  if (!isFieldVisible("due_date", "minimal", enforcedProject)) {
    throw new Error("Mandatory due_date field must be visible even under minimal persona");
  }

  console.log("  PASS: Minimal mode stream-lines clutter, while mandatory fields successfully force visibility.");
  passedTests++;

  // [Test 4] Navigation Gating & Engine Switch Overrides
  console.log("\n[Test 4] Navigation Gating & Engine Switch Overrides");

  // In minimal mode, cycles and modules are hidden
  if (isNavigationVisible("cycles", "minimal")) {
    throw new Error("Cycles navigation must be hidden in minimal persona");
  }
  if (isNavigationVisible("modules", "minimal")) {
    throw new Error("Modules navigation must be hidden in minimal persona");
  }
  if (!isNavigationVisible("issues", "minimal")) {
    throw new Error("Issues navigation must be visible in minimal persona");
  }

  // In deep mode, goals is visible IF is_strategic_okr_enabled is true
  const projectWithOkrs: Partial<IProject> = {
    is_strategic_okr_enabled: true,
  };
  if (!isNavigationVisible("goals", "deep", projectWithOkrs)) {
    throw new Error("Goals navigation should be visible in deep persona when engine enabled");
  }

  // If engine switch is disabled, goals is hidden even in deep mode
  const projectWithoutOkrs: Partial<IProject> = {
    is_strategic_okr_enabled: false,
  };
  if (isNavigationVisible("goals", "deep", projectWithoutOkrs)) {
    throw new Error("Goals navigation must be hidden when is_strategic_okr_enabled is false");
  }

  console.log("  PASS: Navigation correctly pruned by persona manifest and respects enriched engine switches.");
  passedTests++;

  console.log("\n========================================================");
  console.log(`ALL SPRINT 3.1 TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests} tests)`);
  console.log("========================================================\n");
}

runAdaptivePersonaTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
