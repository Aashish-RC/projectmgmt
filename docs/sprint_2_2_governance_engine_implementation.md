# Sprint 2.2: Governance & Permissions Matrix (Open, Bounded, Locked Policies & Mandatory Field Enforcer)

## 1. Overview & Objective
Sprint 2.2 establishes an organizational governance and permissions architecture within Plane v1.4.2 without altering any existing RBAC roles or breaking existing workflows. It introduces:
1. **3-Tier Complexity Governance Policies** (`open`, `bounded`, `locked`) to control whether members can toggle their individual workspace/project complexity tier.
2. **Mandatory Field Enforcer** to safeguard required organizational fields (e.g., target date, priority, assignees, estimates, modules, cycles) across all complexity levels, especially minimalist modes.
3. **Dual Validation Guards**:
   - **Backend**: Strict DRF serializer validation preventing issue creation and terminal state transitions (`completed`, `cancelled`) when required fields are missing.
   - **Client-Side**: Clean, real-time toast feedback on form submit and quick status transitions before network dispatch.

---

## 2. Governance Policy Matrix

| Policy | Description | Member Autonomy | Mandatory Fields Enforced? |
| :--- | :--- | :--- | :--- |
| `open` | Full member autonomy | Members can freely toggle complexity tier (`minimal`, `standard`, `deep`) | No (advisory only) |
| `bounded` **(Default)** | Adaptive layouts with guardrails | Members can adapt layout/density, but mandatory organizational fields are strictly enforced | **Yes** (on creation and terminal transitions) |
| `locked` | Strict organization standard | All members are locked to the project default complexity tier; only admins can adjust | **Yes** (strictly enforced for all) |

### Permissions Helper
- **`canUserToggleComplexity(project, userRole)`**:
  - Admins (role `>= 20`, or role string `"admin"`, `"owner"`) can **always** toggle complexity.
  - Regular members (role `15`) can toggle only when `project.complexity_policy === "open"`.
  - In `bounded` and `locked` modes, members use the project-designated default baseline.

---

## 3. Mandatory Fields Enforcer

Organizations can select any subset of standard project properties to enforce:
- **Target Date** (`target_date`, `due_date`): Work items must specify an explicit deadline before completion.
- **Priority** (`priority`): Priority must be set to `Urgent`, `High`, `Medium`, or `Low` (not `None`).
- **Assignees** (`assignees`, `assignee_ids`): At least one active project member must be assigned.
- **Estimate / Points** (`estimate_point`, `estimate`): Story point sizing required for capacity planning.
- **Module** (`module`): Work item must be associated with a project module / epic.
- **Cycle** (`cycle`): Work item must be scheduled in a cycle / sprint.

### Enforcement Rules:
- **Non-Terminal Updates (In-Progress)**: Permitted freely so developers can create drafts, adjust descriptions, and log progress without blocking intermediate work.
- **Terminal State Transitions (`completed`, `cancelled`)**: Blocked if any configured mandatory field is missing.
- **Creation of Issues**: Blocked if mandatory fields are missing when in `bounded` or `locked` modes.

---

## 4. Backend Implementation

### 4.1 Model Extensions
- **`Project` Model** (`apps/api/plane/db/models/project.py`):
  ```python
  POLICY_CHOICES = (
      ("open", "Open"),
      ("bounded", "Bounded"),
      ("locked", "Locked"),
  )
  complexity_policy = models.CharField(max_length=20, choices=POLICY_CHOICES, default="bounded")
  mandatory_fields = models.JSONField(default=list, blank=True)
  ```
- **`Workspace` Model** (`apps/api/plane/db/models/workspace.py`):
  Extended with `complexity_policy` and `mandatory_fields` to support workspace-level governance defaults.

### 4.2 DRF Serializer Validation
- **`IssueCreateSerializer`** (`apps/api/plane/app/serializers/issue.py`):
  - Extends `validate()` to intercept creation and updates.
  - When `project.complexity_policy in ["bounded", "locked"]`, checks whether the issue is being created or transitioning to a terminal group (`completed`, `cancelled`).
  - Raises `serializers.ValidationError({"mandatory_fields": missing, "error": "..."})` if any field is empty.

---

## 5. Frontend Types, Store & Guard Implementation

### 5.1 `@plane/types`
- Added `TComplexityPolicy = "open" | "bounded" | "locked"` to `packages/types/src/project/projects.ts`.
- Extended `IPartialProject`, `IProject`, and `IWorkspace` with `complexity_policy?: TComplexityPolicy` and `mandatory_fields?: string[]`.
- Rebuilt `@plane/types` distribution artifacts.

### 5.2 Store Helpers
- Added `canUserToggleComplexity` to `IProjectStore` and exported standalone helper from `apps/web/core/store/project/index.ts`.

### 5.3 Client Guard Utility (`apps/web/core/lib/governance-guard.ts`)
- Reusable `checkMandatoryFieldsGuard(project, issueData, { isCreation, targetStateGroup })`.
- Displays clean, user-friendly toast:
  - *Title*: `Required by project policy`
  - *Message*: `Please specify [Field Name] before proceeding.`

### 5.4 Form & Status Integration
- **Issue Modal Form** (`apps/web/core/components/issues/issue-modal/form.tsx`):
  Guards `handleFormSubmit` on creation and updates.
- **Issue Layouts Table / List Properties** (`apps/web/core/components/issues/issue-layouts/properties/all-properties.tsx`):
  Guards `handleState` when clicking state dropdowns across all view layouts.
- **Issue Detail Sidebar** (`apps/web/core/components/issues/issue-detail/sidebar.tsx`):
  Guards `StateDropdown` onChange handler.

---

## 6. Admin UI: Features Switchboard Integration
Location: `apps/web/core/components/project/settings/features-switchboard.tsx`
- **Complexity Governance Policy Section**:
  - 3 interactive cards with policy status badges and descriptions (`Open`, `Bounded (Recommended)`, `Locked`).
  - Optimistic patch dispatch via `updateProject`.
- **Mandatory Field Enforcer Section**:
  - Interactive chip cards for all 6 properties with icons and active state indicators (`CheckSquare` / `Square`).
  - Real-time count of active enforced fields (`N of 6 Enforced`).
  - Instant optimistic project settings sync.

---

## 7. Verification & Automated Test Results
- **Automated Verification Script**: `scripts/test-governance-engine.ts`
  - `[Test 1] Project Governance Policy Schema & Defaults Verification`: PASS
  - `[Test 2] Complexity Toggle Permissions Matrix Evaluation`: PASS
  - `[Test 3] Mandatory Field Enforcer & Terminal Transition Validation`: PASS
  - `[Test 4] Patch Serialization & Enforcer Key Space`: PASS
  - **Result: 4/4 tests passed (100%)**.
- **Linter & Code Quality**:
  - Verified with OxLint and TypeScript builds.
