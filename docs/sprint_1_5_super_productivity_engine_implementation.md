# Sprint 1.5: Ingest Super Productivity Engine (Daily Focus Drawer & Live Pomodoro Timers)

## 1. Executive Summary
Sprint 1.5 enriches Plane `v1.4.2` with **Super Productivity's individual flow-state engine**: a dedicated **"My Day / Focus" slide-over scratchpad** and a **live task timer / Pomodoro widget** that automatically logs focus session durations directly against Plane work items.

All additions have been grafted directly into Plane's existing architecture while maintaining 100% backward compatibility:
- Zero existing models or views were modified or removed.
- All existing time-tracking properties, issue views, and MobX stores remain intact.
- Seamless multi-device daily queue persistence using workspace and user-scoped `localStorage`.

---

## 2. Architecture & Data Model

### 2.1 Backend Work Item Time Log Engine (`apps/api/plane/db/models/timelog.py`)
- **`IssueTimeLog`** (`ProjectBaseModel`):
  - Fields:
    - `issue` (`models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="time_logs")`): Direct association with Plane work items.
    - `duration_minutes` (`models.PositiveIntegerField`): Duration in elapsed minutes.
    - `started_at` (`models.DateTimeField`): Session start timestamp.
    - `ended_at` (`models.DateTimeField`): Session completion timestamp.
    - `notes` (`models.CharField(max_length=1000)`): Session description (e.g., `"Focus session (pomodoro)"`).
  - Serializer: `IssueTimeLogSerializer` (`apps/api/plane/app/serializers/timelog.py`).
  - ViewSet: `IssueTimeLogViewSet` (`apps/api/plane/app/views/timelog.py`) inheriting `BaseViewSet`.
  - API Endpoint:
    - `POST /api/workspaces/:slug/projects/:projectId/issues/:issueId/time-logs/`
    - `GET /api/workspaces/:slug/projects/:projectId/issues/:issueId/time-logs/`

### 2.2 TypeScript Definitions (`packages/types/src/focus.ts`)
- `TimerMode`: `"stopwatch" | "pomodoro"`
- `PomodoroStage`: `"work" | "break"`
- `TIssueTimeLog`: Serialized time log entity interface.
- `TFocusState`: Storage snapshot schema for user queues.
- Built and exported through `@plane/types`.

---

## 3. Focus & Timer State Management (`apps/web/core/store/focus.store.ts`)

The `FocusStore` MobX store manages:
1. **Daily Focus Queue**:
   - `todayIssueIds: string[]`: Array of issue IDs selected for the day.
   - `addToToday(issueId: string)`: Adds a work item to the queue (prevents duplicates).
   - `removeFromToday(issueId: string)`: Removes an item from the queue.
   - `reorderToday(sourceIndex: number, destinationIndex: number)`: Supports drag-and-drop or button reordering.
   - `clearCompletedToday(completedIssueIds: string[])`: Prunes completed issues.
   - `saveToStorage()` / `loadFromStorage()`: Automatically synchronizes queue state to `localStorage` under `plane_focus_${workspaceSlug}_${userId}`.
2. **Live Task Timer & Pomodoro Engine**:
   - `activeIssueId: string | null`: Active task being timed.
   - `timerMode: "stopwatch" | "pomodoro"`.
   - `pomodoroStage: "work" | "break"` (25 min work interval, 5 min break interval).
   - `elapsedSeconds: number`: Total seconds active in the current session.
   - `pomodoroRemainingSeconds: number`: Countdown timer for Pomodoro intervals.
   - `isPaused: boolean`: Running vs paused flag.
   - `ticker`: 1-second interval loop handling countdowns, elapsed seconds, and automatic stage switching between work and break.
   - `stopTimer(notes?: string)`: Automatically computes elapsed minutes ($\ge 30\text{s} \to 1\text{m}$, rounded to nearest whole minute) and dispatches a time log entry to `FocusService.logTime()`, then resets timer state.
3. **Integration**:
   - Registered in `CoreRootStore` (`apps/web/core/store/root.store.ts`).
   - Accessible via custom hook `useFocus()` / `useFocusStore()` (`apps/web/core/hooks/store/use-focus.ts`).

---

## 4. UI Components

### 4.1 Top Navigation Timer Widget (`apps/web/core/components/workspace/timer-widget.tsx`)
- Located in `ExtendedAppHeader` (`apps/web/core/components/common/extended-app-header.tsx`), persistent across all workspace routes.
- Renders:
  - **Inactive state**: "My Day" button showing count badge and keyboard shortcut indicator (`D`).
  - **Active timing state**:
    - Animated pulsing green dot (`animate-ping`).
    - Task title and issue sequence ID identifier.
    - Live countdown or stopwatch `MM:SS` display.
    - Play / Pause button (`Space` / 1-click).
    - Stop button (which auto-records the session into Plane's work log).
    - Mode badge (`Stopwatch` / `Pomodoro Work` / `Break`).
- Desktop audio chime and Web Notifications when Pomodoro intervals complete.

### 4.2 "My Day" Slide-Out Focus Drawer (`apps/web/core/components/workspace/focus-drawer/`)
- Mounted globally in `apps/web/app/(all)/[workspaceSlug]/(projects)/layout.tsx`.
- Slides out smoothly from the right edge with backdrop overlay.
- Triggered by clicking the "My Day" header button or pressing `d` / `D` anywhere outside form inputs.
- Features:
  - Header with current date display, total tasks count, and session duration.
  - Search input with autocomplete dropdown to quickly search and add project issues into the daily queue.
  - Interactive task list:
    - Status checkbox to mark tasks completed.
    - 1-click Play/Pause focus timer button for each task.
    - Up / Down reordering buttons.
    - Remove button (`Trash2`).
  - "Clear Completed" action bar.

### 4.3 Task Card & Context Menu Integrations
1. **Context Menu Actions** (`apps/web/core/components/issues/issue-layouts/quick-action-dropdowns/helper.tsx`):
   - Added `createFocusMenuItem`: "Add to My Day" / "Remove from My Day" (with Sun icon) to both project issue list and work item detail menus.
   - Added `createTimerMenuItem`: "Start Focus Timer" (with Play icon).
2. **Kanban Card Header** (`apps/web/core/components/issues/issue-layouts/kanban/block.tsx`):
   - Inlined subtle Play/Pause button next to card quick actions dropdown.
   - When an issue is actively timing, the button highlights with a green/amber pulse.
3. **Issue Detail Header** (`apps/web/core/components/issues/issue-detail/issue-detail-quick-actions.tsx`):
   - Direct "My Day" toggle button (Sun icon).
   - Direct "Focus" timer launch / pause button with live state label.

---

## 5. Verification & Testing

### 5.1 Automated Test Suite (`scripts/test-super-productivity-engine.ts`)
Executed with `pnpm dlx tsx scripts/test-super-productivity-engine.ts`:
- **Test 1**: Daily focus queue operations (add, remove, reorder, duplicate prevention, and user/workspace isolated `localStorage` persistence).
- **Test 2**: Stopwatch ticker mechanics, pause/resume freezing, and minute calculation math ($45\text{s} \to 1\text{m}$, $125\text{s} \to 2\text{m}$, $180\text{s} \to 3\text{m}$).
- **Test 3**: Pomodoro work ($25\text{m}$) $\to$ break ($5\text{m}$) interval countdowns and stage transitions.
- **Test 4**: Django `IssueTimeLog` model schema and field mapping verification.
- **Result**: `4/4 passed (100%)`.

### 5.2 Code Quality & Static Analysis
- **OxLint**: Passed with 0 warnings and 0 errors across all new focus store, service, and component files (`apps/web/core/store/focus.store.ts`, `apps/web/core/services/focus.service.ts`, `apps/web/core/components/workspace/timer-widget.tsx`, `apps/web/core/components/workspace/focus-drawer/`).
- **Python Compiler**: `apps/api/plane/db/models/timelog.py`, `apps/api/plane/app/serializers/timelog.py`, and `apps/api/plane/app/views/timelog.py` compiled cleanly (`python -m py_compile`, exit code 0).
- **Package Build**: `@plane/types` built successfully with `pnpm --filter=@plane/types build`.
