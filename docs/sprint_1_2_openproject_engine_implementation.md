# Phase 1 - Sprint 1.2: Ingest OpenProject Engine (Enterprise Gantt, Cascading Dependencies & WBS)

## 1. Executive Summary
- **Sprint Target**: Ingest OpenProject-grade dependency math, cascading schedule adjustments, Critical Path analysis (Forward/Backward pass CPM), and Work Breakdown Structure (WBS) hierarchical numbering into Plane `v1.4.2`.
- **Rule Adherence**: Zero existing Plane views, components, stores, or backend models were deleted. All existing functionality remains 100% backward-compatible.
- **Implementation Status**: Complete, verified with an automated test suite (18/18 tests passing), OxLint checks passing, and types validated.

---

## 2. Backend Dependency Relationship & Dynamic WBS Support

### 2.1 Formal Dependency Types & Bidirectional Pairs
In `apps/api/plane/db/models/issue.py`:
- Extended `IssueRelationChoices` enum:
  - `PREDECESSOR = "predecessor", "Predecessor"`
  - `SUCCESSOR = "successor", "Successor"`
  - `FINISH_TO_START = "finish_to_start", "Finish to Start"` (default Gantt dependency)
  - `START_TO_START = "start_to_start", "Start to Start"`
  - `FINISH_TO_FINISH = "finish_to_finish", "Finish to Finish"`
- Extended `IssueRelationChoices._RELATION_PAIRS` and `_REVERSE_MAPPING`:
  - `("predecessor", "successor")`
  - `("successor", "predecessor")`
  - `("finish_to_start", "finish_to_start")`
  - `("start_to_start", "start_to_start")`
  - `("finish_to_finish", "finish_to_finish")`
- Increased `IssueRelation.relation_type` `max_length` from 20 to 30 to support full descriptor strings.

### 2.2 Dynamic Work Breakdown Structure (WBS) Computation
Implemented `Issue.get_wbs_number(self)` on the `Issue` model:
- Dynamically traverses the parent-child ancestry chain from root to the issue.
- Calculates hierarchical codes (e.g., `1.0` for root task 1, `1.1` for child 1, `1.2.1` for subtask 1 of child 2, `2.0` for root task 2).
- Respects project module and cycle boundaries when issues belong to modules or cycles.
- Features memoized caching (`_cached_wbs_number`) to prevent redundant database traversal.

### 2.3 Serializer Exposures
Exposed `wbs_number` as an optional computed field on:
- `IssueSerializer` (`apps/api/plane/app/serializers/issue.py`)
- `IssueListDetailSerializer` (`apps/api/plane/app/serializers/issue.py`)
- `IssueFlatSerializer` (`apps/api/plane/app/serializers/issue.py`)
- API `IssueSerializer` (`apps/api/plane/api/serializers/issue.py`)

---

## 3. Cascading Gantt Dependency Engine (Frontend)

### 3.1 Architectural Flow
Location: `apps/web/core/store/timeline/base-timeline.store.ts`

When a task bar is dragged or resized in the Gantt chart:
```
[User Drags / Resizes Task A in Gantt Chart]
                     │
                     ▼
 1. Recalculate Task A New Dates (`start_date`, `target_date`)
                     │
                     ▼
 2. Query Downstream Successors (`FINISH_TO_START`, `successor`, `blocking`)
                     │
                     ▼
 3. Date Violation Check:
    Is Task A's `target_date` pushed past Task B's `start_date`?
         │
         ├── Yes: Calculate matching delta: `deltaDays = ceil(A.target - B.start)`
         │        Shift Task B forward: `B.start += deltaDays`, `B.target += deltaDays`
         │        Update `blocksMap[B.id]` position immediately
         │        Recursively queue Task B to cascade through its successors (Task C...)
         └── No:  No shift required
                     │
                     ▼
 4. Dispatch All Updates via Optimistic Pipeline:
    `updateIssueDates(workspaceSlug, [Task A, Task B, Task C...], projectId)`
    • Synchronous `issueUpdate` for instant MobX reactivity
    • Background POST to `/api/workspaces/.../issue-dates/`
```

### 3.2 Visited Cycle Protection
Cycle detection is enforced using a `visited = new Set<string>()` guard during breadth-first traversal to prevent infinite loops in cyclic dependencies.

---

## 4. Critical Path Method (CPM) Highlighting

### 4.1 Forward & Backward Pass Algorithm
Location: `apps/web/core/components/gantt-chart/helpers/critical-path.ts`

1. **DAG Graph Construction**:
   - Each task node computes duration: `duration = max(1, (target_date - start_date) in days + 1)`.
   - Dependency edges are resolved via predecessors and successors.
2. **Forward Pass (Early Start & Early Finish)**:
   - For roots (in-degree 0): `ES = 0`, `EF = ES + duration`.
   - For successors: `ES = max(EF of all predecessors)`, `EF = ES + duration`.
   - Project Finish: `PF = max(EF of all tasks)`.
3. **Backward Pass (Late Start & Late Finish)**:
   - For terminal tasks (out-degree 0): `LF = PF`, `LS = LF - duration`.
   - For predecessors: `LF = min(LS of all successors)`, `LS = LF - duration`.
4. **Float / Slack Calculation**:
   - Total Float = `LS - ES`.
   - Critical tasks have zero float (`|slack| <= 0.01`) along the project-determining dependency sequence.

### 4.2 UI Controls & Visual Styling
- **Header Toggle**: Added toggle button `Show Critical Path` (`id="gantt-toggle-critical-path"`) to `GanttChartHeader` (`apps/web/core/components/gantt-chart/chart/header.tsx`).
- **Visual Accentuation**:
  - Critical tasks receive a distinctive high-contrast red accent ring with subtle glow:
    `ring-2 ring-red-500 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.5)] z-[10]`.
  - Non-critical tasks fade to `opacity-35` (restoring to `opacity-90` on hover) to accentuate the critical workflow.

---

## 5. Work Breakdown Structure (WBS) Display

### 5.1 Timeline & List Views
- **`IssueIdentifier` (`apps/web/core/components/issues/issue-detail/issue-identifier.tsx`)**:
  - Dynamically renders `[{wbs_number}]` in a styled mono badge next to the issue identifier (e.g., `[1.2.1] PROJ-42`).
  - Supports fallback hierarchical calculation for offline / client-created items.
  - Automatically reflected in:
    - **List View** (`components/issues/issue-layouts/list/block.tsx`)
    - **Timeline Sidebar** (`components/issues/issue-layouts/gantt/blocks.tsx`)
    - **Timeline Task Bar Label** (`IssueGanttBlock`)
    - **Spreadsheet & Kanban Blocks**

---

## 6. Verification & Test Suite

### 6.1 Automated Test Execution (`scripts/test-openproject-engine.ts`)
Run command: `pnpm dlx tsx scripts/test-openproject-engine.ts`
Results:
```
=======================================================
   SPRINT 1.2 OPENPROJECT ENGINE VERIFICATION SUITE   
=======================================================

[1] Testing Critical Path Analysis (CPM Algorithm)...
  PASS: Task A is on Critical Path
  PASS: Task B is on Critical Path
  PASS: Milestone E is on Critical Path
  PASS: Task C has slack/float and is NOT on Critical Path
  PASS: Task D has slack/float and is NOT on Critical Path

[2] Testing Cascading Gantt Dependency Engine...
  PASS: Task 2 is automatically shifted by cascade
  PASS: Task 2 new start_date is 2026-02-10 (got 2026-02-10)
  PASS: Task 2 duration preserved: target_date is 2026-02-14 (got 2026-02-14)
  PASS: Task 3 is recursively shifted by cascade
  PASS: Task 3 new start_date is 2026-02-14 (got 2026-02-14)
  PASS: Task 3 duration preserved: target_date is 2026-02-18 (got 2026-02-18)

[3] Testing Work Breakdown Structure (WBS) Numbering Engine...
  PASS: Root 1 WBS is 1.0
  PASS: Root 2 WBS is 2.0
  PASS: Child 1 of Root 1 is 1.1
  PASS: Child 2 of Root 1 is 1.2
  PASS: Subtask 1 of Child 2 is 1.2.1 ([1.2.1] PROJ-42)
  PASS: Subtask 2 of Child 2 is 1.2.2
  PASS: Child 1 of Root 2 is 2.1

=======================================================
   RESULTS: 18 / 18 TESTS PASSED
=======================================================
```

### 6.2 OxLint Static Verification
```bash
pnpm exec oxlint apps/web/core/store/timeline/base-timeline.store.ts \
                 apps/web/core/components/gantt-chart/helpers/critical-path.ts \
                 apps/web/core/components/gantt-chart/chart/header.tsx \
                 apps/web/core/components/gantt-chart/blocks/block.tsx \
                 apps/web/core/components/issues/issue-detail/issue-identifier.tsx \
                 apps/web/core/components/issues/issue-layouts/gantt/blocks.tsx
# Exit code 0, 0 errors.
```
