# Auto-Adaptive Work OS: Architecture Baseline Audit

## 1. Executive Summary & Repository Status
- **Base Repository**: Plane (`makeplane/plane`)
- **Release Version**: `v1.4.2` (Commit: `5f7d927`)
- **Monorepo Strategy**: Single standalone monorepo. No git submodules or external links.
- **Rule Adherence**: Zero existing Plane features or code have been deleted. All baseline structures are preserved intact.
- **Workspace Directory**: `d:\projectmgmt\projectmgmt`

---

## 2. Monorepo Structural Mapping
In modern Plane releases (`v1.0+` through `v1.4.2`), the monorepo architecture has migrated into organized application and package workspaces:

| Component | Historical Reference Path | Modern Monorepo Path (`v1.4.2`) | Framework / Technology |
|---|---|---|---|
| **Frontend Web App** | `apps/app/` | `apps/web/` | Next.js / React Router v7, React 18, Tailwind CSS, Vite, MobX |
| **Rich-Text Editor** | `packages/editor/` | `packages/editor/` | TipTap 2.x, ProseMirror, Yjs (CRDT) |
| **Backend API Server** | `apiserver/` | `apps/api/` | Django 4.x / Django REST Framework (DRF), Celery |
| **Realtime Collab** | `apps/live/` | `apps/live/` | Hocuspocus / WebSockets / Redis / Yjs |
| **Reverse Proxy** | `apps/proxy/` | `apps/proxy/` | Caddy / Nginx gateway |
| **Space (Public)** | `apps/space/` | `apps/space/` | Public issue portal & documentation |
| **Admin Portal** | `apps/admin/` | `apps/admin/` | Instance settings & admin control |
| **Orchestration** | `docker-compose.yml` | `docker-compose.yml` & `docker-compose-local.yml` | Postgres 15, Valkey/Redis 7.2, RabbitMQ 3.13, MinIO |

---

## 3. Architecture & Dependency Audit

### 3.1 Frontend Dependencies (`apps/web/package.json` & Root `pnpm-workspace.yaml`)
- **State Management**:
  - `mobx` (`v6.12.0`), `mobx-react` (`v9.1.1`), `mobx-utils` (`v6.0.8`): Primary reactive state management across all workspaces, projects, issues, cycles, and modules.
  - `swr` (`v2.2.4`): Data caching and background revalidation.
- **UI & Component Layer**:
  - `@headlessui/react` (`^1.7.19`): Accessible headless UI primitives (dialogs, listboxes, menus).
  - `@atlaskit/pragmatic-drag-and-drop`: High-performance drag and drop for Kanban boards and list reordering.
  - `@tanstack/react-table` (`^8.21.3`): Spreadsheet and data table rendering.
  - `lucide-react` (`0.469.0`): Iconography.
  - `framer-motion` (`^12.23.0`): Smooth interface animations and micro-interactions.
- **Keyboard Navigation & Command Palette**:
  - `cmdk` (`^1.1.1`): Fast, unstyled command menu primitive powering Power-K.
  - Custom shortcut routing and context-aware shortcut handlers in `apps/web/core/components/power-k/`.
- **Editor**:
  - `packages/editor/` integrating `@tiptap/core`, `@tiptap/pm`, `yjs`, `y-prosemirror`, and collaborative extensions.

### 3.2 Backend Database Models (`apps/api/plane/db/models/`)
- **`Workspace` (`apps/api/plane/db/models/workspace.py:L119-L184`)**:
  - Inherits `BaseModel`.
  - Core fields: `name`, `slug` (unique, validated against reserved names, timestamped on soft-delete), `owner` (FK `AUTH_USER_MODEL`), `organization_size`, `timezone`, `background_color`, `logo_asset`.
- **`WorkspaceMember` (`apps/api/plane/db/models/workspace.py:L198-L233`)**:
  - RBAC roles: `Admin (20)`, `Member (15)`, `Guest (5)`.
  - Properties: `company_role`, `view_props`, `default_props`, `issue_props`, `is_active`, `getting_started_checklist`.
  - Unique constraint on `[workspace, member]` where `deleted_at__isnull=True`.
- **`Project` (`apps/api/plane/db/models/project.py:L68-L130`)**:
  - Inherits `BaseModel`.
  - Fields: `name`, `description`, `identifier` (e.g., "PROJ", unique index within workspace), `network` (`Secret=0`, `Public=2`), `workspace` (FK), `project_lead` (FK), `default_assignee` (FK), feature flags (`cycle_view`, `module_view`, `issue_views_view`, `page_view`, `intake_view`, `is_time_tracking_enabled`).
- **`Issue` (`apps/api/plane/db/models/issue.py:L104-L240`)**:
  - Inherits `ChangeTrackerMixin` (tracks `state_id`), `ProjectBaseModel`.
  - Key attributes: `parent` (FK self for sub-issues), `state` (FK `State`), `priority` (`urgent`, `high`, `medium`, `low`, `none`), `name`, `description_json`, `description_html`, `description_stripped`, `start_date`, `target_date`, `sequence_id`, `sort_order`, `is_draft`, `completed_at`, `archived_at`, `type` (FK `IssueType`).
  - Sequence generation: Thread-safe Postgres transaction advisory lock (`pg_advisory_xact_lock`) on `project_id` inside `save()`.
- **`Cycle` (`apps/api/plane/db/models/cycle.py:L60-L100`)**:
  - Sprint cadence model. Fields: `name`, `description`, `start_date`, `end_date`, `owned_by` (FK), `progress_snapshot`, `sort_order`, `archived_at`, `version`.
- **`Module` (`apps/api/plane/db/models/module.py:L67-L115`)**:
  - Milestone / Epic feature tracker. Status choices: `backlog`, `planned`, `in-progress`, `paused`, `completed`, `cancelled`.
  - Fields: `name`, `description`, `start_date`, `target_date`, `lead` (FK), `members` (M2M).

### 3.3 Mutation Flow & State Synchronization
1. **Frontend Dispatch**:
   - UI triggers an action on a MobX store (e.g., `BaseIssuesStore.updateIssue()` or `IssueStore.updateIssue()`).
   - Store invokes `IssueService` (`apps/web/core/services/issue/issue.service.ts`), which performs Axios HTTP requests (`POST / PATCH / DELETE`) to endpoints like:
     - `POST /api/workspaces/:slug/projects/:projectId/issues/`
     - `PATCH /api/workspaces/:slug/projects/:projectId/issues/:issueId/`
2. **Backend Processing**:
   - Routed by `apps/api/plane/app/urls/issue.py` to `IssueViewSet` (`apps/api/plane/app/views/issue/base.py`).
   - Permissions checked via `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`.
   - Data validated by DRF serializers (`IssueCreateSerializer`, `IssueSerializer`).
   - Database mutation handled with model change tracking and background task emission (`issue_activity`, `model_activity` webhooks).
3. **Store Ingestion**:
   - API response is deserialized and merged into `IssueStore.issuesMap` (`apps/web/core/store/issue/issue.store.ts`) via MobX `runInAction`.

---

## 4. Key Architectural File Paths

### 4.1 Frontend Issue State Storage (`apps/web/core/store/`)
- **Central Normalized Entity Map**:
  - `apps/web/core/store/issue/issue.store.ts` (`IssueStore` holding `issuesMap: Record<string, TIssue>`, `issuesIdentifierMap: Record<string, string>`)
- **Root Aggregator**:
  - `apps/web/core/store/issue/root.store.ts` (`IssueRootStore`, coordinates project, cycle, module, and detail sub-stores)
- **Base Logic (Grouping, Filters, Pagination, Loaders, Utilities)**:
  - `apps/web/core/store/issue/helpers/base-issues.store.ts` (`BaseIssuesStore`)
  - `apps/web/core/store/issue/helpers/base-issues-utils.ts`
  - `apps/web/core/store/issue/helpers/issue-filter-helper.store.ts`
- **Scoped Issue Sub-Stores**:
  - Project Issues: `apps/web/core/store/issue/project/issue.store.ts`
  - Workspace Issues: `apps/web/core/store/issue/workspace/issue.store.ts`
  - Cycle Issues: `apps/web/core/store/issue/cycle/issue.store.ts`
  - Module Issues: `apps/web/core/store/issue/module/issue.store.ts`
  - Archived Issues: `apps/web/core/store/issue/archived/issue.store.ts`
  - Draft Issues: `apps/web/core/store/issue/workspace-draft/issue.store.ts`
  - Issue Details: `apps/web/core/store/issue/issue-details/issue.store.ts` & `apps/web/core/store/issue/issue-details/root.store.ts`
- **Frontend API Service Layer**:
  - `apps/web/core/services/issue/issue.service.ts`

### 4.2 Keyboard Shortcuts & Command Palette (`Cmd+K`)
- **Global Provider & Event Dispatcher**:
  - `apps/web/core/components/power-k/global-shortcuts.tsx` (`GlobalShortcutsProvider`)
- **Keyboard Handling & Keydown Listener**:
  - `apps/web/core/components/power-k/core/shortcut-handler.ts` (`ShortcutHandler`)
- **Command Registration Engine**:
  - `apps/web/core/components/power-k/core/command-registry.ts` (`CommandRegistry`)
- **Context Detection (Route / Focus Context)**:
  - `apps/web/core/components/power-k/core/context-detector.ts` (`detectContextFromURL`)
- **Store & State Hook**:
  - `apps/web/core/hooks/store/use-power-k.ts` (accessing `powerKStore`)
- **Modal & Search UI (cmdk)**:
  - `apps/web/core/components/power-k/ui/modal/wrapper.tsx`
  - `apps/web/core/components/power-k/ui/modal/search-results.tsx`
  - `apps/web/core/components/power-k/ui/renderer/command.tsx`
  - `apps/web/core/components/power-k/ui/modal/shortcuts-root.tsx`
- **Styling**:
  - `apps/web/styles/power-k.css`

### 4.3 Timeline / Gantt View Math & Rendering
- **State & Store Management**:
  - `apps/web/core/store/timeline/base-timeline.store.ts` (`BaseTimelineStore` - manages zoom range, current block date, start/end dates, position tracking)
  - `apps/web/core/store/timeline/issues-timeline.store.ts`
  - `apps/web/core/store/timeline/modules-timeline.store.ts`
  - `apps/web/core/store/timeline/timeline.store.ts`
  - `apps/web/core/store/issue/issue_gantt_view.store.ts`
- **Date Math & Coordinate Calculations**:
  - `apps/web/core/components/gantt-chart/views/helpers.ts` (`getNumberOfDaysBetweenTwoDates`, `getNumberOfDaysInMonth`, `getWeekNumberByDate`, `generateDate`, coordinate translation)
  - `apps/web/core/hooks/use-timeline-chart.ts`
  - `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` (drag and resize delta computations)
- **Visual Chart & Rendering**:
  - Root Containers: `apps/web/core/components/gantt-chart/root.tsx` & `chart/root.tsx`
  - Layout Wrapper: `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`
  - Headers & Content Viewports: `apps/web/core/components/gantt-chart/chart/header.tsx`, `chart/main-content.tsx`
  - Zoom-Level Columns: `apps/web/core/components/gantt-chart/chart/views/week.tsx`, `month.tsx`, `quarter.tsx`
  - Gantt Blocks: `apps/web/core/components/gantt-chart/blocks/block.tsx`, `blocks/block-row.tsx`
  - Drag Helper: `apps/web/core/components/gantt-chart/chart/timeline-drag-helper.tsx`

---

## 5. Local Environment & Container Healthcheck Audit

### 5.1 Docker & Compose Status
- **Docker Engine Version**: `29.8.0` (Client installed)
- **Docker Compose Version**: `v5.5.1`
- **Container Configurations Inspected**:
  - Production / Standard Stack: `docker-compose.yml` (Services: `web`, `admin`, `space`, `api`, `worker`, `beat-worker`, `migrator`, `live`, `plane-db`, `plane-redis`, `plane-mq`, `plane-minio`, `proxy`)
  - Local Dev Stack: `docker-compose-local.yml` (exposing PostgreSQL `5432`, Valkey/Redis `6379`, RabbitMQ `5672`, MinIO `9000/9090`, API `8000`)
- **Port Conflict Risk Assessment**:
  - Default proxy binds `80` and `443` (configurable via `LISTEN_HTTP_PORT` and `LISTEN_HTTPS_PORT` in `.env`).
  - Dev API binds `8000`, frontend binds `3000`.

### 5.2 Host Toolchain Status
- **Node.js**: `v24.18.1`
- **Package Manager**: `pnpm v11.3.0` (matching `pnpm-workspace.yaml` catalog)
- **Python**: `3.14.x` installed locally on host.

---

## 6. Readiness Verification for Phase 1 Sprint 1.1
- **Preservation Check**: Confirmed that 100% of Plane's core codebase remains untouched.
- **Sprint 1.1 Ingestion Target (Huly's Optimistic Mutation & Keyboard Engine)**:
  - Integration surfaces identified:
    1. Optimistic mutation pipeline will attach to `apps/web/core/store/issue/issue.store.ts` (`issuesMap`) and `apps/web/core/store/issue/helpers/base-issues.store.ts`.
    2. Keyboard command routing will integrate directly with `apps/web/core/components/power-k/core/shortcut-handler.ts` and `apps/web/core/components/power-k/global-shortcuts.tsx`.
- **Status**: Monorepo baseline audit complete, verified, and ready for Phase 1 Sprint 1.1.
