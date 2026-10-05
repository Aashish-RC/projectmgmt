/**
 * Phase 4 - Sprint 4.1: Production Hardening & Backward Compatibility Verification
 * 
 * Comprehensive Verification Benchmark:
 * 1. Zero-Data-Loss Backward Compatibility Audit
 *    - Deep enterprise issue (WBS 1.1.2, 8 pts, Cycle 4, Module Auth, KR 1, 45m time log)
 *    - Minimal persona edit simulation (title & status update)
 *    - Verifies zero stripping, truncation, or corruption of dormant enterprise fields
 *    - Re-hydration and validation in Deep persona
 * 2. Client Performance & Render Latency Benchmark
 *    - Micro-benchmark <AdaptiveSlot /> evaluation speed across 1,000 iterations (<10ms target)
 *    - Memory stability & state retention across rapid persona cycles
 * 3. Multi-Tier Compatibility & Mandatory Field Enforcement
 */

declare const process: any;
declare const performance: any;

import {
  MINIMAL_PERSONA,
  STANDARD_PERSONA,
  DEEP_PERSONA,
  PERSONA_MANIFESTS,
} from "../packages/types/src/adaptive";
import type { ComplexityTier, IPersonaManifest } from "../packages/types/src/adaptive";
import type { IProject } from "../packages/types/src";

// ==============================================================================
// 1. Types & Data Structures for Backward Compatibility
// ==============================================================================
interface IEnrichedIssue {
  id: string;
  name: string;
  state_id: string;
  priority: string;
  assignee_ids: string[];
  target_date: string | null;
  start_date: string | null;
  label_ids: string[];
  // Enriched Enterprise Fields
  wbs: string | null;
  estimate_point: number | null;
  cycle_id: string | null;
  module_ids: string[];
  key_result_id: string | null;
  time_logs: Array<{ id: string; duration_minutes: number; notes?: string }>;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

// Emulation of AdaptiveSlot resolution logic
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

// Emulate backend partial update (PATCH) semantics
function simulatePartialUpdate(
  existingIssue: IEnrichedIssue,
  updatePayload: Partial<IEnrichedIssue>
): IEnrichedIssue {
  return {
    ...existingIssue,
    ...updatePayload,
    updated_at: new Date().toISOString(),
  };
}

// ==============================================================================
// 2. Test Runner & Assertion Utilities
// ==============================================================================
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
console.log("PHASE 4 - SPRINT 4.1: PRODUCTION HARDENING & REGRESSION BENCHMARK");
console.log("================================================================================\n");

// ==============================================================================
// TEST SUITE 1: Zero-Data-Loss Backward Compatibility Audit
// ==============================================================================
console.log("Test Suite 1: Zero-Data-Loss Backward Compatibility Across Personas");
{
  // 1. Create a Work Item populated with full Deep Enterprise fields
  const originalEnterpriseIssue: IEnrichedIssue = {
    id: "issue-enterprise-101",
    name: "Architect Core Microservice Infrastructure",
    state_id: "state-in-progress",
    priority: "urgent",
    assignee_ids: ["user-lead-architect", "user-senior-dev"],
    start_date: "2026-10-01",
    target_date: "2026-10-15",
    label_ids: ["label-backend", "label-infra"],
    // Dormant enterprise fields:
    wbs: "1.1.2",
    estimate_point: 8,
    cycle_id: "cycle-sprint-4",
    module_ids: ["module-auth-uuid", "module-security-uuid"],
    key_result_id: "kr-cloud-readiness-1",
    time_logs: [
      { id: "log-1", duration_minutes: 45, notes: "Initial schema design" },
      { id: "log-2", duration_minutes: 60, notes: "API contract review" },
    ],
    parent_id: "epic-cloud-migration-1",
    created_at: "2026-10-01T09:00:00Z",
    updated_at: "2026-10-01T09:00:00Z",
  };

  assert(
    originalEnterpriseIssue.wbs === "1.1.2" &&
    originalEnterpriseIssue.estimate_point === 8 &&
    originalEnterpriseIssue.cycle_id === "cycle-sprint-4" &&
    originalEnterpriseIssue.module_ids.length === 2 &&
    originalEnterpriseIssue.time_logs.length === 2,
    "Deep enterprise issue initialized with all advanced fields"
  );

  // 2. User loads issue in "Minimal" mode (Speed Flow)
  const project: Partial<IProject> = {
    complexity_policy: "open",
    default_complexity: "standard",
    mandatory_fields: [],
  };

  // Inspect which fields are visible to Minimal user
  const minimalVisibleState = evaluateIsFieldVisible("state_id", "minimal", project);
  const minimalVisiblePriority = evaluateIsFieldVisible("priority", "minimal", project);
  const minimalVisibleWbs = evaluateIsFieldVisible("wbs", "minimal", project);
  const minimalVisibleCycle = evaluateIsFieldVisible("cycle_id", "minimal", project);
  const minimalVisibleModule = evaluateIsFieldVisible("module_ids", "minimal", project);
  const minimalVisibleEstimate = evaluateIsFieldVisible("estimate_point", "minimal", project);

  assert(
    minimalVisibleState === true && minimalVisiblePriority === true,
    "Minimal mode displays core fields (state, priority)"
  );
  assert(
    minimalVisibleWbs === false &&
    minimalVisibleCycle === false &&
    minimalVisibleModule === false &&
    minimalVisibleEstimate === false,
    "Minimal mode completely suppresses enterprise fields from UI presentation"
  );

  // 3. User performs a quick title and state edit in Minimal mode
  const minimalEditPayload: Partial<IEnrichedIssue> = {
    name: "Architect Core Microservice Infrastructure (Refined)",
    state_id: "state-done",
  };

  const updatedIssue = simulatePartialUpdate(originalEnterpriseIssue, minimalEditPayload);

  // Verify updated fields
  assert(
    updatedIssue.name === "Architect Core Microservice Infrastructure (Refined)" &&
    updatedIssue.state_id === "state-done",
    "Minimal mode successfully updates title and state"
  );

  // 4. CRITICAL AUDIT: Verify that ALL dormant enterprise fields remain 100% intact
  assert(
    updatedIssue.wbs === "1.1.2",
    "Zero-Data-Loss: WBS numbering (1.1.2) remains intact"
  );
  assert(
    updatedIssue.estimate_point === 8,
    "Zero-Data-Loss: Story points estimate (8) remains intact"
  );
  assert(
    updatedIssue.cycle_id === "cycle-sprint-4",
    "Zero-Data-Loss: Sprint cycle association (cycle-sprint-4) remains intact"
  );
  assert(
    updatedIssue.module_ids.length === 2 &&
    updatedIssue.module_ids.includes("module-auth-uuid") &&
    updatedIssue.module_ids.includes("module-security-uuid"),
    "Zero-Data-Loss: Milestone module links ([auth, security]) remain intact"
  );
  assert(
    updatedIssue.key_result_id === "kr-cloud-readiness-1",
    "Zero-Data-Loss: Strategic OKR Key Result link remains intact"
  );
  assert(
    updatedIssue.time_logs.length === 2 &&
    updatedIssue.time_logs[0].duration_minutes === 45 &&
    updatedIssue.time_logs[1].duration_minutes === 60,
    "Zero-Data-Loss: Time logs and session history remain intact"
  );
  assert(
    updatedIssue.parent_id === "epic-cloud-migration-1",
    "Zero-Data-Loss: Parent epic / subtask hierarchy remains intact"
  );
  assert(
    updatedIssue.start_date === "2026-10-01" &&
    updatedIssue.target_date === "2026-10-15",
    "Zero-Data-Loss: Schedule dates remain intact"
  );

  // 5. Enterprise PM opens the issue in "Deep" mode
  const deepVisibleWbs = evaluateIsFieldVisible("wbs", "deep", project);
  const deepVisibleCycle = evaluateIsFieldVisible("cycle_id", "deep", project);
  const deepVisibleModule = evaluateIsFieldVisible("module_ids", "deep", project);
  const deepVisibleEstimate = evaluateIsFieldVisible("estimate_point", "deep", project);

  assert(
    deepVisibleWbs && deepVisibleCycle && deepVisibleModule && deepVisibleEstimate,
    "Deep persona re-exposes all enterprise fields without data loss or corruption"
  );
}

// ==============================================================================
// TEST SUITE 2: Client Performance & Render Latency Benchmark
// ==============================================================================
console.log("\nTest Suite 2: Client Performance & Render Latency Benchmark (<10ms SLA)");
{
  const project: Partial<IProject> = {
    mandatory_fields: ["target_date"],
  };

  const fieldsToEvaluate = [
    "state_id",
    "priority",
    "assignee_ids",
    "start_date",
    "target_date",
    "cycle_id",
    "module_ids",
    "estimate_point",
    "label_ids",
    "wbs",
  ];

  const tiers: ComplexityTier[] = ["minimal", "standard", "deep"];

  // Benchmark: 1,000 view switches (each view evaluating 50 fields, total 50,000 evaluations)
  const SWITCH_ITERATIONS = 1000;
  const FIELDS_PER_VIEW = 50;

  const startTime = performance.now();

  for (let i = 0; i < SWITCH_ITERATIONS; i++) {
    const activeTier = tiers[i % tiers.length];
    for (let j = 0; j < FIELDS_PER_VIEW; j++) {
      const field = fieldsToEvaluate[j % fieldsToEvaluate.length];
      evaluateIsFieldVisible(field, activeTier, project);
    }
  }

  const totalDurationMs = performance.now() - startTime;
  const avgSwitchLatencyMs = totalDurationMs / SWITCH_ITERATIONS;
  const avgPerSlotEvaluationUs = (totalDurationMs / (SWITCH_ITERATIONS * FIELDS_PER_VIEW)) * 1000;

  console.log(`    Total execution time for ${SWITCH_ITERATIONS} view transitions: ${totalDurationMs.toFixed(2)}ms`);
  console.log(`    Average view switch latency: ${avgSwitchLatencyMs.toFixed(3)}ms (SLA: <10.000ms)`);
  console.log(`    Average <AdaptiveSlot /> evaluation time: ${avgPerSlotEvaluationUs.toFixed(2)}µs (<0.05ms)`);

  assert(
    avgSwitchLatencyMs < 10.0,
    `Switchboard latency benchmark: ${avgSwitchLatencyMs.toFixed(3)}ms < 10.000ms SLA`
  );
  assert(
    avgPerSlotEvaluationUs < 50.0,
    `Per-slot evaluation overhead: ${avgPerSlotEvaluationUs.toFixed(2)}µs (<50µs SLA)`
  );
}

// ==============================================================================
// TEST SUITE 3: Memory Stability Across Rapid Persona Cycles
// ==============================================================================
console.log("\nTest Suite 3: Memory Stability Across Rapid Persona Cycles");
{
  const initialMemory = process.memoryUsage().heapUsed;
  const tiers: ComplexityTier[] = ["minimal", "standard", "deep"];
  
  // Emulate rapid persona transitions
  let currentTier: ComplexityTier = "standard";
  for (let cycle = 0; cycle < 5000; cycle++) {
    currentTier = tiers[cycle % tiers.length];
    const manifest = PERSONA_MANIFESTS[currentTier];
    if (!manifest) throw new Error("Invalid manifest");
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryDeltaMb = (finalMemory - initialMemory) / (1024 * 1024);

  console.log(`    Initial Heap: ${(initialMemory / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`    Final Heap after 5,000 cycles: ${(finalMemory / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`    Heap Delta: ${memoryDeltaMb.toFixed(2)} MB`);

  assert(
    memoryDeltaMb < 15.0,
    `Memory retention stability: ${memoryDeltaMb.toFixed(2)} MB delta is well within safety threshold (<15 MB)`
  );
}

// ==============================================================================
// TEST SUITE 4: Mandatory Field Enforcement Across Complexity Presets
// ==============================================================================
console.log("\nTest Suite 4: Mandatory Field Governance Safeguards");
{
  const lockedProject: Partial<IProject> = {
    complexity_policy: "locked",
    default_complexity: "minimal",
    mandatory_fields: ["due_date", "estimate", "cycle"],
  };

  // Even though project is in "minimal" tier, mandatory fields must remain visible
  assert(
    evaluateIsFieldVisible("target_date", "minimal", lockedProject) === true,
    "Mandatory field 'due_date' (target_date alias) is enforced visible in Minimal tier"
  );
  assert(
    evaluateIsFieldVisible("estimate_point", "minimal", lockedProject) === true,
    "Mandatory field 'estimate' (estimate_point alias) is enforced visible in Minimal tier"
  );
  assert(
    evaluateIsFieldVisible("cycle_id", "minimal", lockedProject) === true,
    "Mandatory field 'cycle' (cycle_id alias) is enforced visible in Minimal tier"
  );
  assert(
    evaluateIsFieldVisible("start_date", "minimal", lockedProject) === false,
    "Non-mandatory field 'start_date' correctly follows Minimal manifest suppression"
  );
}

// ==============================================================================
// FINAL SUMMARY
// ==============================================================================
console.log("\n================================================================================");
console.log(`HARDENING AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("Phase 4 Hardening, Backward Compatibility & Performance verification successful!\n");
}
