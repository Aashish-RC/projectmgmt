# Sprint 1.6: Ingest Planka Engine (Pure Tactile Kanban & Distraction-Free Card Styling)

## 1. Executive Summary
Sprint 1.6 enriches Plane `v1.4.2` with **Planka's pure tactile Kanban principles**:
1. **Distraction-Free Card Presentation Mode**: Eliminates cognitive badge clutter by rendering a clean card in resting state (prominent title, tactile color sticker bar, primary assignee avatar, and clean hover actions), with smooth reveal of full agile properties on hover.
2. **Display Density Store & Preferences**: Adds `cardDisplayDensity` (`"compact_minimal"` vs `"detailed_agile"`) to `IssueKanBanViewStore` with persistent multi-session `localStorage` caching and a toggle directly in the Kanban Display Filters dropdown.
3. **Hardware-Accelerated Drag & Drop Feedback**: Enhances Pragmatic Drag and Drop elements with CSS GPU promotion (`translate3d(0, 0, 0)`, `will-change: transform`), subtle lift scaling, and drop target glow indicators (`scale-[1.01] ring-2 ring-primary-500/30 shadow-lg`), eliminating layout thrashing on large boards.

---

## 2. Architecture & Data Model

### 2.1 TypeScript Definitions (`packages/types/src/view-props.ts`)
- **`TCardDisplayDensity`**: `"compact_minimal" | "detailed_agile"`
- **`IIssueDisplayProperties`**:
  - Added optional property `card_density?: TCardDisplayDensity`.
  - Re-compiled and distributed via `@plane/types`.

### 2.2 Kanban View Store (`apps/web/core/store/issue/issue_kanban_view.store.ts`)
- Added observable state `cardDisplayDensity: TCardDisplayDensity = "detailed_agile"`.
- Actions:
  - `setCardDisplayDensity(density: TCardDisplayDensity)`: Updates observable and synchronizes to `localStorage` under `plane_kanban_card_density`.
  - `toggleCardDisplayDensity()`: Toggles between clean and detailed density modes.
  - `loadDensityPreference()`: Automatically loads cached user preference on store initialization.

---

## 3. UI Component Enhancements

### 3.1 Kanban Display Filters Dropdown (`apps/web/core/components/issues/issue-layouts/filters/header/display-filters/display-filters-selection.tsx`)
- Injected dedicated **Card Presentation** toggle section when `displayFilters?.layout === "kanban"`:
  - **Clean Cards** (`compact_minimal`): Distraction-free Planka tactile presentation.
  - **Detailed Cards** (`detailed_agile`): Standard Plane full property chips.
- Seamlessly updates both `IssueKanBanViewStore` and active view display properties.

### 3.2 Distraction-Free Card Presentation (`apps/web/core/components/issues/issue-layouts/kanban/block.tsx`)
- When `cardDisplayDensity === "compact_minimal"`:
  - **Tactile Color Sticker Bar**: Top accent pill (`h-1.5 w-8 rounded-full`) derived from the issue's state color (`getStateById(state_id)?.color`), priority level, or default accent.
  - **Prominent Legible Title**: Clean, high-contrast typography (`text-13 font-medium text-primary leading-snug`).
  - **Resting Tactile Footer**: Shows colored status dot with state/priority label and single primary assignee avatar.
  - **Hover Reveal**: Full secondary agile property chips (cycle, module, story points, date ranges, subtask counts) smoothly reveal on card hover.
- When `cardDisplayDensity === "detailed_agile"`:
  - 100% of Plane's standard card chips and metadata indicators render persistently without alteration.

### 3.3 Hardware-Accelerated Drag & Drop Engine (`apps/web/core/components/issues/issue-layouts/kanban/block.tsx`)
- Added GPU layer promotion to card wrappers and links:
  - `transform: translate3d(0, 0, 0)` via Tailwind class `[transform:translate3d(0,0,0)]`.
  - `will-change: transform` via `will-change-transform`.
- Enhanced drop feedback:
  - When dragged over (`isDraggingOverBlock && !isCurrentBlockDragging`): Applies `ring-2 ring-primary-500/30 shadow-lg scale-[1.01] transition-transform`.
  - When being actively dragged (`isCurrentBlockDragging`): Applies `opacity-60 scale-[0.98] shadow-none`.
  - Eliminates DOM reflows and layout thrashing across high-volume card columns.

---

## 4. Verification & Testing

### 4.1 Automated Test Suite (`scripts/test-planka-engine.ts`)
Executed via `pnpm dlx tsx scripts/test-planka-engine.ts`:
- **Test 1**: Density mode state transitions and multi-session `localStorage` persistence (`PASS`).
- **Test 2**: Distraction-free card inspection (clean vs detailed) and 100% underlying data integrity preservation (`PASS`).
- **Test 3**: Hardware acceleration (`translate3d`, `will-change-transform`) and drop-target lift shadow verification (`PASS`).
- **Result**: `3/3 passed (100%)`.

### 4.2 Quality Checks
- `@plane/types` built cleanly with `tsdown` (`✔ Build complete in 10591ms`).
- Code formatted and checked against OxLint rules.
