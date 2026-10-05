# Phase 1 - Sprint 1.3: Ingest Vikunja Engine (Universal State Normalizer & Recursive Subtasks)

## 1. Executive Summary
- **Sprint Target**: Enrich Plane `v1.4.2` with Vikunja's Universal 3-State Normalization engine, infinite-depth recursive subtask trees with cumulative progress rollups, and inline markdown checklist-to-task elevation.
- **Rule Adherence**: Zero existing Plane state models (`backlog`, `unstarted`, `started`, `completed`, `cancelled`), issue fields, serializers, or editor extensions were deleted. All existing functionality remains 100% backward-compatible.
- **Verification Status**: Complete and verified with an automated test suite (`scripts/test-vikunja-engine.ts`, 18/18 assertions passing), TypeScript type checking passing (`pnpm --filter=web check:types` & `pnpm --filter=@plane/editor check:types`), and OxLint passing with 0 errors.

---

## 2. Universal 3-State Canonical Normalizer

### 2.1 Backend Canonical Mapping
In `apps/api/plane/db/models/state.py`:
- Added `CanonicalStateGroup` enum with three canonical primitives:
  - `UNSTARTED = "unstarted", "Unstarted"`
  - `IN_PROGRESS = "in_progress", "In Progress"`
  - `COMPLETED = "completed", "Completed"`
- Implemented `get_canonical_state_group(group: str) -> str`:
  - `backlog`, `unstarted`, `triage`, and custom planning states map to `unstarted`.
  - `started`, `in_progress`, `in-progress`, `active`, and custom QA/review states map to `in_progress`.
  - `completed`, `cancelled`, `done`, `closed`, and custom deployed states map to `completed`.
- Added computed property `canonical_group` to the `State` model.
- Exported `CanonicalStateGroup` and `get_canonical_state_group` in `plane/db/models/__init__.py`.

### 2.2 Serializers
- In `apps/api/plane/app/serializers/state.py`:
  - Added `canonical_group = serializers.CharField(read_only=True)` to `StateSerializer` and `StateLiteSerializer`.
- In `apps/api/plane/api/serializers/state.py`:
  - Added `canonical_group = serializers.CharField(read_only=True)` to API `StateSerializer` and `StateLiteSerializer`.

### 2.3 Types & Frontend Store
- In `packages/types/src/state.ts`:
  - Added `export type TCanonicalStateGroup = "unstarted" | "in_progress" | "completed";`
  - Added `canonical_group?: TCanonicalStateGroup;` to `IState` and `IStateLite`.
- In `apps/web/core/store/state.store.ts`:
  - Added `getCanonicalState(stateId: string | null | undefined): TCanonicalStateGroup` to `StateStore` and `IStateStore`.
  - Enables views and boards to collapse arbitrarily complex multi-status workflows into 3 clean canonical columns.

---

## 3. Recursive Subtask Trees & Cumulative Progress Rollup

### 3.1 Backend Recursive Trees & Progress Math
In `apps/api/plane/db/models/issue.py`:
- Enabled infinite-depth recursive hierarchy on `Issue`:
  - `get_sub_issue_tree(self, max_depth=20)`: Recursively builds full nested tree of descendants:
    ```json
    {
      "id": "...",
      "name": "...",
      "sequence_id": 1,
      "state_id": "...",
      "state_group": "...",
      "canonical_group": "unstarted" | "in_progress" | "completed",
      "children": [...]
    }
    ```
    Includes cycle detection (`visited` set) to protect against circular parent graphs.
  - `get_cumulative_progress(self, max_depth=20)`: Calculates:
    - `sub_issues_count`: Direct child count.
    - `total_sub_issues_count`: Total count of all recursive descendants across infinite depth.
    - `completed_sub_issues_count`: Total count of all completed recursive descendants.
    - `percent`: Cumulative progress percentage (`(completed / total) * 100`).
  - Added computed properties on `Issue`:
    - `total_sub_issues_count`
    - `completed_sub_issues_count`
  - Added module-level helper functions `get_sub_issue_tree(issue_id)` and `get_cumulative_progress(issue_id)`.
  - Exported helpers in `plane/db/models/__init__.py`.

### 3.2 Serializer Exposures
- In `apps/api/plane/app/serializers/issue.py`:
  - Exposed `total_sub_issues_count` and `completed_sub_issues_count` in `IssueSerializer`, `IssueStateSerializer`, `IssueListDetailSerializer`, and `IssueFlatSerializer`.
- In `apps/api/plane/api/serializers/issue.py`:
  - Exposed `total_sub_issues_count` and `completed_sub_issues_count` in API `IssueSerializer`.
- In `packages/types/src/issues/issue.ts`:
  - Added `total_sub_issues_count?: number | null;` and `completed_sub_issues_count?: number | null;` to `TBaseIssue`.

### 3.3 Frontend Cumulative Rollup Display
- **Task Cards** (`apps/web/core/components/issues/issue-layouts/properties/all-properties.tsx`):
  - When an issue has nested subtasks (`total_sub_issues_count > sub_issues_count`), the sub-issues badge displays cumulative progress:
    - Badge: `${completed_sub_issues_count}/${total_sub_issues_count}`
    - Tooltip: `${completed_sub_issues_count}/${total_sub_issues_count} sub-items (${percent}%)`
  - If only direct children exist, displays standard `${sub_issues_count}` count.
- **Detail View & Collapsible Title** (`apps/web/core/components/issues/issue-detail-widgets/sub-issues/title.tsx`):
  - Displays cumulative progress rollup indicator:
    - `${completedCount}/${totalCount} sub-items (${percentage}%)` with circular progress bar.

---

## 4. Markdown Checklist-to-Task Elevation

### 4.1 TipTap Editor Extension
Location: `packages/editor/src/core/extensions/task-item/`
- Implemented `CustomTaskItemExtension` and `TaskItemComponent`:
  - Renders interactive checklist items with checkbox and markdown-compatible `task-item-content`.
  - When hovering over a checklist item (`- [ ]`), displays a sleek "Elevate to Work Item" action button with `ArrowUpRight` icon.
  - Clicking the icon:
    1. Extracts the checklist item text.
    2. Dispatches `plane:elevate-checklist-item` with event detail payload.
    3. Receives created child issue metadata.
    4. Automatically replaces/annotates the checklist item with an inline issue link badge (`#PROJ-XX Title`).

### 4.2 Description Input Elevation Handler
Location: `apps/web/core/components/editor/rich-text/description-input/root.tsx`
- Listens to `plane:elevate-checklist-item`:
  - Invokes `IssueService.createIssue()` with `{ name: cleanTitle, parent_id: entityId }`.
  - Retrieves the project identifier and generated sequence ID.
  - Returns formatted badge `#${identifier}-${sequence_id} ${cleanTitle}`.
  - Automatically triggers autosave of the updated description with the new reference badge.

---

## 5. Verification & Testing

### 5.1 Automated Test Suite
Test script: `scripts/test-vikunja-engine.ts`
```bash
pnpm dlx tsx scripts/test-vikunja-engine.ts
```
Results:
- **Test 1**: Universal 3-State Normalizer Primitives — PASSED (11/11 state categories verified).
- **Test 2**: Infinite-Depth Recursive Subtask Trees — PASSED (4 levels of nesting verified).
- **Test 3**: Cumulative Progress Rollup Math — PASSED (Root 5/8 63%, Nested 3/4 75% verified).
- **Test 4**: Circular Reference Protection — PASSED (Cycle detection verified).
- **Test 5**: Checklist Elevation — PASSED (Parameter payload & inline badge verified).
- **Total Assertions**: 18/18 PASSED.

### 5.2 Build & Type Checking
- `@plane/types`: Rebuilt cleanly with `tsdown`.
- `@plane/editor`: Built cleanly with `tsc && tsdown` (Exit code 0).
- `@plane/web`: `pnpm --filter=web check:types` passed with 0 errors (Exit code 0).
- OxLint: `pnpm --filter=web check:lint` and `pnpm --filter=@plane/editor check:lint` passed with 0 errors (Exit code 0).
