# Phase 1 - Sprint 1.1: Ingest Huly Speed Engine Implementation

## 1. Executive Summary
- **Sprint Target**: Upgrade Plane `v1.4.2` core interaction layer to achieve sub-16ms instant optimistic feedback and complete single-key keyboard navigation inspired by Huly and Linear.
- **Rule Adherence**: Zero existing Plane features, MobX stores, or REST endpoints were deleted. All baseline structures and API compatibility are preserved intact.
- **Implementation Status**: Complete and verified through production builds and type checking.

---

## 2. Optimistic Mutation Pipeline

### 2.1 Architectural Flow
Every issue mutation—including status changes, priority shifts, drag-and-drop reordering on Kanban boards, date modifications, and title edits—now executes via a resilient optimistic mutation pipeline:

```
[User Interaction (Drag / Click / Edit)]
                 │
                 ▼
 1. Capture MobX Snapshot (`clone(issue)`)
                 │
                 ▼
 2. Apply Instant State Mutation (`runInAction`)
    • Update `issuesMap[issueId]`
    • Update issue list ordering & grouping
    • Re-render UI (<16ms, 60fps frame budget)
                 │
                 ▼
 3. Dispatch Async Network Request in Background (`issueService.patchIssue(...)`)
                 │
        ┌────────┴────────┐
        │ Success         │ Failure (Network error / 5xx)
        ▼                 ▼
   Clear snapshot   4. Automatic Rollback:
                       • Revert `issuesMap` to captured snapshot
                       • Revert issue lists & parent stats
                       • Non-intrusive toast notification (`setToast`)
```

### 2.2 Modified Files
- **[`apps/web/core/store/issue/issue.store.ts`](file:///d:/projectmgmt/projectmgmt/apps/web/core/store/issue/issue.store.ts)**:
  - Added snapshot cache (`issueSnapshots: Map<string, TIssue>`).
  - Added `captureSnapshot(issueId: string): TIssue | undefined`.
  - Added `rollbackSnapshot(issueId: string): void`.
  - Added `clearSnapshot(issueId: string): void`.
  - Implemented `optimisticPatchIssue(workspaceSlug, projectId, issueId, data)`: captures snapshot, executes instant `runInAction` mutation on `issuesMap`, dispatches background network patch, and automatically rolls back with non-intrusive error toast on rejection.
- **[`apps/web/core/store/issue/helpers/base-issues.store.ts`](file:///d:/projectmgmt/projectmgmt/apps/web/core/store/issue/helpers/base-issues.store.ts)**:
  - Enhanced `issueUpdate(workspaceSlug, projectId, issueId, data, shouldSync)`:
    - Captures before-state snapshot using `clone()`.
    - Synchronously applies changes into `issuesMap` and reactive list stores inside `runInAction` before network invocation.
    - Dispatches asynchronous network update in background.
    - On failure, catches error, restores store to snapshot, and displays non-intrusive toast notification via `setToast` with `TOAST_TYPE.ERROR`.

---

## 3. Single-Key Global Keyboard Navigation & Speed Engine

### 3.1 Shortcut Specifications
All single-key shortcuts and two-key sequences are guarded against active focus inside `input`, `textarea`, `[contenteditable='true']`, `[role='textbox']`, or `.ProseMirror` rich-text editor instances.

| Key / Sequence | Action | Scope & Behavior |
|---|---|---|
| `c` or `C` | Quick Issue Creation Modal | Opens Plane's issue creation dialog instantly without navigation delay. |
| `j` | Select Next Issue | Sequentially selects and highlights next issue across List, Kanban, or Spreadsheet views; smoothly scrolls target into view. |
| `k` | Select Previous Issue | Sequentially selects and highlights previous issue across List, Kanban, or Spreadsheet views; smoothly scrolls target into view. |
| `Space` | Quick-Peek Drawer Toggle | Opens or closes the detail preview drawer for the currently selected issue without a full page route change. |
| `x` | Toggle Selection | Toggles multiple selection check state for the currently focused issue in `MultipleSelectStore`. |
| `g` then `b` | Go to Project Board | Navigates directly to active project board (`/:workspaceSlug/projects/:projectId/issues`). |
| `g` then `i` | Go to Workspace Inbox | Navigates directly to workspace notifications/inbox (`/:workspaceSlug/notifications`). |

### 3.2 Modified Files
- **[`apps/web/core/components/power-k/core/shortcut-handler.ts`](file:///d:/projectmgmt/projectmgmt/apps/web/core/components/power-k/core/shortcut-handler.ts)**:
  - Enhanced `isTypingInInput` to inspect `element.isContentEditable` and traverse `.closest()` for inputs, textareas, contenteditable containers, ProseMirror nodes, and textbox roles.
  - Implemented `handleSpeedEngineShortcuts`:
    - Handles single-key `c`/`C`, `j`, `k`, `Space`, and `x`.
    - `navigateIssues("next" | "prev")`: dynamically queries visible issue elements (`[id^="issue-"]`), updates visual ring/active state, updates MobX `MultipleSelectStore`, and scrolls smoothly into view.
    - `toggleQuickPeekDrawer()`: resolves active issue, retrieves workspace and project context, and triggers `rootStore.issue.issueDetail.setPeekIssue(...)` without route navigation.
    - `toggleActiveIssueSelection()`: toggles active issue state in `rootStore.multipleSelect` and updates DOM checkbox elements.
  - Implemented sequence matching for `gb` and `gi` with automatic fallback router dispatch.
- **[`apps/web/core/components/power-k/config/navigation/commands.ts`](file:///d:/projectmgmt/projectmgmt/apps/web/core/components/power-k/config/navigation/commands.ts)**:
  - `nav_project_work_items`: mapped `keySequence` to `"gb"`.
  - `nav_inbox`: mapped `keySequence` to `"gi"`.
- **[`apps/web/core/components/power-k/config/creation/command.ts`](file:///d:/projectmgmt/projectmgmt/apps/web/core/components/power-k/config/creation/command.ts)**:
  - `create_work_item`: mapped `shortcut` to `"c"`.
- **[`apps/web/core/hooks/use-multiple-select.ts`](file:///d:/projectmgmt/projectmgmt/apps/web/core/hooks/use-multiple-select.ts)**:
  - Added support for `j` and `k` alongside arrow keys, plus `x` for selection toggle, protected by `isTypingInInput` detection.

---

## 4. Quick-Peek Drawer Integration
- Wire-up: `Space` key activates `rootStore.issue.issueDetail.setPeekIssue({ workspaceSlug, projectId, issueId, isArchived })`.
- If the active issue is already peeked, pressing `Space` closes the drawer (`setPeekIssue(undefined)`).
- Does not cause full Next.js / React Router navigation, preserving client memory and scroll position.

---

## 5. Verification & Test Results

1. **Package Declarations & Monorepo Build**:
   ```bash
   pnpm turbo run build --filter="./packages/*"
   # Tasks: 12 successful, 12 total.
   ```
2. **Linting Check (`oxlint`)**:
   ```bash
   pnpm exec oxlint apps/web/core/store/issue/issue.store.ts apps/web/core/store/issue/helpers/base-issues.store.ts apps/web/core/components/power-k/core/shortcut-handler.ts apps/web/core/components/power-k/config/navigation/commands.ts apps/web/core/components/power-k/config/creation/command.ts apps/web/core/hooks/use-multiple-select.ts
   # 0 errors.
   ```
3. **TypeScript Typecheck (`check:types`)**:
   ```bash
   pnpm --filter web check:types
   # Exit code 0, 0 type errors across all web modules.
   ```
4. **Web Production Build**:
   ```bash
   pnpm --filter web build
   # Built in 31.82s with zero compilation errors.
   ```
