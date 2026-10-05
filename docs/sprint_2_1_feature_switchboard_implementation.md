# Sprint 2.1: Modular Feature Switchboard & Baseline Defaults

## 1. Executive Summary
Sprint 2.1 introduces the centralized **Modular Feature Switchboard** and **Baseline Default Complexity selector** to Plane `v1.4.2`. This administrative control plane empowers workspace and project administrators to selectively activate, deactivate, and govern any of the 6 specialized productivity engines per project, while establishing organizational complexity baselines:
- **Huly**: Speed & Keyboard Flow Engine
- **OpenProject**: Cascading Gantt & Critical Path
- **OpenProject**: Work Breakdown Structure (WBS)
- **Vikunja**: Universal 3-State Normalizer
- **Leantime**: Strategic Goals & OKRs
- **Super Productivity**: Daily Focus & Pomodoro Timers
- **Planka**: Pure Tactile Kanban Density

All existing Plane configurations, project tabs, and database models remain 100% backward-compatible and intact.

---

## 2. Architecture & Data Model

### 2.1 Backend Models Extension

#### `Project` Model (`apps/api/plane/db/models/project.py`)
Extended with 7 engine feature switches and complexity tiering:
- `is_speed_engine_enabled` (`BooleanField(default=True)`): Controls fast keyboard shortcuts, rapid navigation modals, and optimistic sync.
- `is_cascading_gantt_enabled` (`BooleanField(default=True)`): Controls automated dependency shifts (FS, SS, FF, SF) and Critical Path highlighting in Timeline views.
- `is_wbs_numbering_enabled` (`BooleanField(default=True)`): Controls hierarchical decimal outline numbering on work items and Gantt views.
- `is_canonical_state_enabled` (`BooleanField(default=True)`): Controls 3-state canonical mapping (Unstarted, In Progress, Completed).
- `is_strategic_okr_enabled` (`BooleanField(default=True)`): Controls Objectives & Key Results, progress rollups, and Idea Matrix.
- `is_focus_timer_enabled` (`BooleanField(default=True)`): Controls topbar timer widget and "My Day" slide-out scratchpad.
- `is_tactile_kanban_enabled` (`BooleanField(default=True)`): Controls Planka clean card presentation mode toggle.
- `default_complexity` (`CharField(max_length=20, choices=COMPLEXITY_CHOICES, default="standard")`): Choices: `"minimal"`, `"standard"`, `"deep"`.

#### `Workspace` Model (`apps/api/plane/db/models/workspace.py`)
- `default_complexity` (`CharField(max_length=20, choices=COMPLEXITY_CHOICES, default="standard")`): Defines organizational baseline default for newly spawned projects.

#### REST API & Serializers (`apps/api/plane/app/serializers/project.py`, `workspace.py`)
- Automatically exposed through `ProjectSerializer`, `ProjectDetailSerializer`, `ProjectListSerializer`, and `WorkSpaceSerializer` (`fields = "__all__"`).
- Readily updated via `PATCH /api/workspaces/:slug/projects/:projectId/` and `PATCH /api/workspaces/:slug/`.

---

### 2.2 TypeScript Definitions & Monorepo Packages

#### `packages/types/src/project/projects.ts`
- Added `TComplexityBaseline = "minimal" | "standard" | "deep"`.
- Extended `IPartialProject` and `IProject` with the 7 engine flags and `default_complexity`.
- Extended `IWorkspace` (`packages/types/src/workspace.ts`) with `default_complexity`.
- Added `"features_switchboard"` to `TProjectSettingsTabs` (`packages/types/src/settings.ts`).
- Built and distributed monorepo-wide via `@plane/types`.

#### `packages/constants/src/settings/project.ts`
- Registered `features_switchboard` in `PROJECT_SETTINGS` with route `/features/switchboard`.
- Added `features_switchboard` to `GROUPED_PROJECT_SETTINGS[PROJECT_SETTINGS_CATEGORY.FEATURES]`.
- Built and distributed monorepo-wide via `@plane/constants`.

---

## 3. UI Component Implementation

### 3.1 "Feature Switchboard" Component (`apps/web/core/components/project/settings/features-switchboard.tsx`)
1. **Default Complexity Baseline Presets**:
   - **Minimal (Speed Flow)**: Fast, distraction-free flow. Activates Huly keyboard speed, clean Planka Kanban, and Pomodoro timers without complex governance.
   - **Standard (Collaborative)**: Recommended for most teams. Balanced agile delivery with cycles, modules, strategic OKRs, cascading Gantt dependencies, and focus tools.
   - **Deep (Agile/Enterprise)**: Full enterprise depth: WBS decimal hierarchy, Critical Path analysis, Leantime OKRs + Idea validation sandbox, and canonical states.
   - Interactive 1-click preset applicator that reconfigures the switchboard in real time.
2. **Enriched Engine Switchboard**:
   - 7 dedicated cards with themed iconography, engine badges, descriptions, and interactive `ToggleSwitch` controls.
   - Optimistic MobX state updates with `setPromiseToast` notifications.

### 3.2 Navigation & Settings Route Integration
- **Settings Route**: Created dedicated page at `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/features/switchboard/page.tsx` and header `header.tsx`.
- **Project Navigation Gating**: Connected `project.is_strategic_okr_enabled` in:
  - `apps/web/core/components/navigation/use-navigation-items.ts`
  - `apps/web/core/components/workspace/sidebar/project-navigation.tsx`
  Disabling Strategic OKRs immediately hides "Goals & OKRs" from the project sidebar.
- **Embedded in Feature List**: Injected `FeaturesSwitchboard` into `apps/web/core/components/project/settings/features-list.tsx` for access in project modals.

---

## 4. Verification & Testing

### 4.1 Automated Test Suite (`scripts/test-feature-switchboard.ts`)
Executed via `pnpm dlx tsx scripts/test-feature-switchboard.ts`:
- **Test 1**: Project model schema defaults verification (all 7 flags initialized true, complexity standard) (`PASS`).
- **Test 2**: Baseline complexity presets application (Minimal, Standard, Deep) (`PASS`).
- **Test 3**: Dynamic UI navigation and feature gating evaluation (sidebar item visibility, WBS rendering, Gantt shifts) (`PASS`).
- **Test 4**: API patch validation and error handling for invalid complexity tiers (`PASS`).
- **Result**: `4/4 passed (100%)`.

### 4.2 Quality Checks
- `@plane/types` and `@plane/constants` compiled and built with `tsdown` (`✔ Build complete`).
- Django models and serializers compiled cleanly (`python -m py_compile`, exit code 0).
