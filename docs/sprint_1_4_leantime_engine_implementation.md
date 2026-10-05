# Sprint 1.4: Ingest Leantime Engine (Strategic OKRs, Goals & Idea Validation Sandbox)

## 1. Executive Summary
Sprint 1.4 successfully introduces **Leantime's strategic management layer** directly into Plane `v1.4.2` without altering or removing any existing models or workflows. This bridges high-level organizational strategy with tactical sprint delivery by introducing:
1. **Objectives & Key Results (OKRs)**: Strategic goals linked directly to delivery cycles and modules with automated progress rollups calculated from work item completions.
2. **Idea & Hypothesis Validation Sandbox**: A visual **Impact vs. Effort 2x2 Matrix** with 1-click conversion into actionable Plane work items (Issues) or feature modules.
3. **Reactive Frontend Experience**: Integrated MobX `OkrStore`, project sidebar navigation (`Goals & OKRs`), dynamic health badges, and animated progress meters.

---

## 2. Architecture & Data Model

### 2.1 Backend Strategic Models (`apps/api/plane/db/models/strategic.py`)
- **`Objective`** (`ProjectBaseModel`):
  - Fields: `title`, `description`, `start_date`, `target_date`, `status` (`on_track`, `at_risk`, `behind`, `completed`), `owner`.
  - Properties: `progress` (dynamic aggregate rollup across child key results), `key_results_count`.
- **`KeyResult`** (`ProjectBaseModel`):
  - Fields: `objective` (FK), `title`, `initial_value`, `target_value`, `current_value`, `unit`, `auto_compute` (boolean).
  - Method `compute_progress()`: Dynamically aggregates issues across linked `Cycle` and `Module` instances via reverse FKs. Calculates completed ratio and updates `current_value` and percentage.
- **`Idea`** (`ProjectBaseModel`):
  - Fields: `title`, `description_html`, `status` (`new`, `under_review`, `validated`, `rejected`, `converted`), `effort` (1-5), `impact` (1-5), `upvotes_count`, `converted_issue` (FK nullable), `converted_module` (FK nullable).
  - Property `matrix_quadrant`: Computes quadrant assignment based on impact and effort thresholds:
    - $\text{Impact} \ge 3, \text{Effort} \le 2 \implies$ `quick_wins`
    - $\text{Impact} \ge 3, \text{Effort} \ge 3 \implies$ `major_projects`
    - $\text{Impact} < 3, \text{Effort} \le 2 \implies$ `fill_ins`
    - $\text{Impact} < 3, \text{Effort} \ge 3 \implies$ `thankless_tasks`

### 2.2 Relational Grafting onto Cycles and Modules
- **`Cycle`** (`apps/api/plane/db/models/cycle.py`):
  - Added `key_result = models.ForeignKey("db.KeyResult", on_delete=models.SET_NULL, null=True, blank=True, related_name="cycle_key_results")`.
- **`Module`** (`apps/api/plane/db/models/module.py`):
  - Added `key_result = models.ForeignKey("db.KeyResult", on_delete=models.SET_NULL, null=True, blank=True, related_name="module_key_results")`.

### 2.3 REST API ViewSets & Routing
Location: `apps/api/plane/app/views/strategic.py` & `apps/api/plane/app/urls/strategic.py`
- `GET/POST /api/workspaces/:slug/projects/:project_id/objectives/`
- `GET/PATCH/DELETE /api/workspaces/:slug/projects/:project_id/objectives/:id/`
- `GET/POST /api/workspaces/:slug/projects/:project_id/key-results/`
- `GET/PATCH/DELETE /api/workspaces/:slug/projects/:project_id/key-results/:id/`
- `GET/POST /api/workspaces/:slug/projects/:project_id/ideas/`
- `GET/PATCH/DELETE /api/workspaces/:slug/projects/:project_id/ideas/:id/`
- `POST /api/workspaces/:slug/projects/:project_id/ideas/:id/upvote/`
- `POST /api/workspaces/:slug/projects/:project_id/ideas/:id/convert-to-issue/` (atomically creates Issue, links FK, updates status to `converted`)
- `POST /api/workspaces/:slug/projects/:project_id/ideas/:id/convert-to-module/` (atomically creates Module, links FK, updates status to `converted`)

---

## 3. Frontend Implementation

### 3.1 TypeScript Definitions (`packages/types/src/strategic.ts`)
- `ObjectiveStatus`: `"on_track" | "at_risk" | "behind" | "completed"`
- `IdeaStatus`: `"new" | "under_review" | "validated" | "rejected" | "converted"`
- `IdeaMatrixQuadrant`: `"quick_wins" | "major_projects" | "fill_ins" | "thankless_tasks"`
- Models: `TObjective`, `TKeyResult`, `TIdea`.
- Re-built and distributed across monorepo packages via `@plane/types`.

### 3.2 State Management (`apps/web/core/store/okr.store.ts`)
- Observables: `objectiveMap`, `keyResultMap`, `ideaMap`, `loader`.
- Computed getters: `getObjectiveById`, `getProjectObjectives`, `getKeyResultById`, `getKeyResultsByObjectiveId`, `getProjectIdeas`, `getIdeasByQuadrant`.
- Reactive methods for CRUD, live progress recalculations, upvoting, and conversion.
- Registered in `RootStore` (`apps/web/core/store/root.store.ts`) and exposed via hook `useOkr()` (`apps/web/core/hooks/store/use-okr.ts`).

### 3.3 Navigation & UI Views
1. **Sidebar Navigation**:
   - Added `Goals & OKRs` to project sidebar (`apps/web/core/components/workspace/sidebar/project-navigation.tsx` and `use-navigation-items.ts`).
2. **Project Goals Page**:
   - Route registered at `:workspaceSlug/projects/:projectId/goals` in `apps/web/app/routes/core.ts`.
   - Page component: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/goals/page.tsx`.
3. **Strategic Management UI Components** (`apps/web/core/components/strategic/`):
   - `goals-root.tsx`: View orchestrator with tab switching between OKRs and Idea Matrix.
   - `objective-card.tsx`: Rich goal card with health status badge, target completion dates, dynamic progress bar, and expandable key results list with auto-rollup indicators.
   - `objective-modal.tsx`: Modal for creating strategic objectives.
   - `key-result-modal.tsx`: Modal for adding measurable key results with auto-compute toggle.
   - `idea-matrix.tsx`: Visual 2x2 Impact vs. Effort matrix with 4 quadrants (`Quick Wins`, `Major Projects`, `Fill-ins`, `Thankless Tasks`), upvote counters, and 1-click conversion to Issue or Module.
   - `idea-modal.tsx`: Modal for submitting hypotheses with interactive Impact and Effort sliders.

---

## 4. Verification & Testing

### 4.1 Automated Test Suite (`scripts/test-leantime-engine.ts`)
The test script verifies:
1. **Key Result Progress Auto-Computation**:
   - 2 out of 4 linked issues completed $\rightarrow 50.0\%$.
   - 3 out of 4 issues completed/cancelled $\rightarrow 75.0\%$.
   - 4 out of 4 completed $\rightarrow 100.0\%$.
2. **Objective Dynamic Aggregate Rollup**:
   - Aggregation across child Key Results ($[50\%, 100\%, 25\%] \rightarrow 58.33\%$).
   - Fallback states for 0 Key Results (`completed` $\rightarrow 100\%$, pending $\rightarrow 0\%$).
3. **Idea Impact vs. Effort 2x2 Matrix Quadrants**:
   - Validated boundary conditions for all 4 quadrants.
4. **Idea Conversion Workflows**:
   - Conversion to Issue and Module with status transitions and duplicate prevention.

**Execution Result:**
```
🧪 [Leantime Engine] Starting Automated Verification Tests...
▶ Test 1: Key Result Progress Auto-Computation from Linked Issues -> ✔ Passed
▶ Test 2: Objective Dynamic Aggregate Rollup across multiple Key Results -> ✔ Passed
▶ Test 3: Idea Impact vs Effort 2x2 Matrix Quadrants Categorization -> ✔ Passed
▶ Test 4: Idea Conversion to Issue & Module Work Items -> ✔ Passed
🎉 ALL LEANTIME STRATEGIC ENGINE TESTS PASSED SUCCESSFULLY!
```

### 4.2 Linter & Typechecks
- **OxLint**: Passed with 0 errors and 0 warnings (`Finished in 202ms on 8 files with 195 rules using 8 threads`).
- **Python Bytecode Compilation**: All backend strategic models, serializers, views, and urls passed syntax compilation with 0 errors.
- **Packages Build**: `@plane/types` built successfully with Rolldown/tsdown.
