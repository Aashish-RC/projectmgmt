/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { rootStore } from "@/lib/store-context";
import type { IPowerKCommandRegistry } from "./registry";
import type { TPowerKCommandConfig, TPowerKContext } from "./types";

/**
 * Formats a keyboard event into a modifier shortcut string
 * e.g., "cmd+k", "cmd+shift+,", "cmd+delete"
 */
export function formatModifierShortcut(e: KeyboardEvent): string {
  const parts: string[] = [];

  if (e.ctrlKey || e.metaKey) parts.push("cmd");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");

  const key = e.key.toLowerCase();
  parts.push(key === " " ? "space" : key);

  return parts.join("+");
}

/**
 * Checks if the event target is a typing-focused element
 */
export function isTypingInInput(target: EventTarget | null): boolean {
  if (!target) return false;

  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;

  const element = target as HTMLElement;
  if (element.isContentEditable) return true;
  if (element.classList?.contains("ProseMirror")) return true;
  if (element.getAttribute?.("contenteditable") === "true") return true;
  if (element.closest?.("input, textarea, [contenteditable='true'], .ProseMirror, [role='textbox']")) return true;

  return false;
}

/**
 * Global shortcut handler
 * Handles all keyboard shortcuts: single keys, sequences, and modifiers
 */
export class ShortcutHandler {
  private sequence = "";
  private sequenceTimeout: number | null = null;
  private registry: IPowerKCommandRegistry;
  private getContext: () => TPowerKContext;
  private openPalette: () => void;
  private isEnabled = true;

  constructor(registry: IPowerKCommandRegistry, getContext: () => TPowerKContext, openPalette: () => void) {
    this.registry = registry;
    this.getContext = getContext;
    this.openPalette = openPalette;
  }

  /**
   * Enable/disable the shortcut handler
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Main keyboard event handler
   */
  handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isEnabled) return;

    const key = e.key.toLowerCase();
    const hasModifier = e.metaKey || e.ctrlKey || e.altKey;

    // Special: Cmd+K always opens command palette
    if ((e.metaKey || e.ctrlKey) && key === "k") {
      e.preventDefault();
      rootStore.adaptivePersona?.habitDetector?.recordShortcutAction("cmd+k");
      this.openPalette();
      return;
    }

    // Special: Cmd+. or Ctrl+. cycles complexity tier instantaneously
    if ((e.metaKey || e.ctrlKey) && (key === "." || e.code === "Period")) {
      e.preventDefault();
      this.cycleComplexityTier();
      return;
    }

    // Don't handle shortcuts when typing in inputs (except Cmd+K)
    if (isTypingInInput(e.target)) {
      return;
    }

    // Handle modifier shortcuts (Cmd+Delete, Cmd+Shift+,, etc.)
    if (hasModifier) {
      this.handleModifierShortcut(e);
      return;
    }

    // Handle single-key speed engine shortcuts (c/C, j, k, Space, x)
    if (this.handleSpeedEngineShortcuts(e, key)) {
      return;
    }

    // Handle single key shortcuts and sequences (c, p, gm, op, gb, gi, etc.)
    this.handleKeyOrSequence(e, key);
  };

  /**
   * Handle Huly-speed single-key shortcuts:
   * - j / k: Navigate next / previous issue
   * - Space: Open Quick-Peek drawer
   * - x: Toggle selection of active issue
   * - c: Quick issue creation modal
   */
  private handleSpeedEngineShortcuts(e: KeyboardEvent, key: string): boolean {
    // If a multi-key sequence is active (e.g. user pressed 'g'), let sequence handler proceed
    if (this.sequence.length > 0 && ![" ", "space"].includes(key)) {
      return false;
    }

    // 1. 'c' or 'C': Trigger quick issue creation modal
    if (key === "c") {
      e.preventDefault();
      rootStore.adaptivePersona?.habitDetector?.recordShortcutAction("c");
      const command = this.registry.findByShortcut(this.getContext(), "c");
      if (command && this.canExecuteCommand(command)) {
        this.executeCommand(command);
        return true;
      }
      rootStore.commandPalette.toggleCreateIssueModal(true);
      return true;
    }

    // 2. 'j': Select next issue in active list or board view
    if (key === "j") {
      e.preventDefault();
      rootStore.adaptivePersona?.habitDetector?.recordShortcutAction("j");
      return this.navigateIssues("next");
    }

    // 3. 'k': Select previous issue in active list or board view
    if (key === "k") {
      e.preventDefault();
      rootStore.adaptivePersona?.habitDetector?.recordShortcutAction("k");
      return this.navigateIssues("prev");
    }

    // 4. 'Space': Open Quick-Peek drawer for the currently selected issue
    if (key === " " || e.code === "Space") {
      const target = e.target as HTMLElement | null;
      if (target instanceof HTMLButtonElement || target?.closest?.("button")) {
        return false;
      }
      e.preventDefault();
      rootStore.adaptivePersona?.habitDetector?.recordShortcutAction("Space");
      return this.toggleQuickPeekDrawer();
    }

    // 5. 'x': Toggle selection of the currently focused issue
    if (key === "x") {
      e.preventDefault();
      rootStore.adaptivePersona?.habitDetector?.recordShortcutAction("x");
      return this.toggleActiveIssueSelection();
    }

    return false;
  }

  /**
   * Query all visible issue block elements in current DOM (works on Kanban, List, Spreadsheet, etc.)
   */
  private getVisibleIssueElements(): HTMLElement[] {
    const selector = '[id^="issue-"]';
    return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      const issueId = el.id.replace("issue-", "");
      return Boolean(issueId) && el.offsetParent !== null && !el.classList.contains("pointer-events-none");
    });
  }

  /**
   * Navigate next / previous issue across active list or board view
   */
  private navigateIssues(direction: "next" | "prev"): boolean {
    const issues = this.getVisibleIssueElements();
    if (issues.length === 0) return false;

    let currentIndex = -1;
    const activeElement = document.querySelector<HTMLElement>(".issue-keyboard-active");
    if (activeElement) {
      currentIndex = issues.indexOf(activeElement);
    }
    if (currentIndex === -1) {
      const focused = document.activeElement?.closest<HTMLElement>('[id^="issue-"]');
      if (focused) currentIndex = issues.indexOf(focused);
    }
    if (currentIndex === -1 && rootStore.multipleSelect.getActiveEntityDetails()?.entityID) {
      const storedId = `issue-${rootStore.multipleSelect.getActiveEntityDetails()?.entityID}`;
      currentIndex = issues.findIndex((el) => el.id === storedId);
    }

    let nextIndex: number;
    if (direction === "next") {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % issues.length;
    } else {
      nextIndex = currentIndex === -1 ? issues.length - 1 : (currentIndex - 1 + issues.length) % issues.length;
    }

    const target = issues[nextIndex];
    if (!target) return false;

    // Visual active highlight
    issues.forEach((el) => {
      el.classList.remove("issue-keyboard-active", "ring-2", "ring-accent-primary", "highlight");
    });
    target.classList.add("issue-keyboard-active", "ring-2", "ring-accent-primary");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });

    // Update multipleSelect store
    const issueId = target.id.replace("issue-", "");
    const groupId = target.getAttribute("data-entity-group-id") || "";
    rootStore.multipleSelect.updateActiveEntityDetails({ entityID: issueId, groupID: groupId });

    return true;
  }

  /**
   * Toggle Quick-Peek drawer for the active issue without full page route change
   */
  private toggleQuickPeekDrawer(): boolean {
    let activeIssueId: string | undefined = rootStore.multipleSelect.getActiveEntityDetails()?.entityID;
    if (!activeIssueId) {
      const activeEl = document.querySelector<HTMLElement>(".issue-keyboard-active");
      if (activeEl) {
        activeIssueId = activeEl.id.replace("issue-", "");
      }
    }
    if (!activeIssueId) {
      const focused = document.activeElement?.closest<HTMLElement>('[id^="issue-"]');
      if (focused) {
        activeIssueId = focused.id.replace("issue-", "");
      }
    }
    if (!activeIssueId) {
      const firstIssue = this.getVisibleIssueElements()[0];
      if (firstIssue) {
        activeIssueId = firstIssue.id.replace("issue-", "");
      }
    }

    if (!activeIssueId) return false;

    const isPeeked = rootStore.issue.issueDetail.getIsIssuePeeked(activeIssueId);
    if (isPeeked) {
      rootStore.issue.issueDetail.setPeekIssue(undefined);
      return true;
    }

    const issue = rootStore.issue.issues.getIssueById(activeIssueId);
    const ctx = this.getContext();
    const workspaceSlug =
      ctx.params.workspaceSlug?.toString() ||
      (typeof window !== "undefined" ? window.location.pathname.split("/")[1] : undefined);
    const projectId = issue?.project_id || ctx.params.projectId?.toString();

    if (workspaceSlug && projectId) {
      rootStore.issue.issueDetail.setPeekIssue({
        workspaceSlug,
        projectId,
        issueId: activeIssueId,
        isArchived: Boolean(issue?.archived_at),
      });
      return true;
    }

    return false;
  }

  /**
   * Toggle selection of the currently focused issue
   */
  private toggleActiveIssueSelection(): boolean {
    let activeIssueId: string | undefined = rootStore.multipleSelect.getActiveEntityDetails()?.entityID;
    if (!activeIssueId) {
      const activeEl = document.querySelector<HTMLElement>(".issue-keyboard-active");
      if (activeEl) {
        activeIssueId = activeEl.id.replace("issue-", "");
      }
    }
    if (!activeIssueId) return false;

    const isSelected = rootStore.multipleSelect.getIsEntitySelected(activeIssueId);
    const targetElement = document.getElementById(`issue-${activeIssueId}`);
    const groupId = targetElement?.getAttribute("data-entity-group-id") || "";

    rootStore.multipleSelect.updateSelectedEntityDetails(
      { entityID: activeIssueId, groupID: groupId },
      isSelected ? "remove" : "add"
    );

    const checkbox = targetElement?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (checkbox) checkbox.checked = !isSelected;

    return true;
  }

  /**
   * Handle modifier shortcuts (Cmd+X, Cmd+Shift+X, etc.)
   */
  private handleModifierShortcut(e: KeyboardEvent): void {
    const shortcut = formatModifierShortcut(e);
    const command = this.registry.findByModifierShortcut(this.getContext(), shortcut);

    if (command && this.canExecuteCommand(command)) {
      e.preventDefault();
      this.executeCommand(command);
    }
  }

  /**
   * Handle single key shortcuts or build sequences (gb, gi, op, etc.)
   */
  private handleKeyOrSequence(e: KeyboardEvent, key: string): void {
    // Add key to sequence
    this.sequence += key;

    // Check if sequence matches a command (e.g., "gb", "gi", "gm", "op")
    const sequenceCommand = this.registry.findByKeySequence(this.getContext(), this.sequence);
    if (sequenceCommand && this.canExecuteCommand(sequenceCommand)) {
      e.preventDefault();
      this.executeCommand(sequenceCommand);
      this.resetSequence();
      return;
    }

    // Direct navigation fallbacks for gb (active project board) and gi (workspace inbox)
    if (this.sequence === "gb") {
      e.preventDefault();
      const ctx = this.getContext();
      const workspaceSlug = ctx.params.workspaceSlug?.toString();
      const projectId = ctx.params.projectId?.toString();
      if (workspaceSlug && projectId) {
        ctx.router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
      }
      this.resetSequence();
      return;
    }

    if (this.sequence === "gi") {
      e.preventDefault();
      const ctx = this.getContext();
      const workspaceSlug = ctx.params.workspaceSlug?.toString();
      if (workspaceSlug) {
        ctx.router.push(`/${workspaceSlug}/notifications`);
      }
      this.resetSequence();
      return;
    }

    // If sequence is one character, check for single-key shortcut
    if (this.sequence.length === 1) {
      const singleKeyCommand = this.registry.findByShortcut(this.getContext(), key);
      if (singleKeyCommand && this.canExecuteCommand(singleKeyCommand)) {
        e.preventDefault();
        this.executeCommand(singleKeyCommand);
        this.resetSequence();
        return;
      }
    }

    // Reset sequence after 1 second of no typing
    this.scheduleSequenceReset();
  }

  /**
   * Schedule sequence reset
   */
  private scheduleSequenceReset(): void {
    if (this.sequenceTimeout) {
      window.clearTimeout(this.sequenceTimeout);
    }

    this.sequenceTimeout = window.setTimeout(() => {
      this.resetSequence();
    }, 1000);
  }

  /**
   * Reset key sequence
   */
  private resetSequence(): void {
    this.sequence = "";
    if (this.sequenceTimeout) {
      window.clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
  }

  /**
   * Check if command can be executed
   */
  private canExecuteCommand(command: TPowerKCommandConfig): boolean {
    const ctx = this.getContext();

    // Check visibility
    if (command.isVisible && !command.isVisible(ctx)) {
      return false;
    }

    // Check enablement
    if (command.isEnabled && !command.isEnabled(ctx)) {
      return false;
    }

    // Check context type requirement
    if ("contextType" in command) {
      if (!ctx.activeContext || ctx.activeContext !== command.contextType) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute a command
   */
  private executeCommand(command: TPowerKCommandConfig): void {
    const ctx = this.getContext();

    if (command.type === "action") {
      // Direct action
      command.action(ctx);
    } else if (command.type === "change-page") {
      // Opens a selection page - open palette and set active page
      this.openPalette();
      ctx.setActiveCommand(command);
      ctx.setActivePage(command.page);
    }
  }

  /**
   * Instantaneous complexity tier cycling (Minimal -> Standard -> Deep -> Minimal)
   * Enforces project governance policy (admin locked).
   */
  private cycleComplexityTier(): void {
    const adaptiveStore = rootStore.adaptivePersona;
    if (!adaptiveStore) return;

    const ctx = this.getContext();
    const projectId = ctx.params.projectId?.toString();
    const project = projectId ? rootStore.projectRoot?.project?.getProjectById(projectId) : undefined;

    const tiers: ("minimal" | "standard" | "deep")[] = ["minimal", "standard", "deep"];
    const currentTier = adaptiveStore.getEffectiveTier(project);
    const nextIdx = (tiers.indexOf(currentTier) + 1) % tiers.length;
    const nextTier = tiers[nextIdx];

    const success = adaptiveStore.setTier(nextTier, project);
    if (success) {
      adaptiveStore.habitDetector?.recordShortcutAction("cmd+.");
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.resetSequence();
    this.isEnabled = false;
  }
}
