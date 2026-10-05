# Sprint 3.1: The 3 Adaptive Personas (Manifest Engine & Layout Profiles)

## 1. Overview & Objective
Sprint 3.1 codifies the **3 Adaptive Personas** (`minimal`, `standard`, `deep`) as reactive, declarative manifests within Plane v1.4.2. Rather than a one-size-fits-all tool, Plane dynamically adapts its visual density, navigation hierarchy, issue property surfaces, and calculation engines to match the exact operational velocity of the user and project.

CRITICAL ARCHITECTURAL GUARANTEES:
1. **Zero Data Loss**: Switching personas alters only visual density, navigation gating, and field exposure; all underlying data remains 100% intact.
2. **Governance Safeguard**: If an organization designates mandatory fields (`target_date`, `priority`, `assignees`, `estimate_point`, etc.), those fields **always remain visible and enforced**, preventing minimalist modes from degrading organizational compliance.
3. **No Code Deletion**: All existing Plane models, store properties, and layouts remain completely intact.

---

## 2. The 3 Adaptive Personas Specification

### 2.1 Minimal Persona: "Speed Flow" (Linear / Trello Archetype)
- **Target Audience**: Individual contributors, solo developers, and high-velocity engineering squads.
- **Navigation Set**: `["issues", "pages"]` (hides cycles, modules, views, analytics, and OKR tabs).
- **Default View**: Tactile Kanban Board (`kanban`).
- **Issue Card Density**: `compact_minimal` (clean title + state, zero badge clutter).
- **Visible Properties**: `["state", "priority", "assignees"]`.
- **Engine Rules**:
  - Daily Focus & Pomodoro scratchpad: `enabled`.
  - Cascading Gantt Critical Path & WBS numbering: `disabled`.

### 2.2 Standard Persona: "Collaborative" (Asana / Monday Archetype)
- **Target Audience**: Cross-functional product teams, engineering squads, and project coordinators.
- **Navigation Set**: `["issues", "cycles", "modules", "views", "pages"]`.
- **Default View**: Interactive List (`list`).
- **Issue Card Density**: `detailed_agile` (chips for labels, assignees, dates, and estimates).
- **Visible Properties**: `["state", "priority", "assignees", "due_date", "labels", "estimate"]`.
- **Engine Rules**:
  - Cycles, Modules, and Universal 3-State Normalizer: `enabled`.
  - Cascading Gantt Critical Path & WBS numbering: `disabled by default`.

### 2.3 Deep Persona: "Agile & Enterprise" (Jira / OpenProject Archetype)
- **Target Audience**: Program Managers, PMOs, Enterprise Architects, and multi-team programs.
- **Navigation Set**: `["issues", "cycles", "modules", "views", "pages", "goals", "analytics"]`.
- **Default View**: Timeline / Gantt (`timeline`).
- **Issue Card Density**: `detailed_agile` with WBS hierarchical code indicators.
- **Visible Properties**: `["state", "priority", "assignees", "start_date", "due_date", "labels", "estimate", "module", "cycle", "wbs"]`.
- **Engine Rules**:
  - Cascading Gantt math & Critical Path analysis: `enabled`.
  - WBS hierarchical numbering: `enabled`.
  - Leantime Strategic OKR rollups & Idea Sandbox: `enabled`.
  - Strict mandatory field enforcer: `active`.

---

## 3. Manifest Definition & Types

Location: `packages/types/src/adaptive.ts` (re-exported via `packages/types/src/index.ts`)

```typescript
export type ComplexityTier = "minimal" | "standard" | "deep";

export interface IPersonaManifest {
  tier: ComplexityTier;
  label: string;
  description: string;
  targetAudience: string;
  navigation: {
    visibleItems: string[];
    defaultView: "kanban" | "list" | "timeline";
  };
  issueProperties: {
    visibleFields: string[];
    cardDensity: "compact_minimal" | "detailed_agile";
  };
  views: {
    enableGanttCriticalPath: boolean;
    enableWbsDisplay: boolean;
    enableOkrRollup: boolean;
    enableFocusDrawer: boolean;
  };
}
```

Pre-compiled manifests:
- `MINIMAL_PERSONA`
- `STANDARD_PERSONA`
- `DEEP_PERSONA`
- `PERSONA_MANIFESTS: Record<ComplexityTier, IPersonaManifest>`

---

## 4. Adaptive Persona Store & Selector Hook

### 4.1 `AdaptivePersonaStore` (MobX)
Location: `apps/web/core/store/adaptive/adaptive-persona.store.ts`

- **Observables & Computed**:
  - `currentTier: ComplexityTier`: The active persona tier for the current user session (persisted via `localStorage`).
  - `activeManifest: IPersonaManifest`: Computed manifest matching `currentTier`.
  - `getEffectiveTier(project)`: Computes the effective tier. If `project.complexity_policy === "locked"`, the project's `default_complexity` strictly overrides individual user preference.
- **Evaluation Helpers**:
  - `isFieldVisible(fieldName, project)`: Checks if a field should render. **Mandatory organizational fields always return `true`**, safeguarding enterprise compliance across all complexity levels.
  - `isNavigationVisible(navKey, project)`: Checks if a sidebar navigation item is visible under the persona manifest and enabled engine switches.
  - `isFeatureAllowed(featureKey, project)`: Checks whether specialized engine calculations (Gantt critical path, WBS, OKR rollup) should execute.
  - `setTier(tier, project, userRole)`: Verifies permissions via `canUserToggleComplexity` before applying.

### 4.2 React Hook: `useAdaptivePersona()`
Location: `apps/web/core/hooks/store/use-adaptive-persona.ts` (re-exported via `apps/web/core/hooks/store/index.ts`)
- Provides reactive access to `currentTier`, `activeManifest`, and visibility helpers across any component in the tree.

---

## 5. Persona Preview Card Component

Location: `apps/web/core/components/adaptive/persona-preview-cards.tsx`

- **Visual Comparison UI**:
  - Renders 3 cards side-by-side with top accent gradients (Amber for Minimal, Blue for Standard, Purple for Deep).
  - Archetype badges and target audience indicators.
  - Interactive mini-UI wireframes illustrating sidebar item density and mock issue card layouts.
  - Live checklists of included features vs. streamlined-out clutter.
  - One-click persona activation connecting directly to project preset patching.
- **Settings Integration**:
  - Integrated as the primary preset selector in `apps/web/core/components/project/settings/features-switchboard.tsx`.

---

## 6. Verification & Automated Test Results

- **Automated Verification Script**: `scripts/test-adaptive-personas.ts`
  - `[Test 1] Persona Manifest Schema & Properties Verification`: PASS
  - `[Test 2] Effective Tier Resolution Logic (Policy Lock vs Member Preference)`: PASS
  - `[Test 3] Field Visibility & Mandatory Organizational Override`: PASS
  - `[Test 4] Navigation Gating & Engine Switch Overrides`: PASS
  - **Result: 4/4 tests passed (100%)**.
- **Linter & Code Quality**:
  - Verified with OxLint across all created and updated modules.
