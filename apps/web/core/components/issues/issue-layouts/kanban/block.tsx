/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane helpers
import { MoreHorizontal, Play, Pause } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
// types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue, IIssueDisplayProperties, IIssueMap } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// ui
import { ControlLink, DropIndicator } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
// components
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { HIGHLIGHT_CLASS, getIssueBlockId } from "@/components/issues/issue-layouts/utils";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// hooks
import { useAdaptivePersona } from "@/hooks/store/use-adaptive-persona";
import { useFocus } from "@/hooks/store/use-focus";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useKanbanView } from "@/hooks/store/use-kanban-view";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import type { TRenderQuickActions } from "../list/list-view-types";
import { IssueProperties } from "../properties/all-properties";

interface IssueBlockProps {
  issueId: string;
  groupId: string;
  subGroupId: string;
  issuesMap: IIssueMap;
  displayProperties: IIssueDisplayProperties | undefined;
  draggableId: string;
  canDropOverIssue: boolean;
  canDragIssuesInCurrentGrouping: boolean;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  shouldRenderByDefault?: boolean;
  isEpic?: boolean;
}

interface IssueDetailsBlockProps {
  cardRef: React.RefObject<HTMLElement>;
  issue: TIssue;
  displayProperties: IIssueDisplayProperties | undefined;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  isReadOnly: boolean;
  isEpic?: boolean;
}

const getPriorityColor = (priority: string | null | undefined): string | null => {
  switch (priority) {
    case "urgent":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#eab308";
    case "low":
      return "#3b82f6";
    default:
      return null;
  }
};

const KanbanIssueDetailsBlock = observer(function KanbanIssueDetailsBlock(props: IssueDetailsBlockProps) {
  const { cardRef, issue, updateIssue, quickActions, isReadOnly, displayProperties, isEpic = false } = props;
  // refs
  const menuActionRef = useRef<HTMLDivElement | null>(null);
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  // hooks
  const { isMobile } = usePlatformOS();

  const customActionButton = (
    // oxlint-disable-next-line jsx_a11y/click-events-have-key-events oxlint-disable-next-line jsx_a11y/no-static-element-interactions
    <div
      ref={menuActionRef}
      className={`flex h-full w-full cursor-pointer items-center rounded-sm p-1 text-placeholder hover:bg-layer-1 ${
        isMenuActive ? "bg-layer-1 text-primary" : "text-secondary"
      }`}
      onClick={() => setIsMenuActive(!isMenuActive)}
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </div>
  );

  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const handleEventPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const { getStateById } = useProjectState();
  const kanbanView = useKanbanView();
  const adaptiveStore = useAdaptivePersona();

  const isCompactMinimal =
    adaptiveStore.activeManifest.issueProperties.cardDensity === "compact_minimal" ||
    (displayProperties?.card_density || kanbanView.cardDisplayDensity) === "compact_minimal";
  const state = issue.state_id ? getStateById(issue.state_id) : undefined;
  const stickerColor = state?.color || getPriorityColor(issue.priority) || "#94a3b8";

  const focusStore = useFocus();
  const isTimingThisIssue = focusStore.activeIssueId === issue.id;
  const isRunning = isTimingThisIssue && !focusStore.isPaused;

  const handleToggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isTimingThisIssue) {
      if (focusStore.isPaused) {
        focusStore.resumeTimer();
      } else {
        focusStore.pauseTimer();
      }
    } else {
      focusStore.startTimer(issue.id, "stopwatch");
    }
  };

  // Planka Compact Minimal Mode: Distraction-free tactile card
  if (isCompactMinimal) {
    return (
      <div className="flex flex-col gap-1.5">
        {/* Top row: Tactile color sticker bar & identifier */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-8 rounded-full transition-colors shrink-0"
              style={{ backgroundColor: stickerColor }}
              title={state?.name || issue.priority || "Accent"}
            />
            {issue.project_id && (
              <IssueIdentifier
                issueId={issue.id}
                projectId={issue.project_id}
                size="xs"
                variant="tertiary"
                displayProperties={displayProperties}
              />
            )}
          </div>

          {/* Hover actions */}
          {/* oxlint-disable-next-line jsx_a11y/click-events-have-key-events oxlint-disable-next-line jsx_a11y/no-static-element-interactions */}
          <div
            className={cn("flex items-center gap-0.5", {
              "opacity-0 group-hover/kanban-block:opacity-100 transition-opacity":
                !isMobile && !isTimingThisIssue && !isMenuActive,
              "!opacity-100": isMenuActive || isTimingThisIssue || isMobile,
            })}
            onClick={handleEventPropagation}
          >
            <button
              type="button"
              className={cn(
                "flex items-center justify-center p-1 rounded hover:bg-layer-1 transition-colors",
                isTimingThisIssue
                  ? isRunning
                    ? "text-green-500 hover:text-green-600 bg-green-500/10"
                    : "text-amber-500 hover:text-amber-600 bg-amber-500/10"
                  : "text-placeholder hover:text-primary"
              )}
              title={isTimingThisIssue ? (isRunning ? "Pause timer" : "Resume timer") : "Start focus timer"}
              onClick={handleToggleTimer}
            >
              {isTimingThisIssue && isRunning ? (
                <Pause className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Play className={cn("h-3.5 w-3.5", isTimingThisIssue && "fill-current")} />
              )}
            </button>
            {quickActions({
              issue,
              parentRef: cardRef,
              customActionButton,
            })}
          </div>
        </div>

        {/* Clean, prominent title */}
        <Tooltip tooltipContent={issue.name} isMobile={isMobile} renderByDefault={false}>
          <div className="line-clamp-2 w-full text-13 font-medium text-primary leading-snug">
            <span>{issue.name}</span>
          </div>
        </Tooltip>

        {/* Bottom row: tactile status & single assignee avatar (reveals full properties on hover) */}
        <div className="pt-0.5">
          <div className="flex items-center justify-between group-hover/kanban-block:hidden">
            <div className="flex items-center gap-1.5 text-xs text-tertiary">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: stickerColor }}
              />
              <span className="text-[11px] font-medium text-secondary truncate max-w-[140px]">
                {state?.name || issue.priority || "Task"}
              </span>
            </div>
            {issue.assignee_ids && issue.assignee_ids.length > 0 && (
              <div className="h-5">
                <MemberDropdown
                  projectId={issue.project_id ?? undefined}
                  value={issue.assignee_ids[0]}
                  onChange={() => {}}
                  disabled={isReadOnly}
                  multiple={false}
                  buttonVariant="transparent-without-text"
                  buttonClassName="hover:bg-transparent px-0 scale-90"
                />
              </div>
            )}
          </div>

          {/* Hover: full agile property chips smoothly reveal */}
          <div className="hidden group-hover/kanban-block:block">
            <IssueProperties
              className="flex flex-wrap items-center gap-2 whitespace-nowrap text-tertiary"
              issue={issue}
              displayProperties={displayProperties}
              activeLayout="Kanban"
              updateIssue={updateIssue}
              isReadOnly={isReadOnly}
              isEpic={isEpic}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {issue.project_id && (
          <IssueIdentifier
            issueId={issue.id}
            projectId={issue.project_id}
            size="xs"
            variant="tertiary"
            displayProperties={displayProperties}
          />
        )}
        {/* oxlint-disable-next-line jsx_a11y/click-events-have-key-events oxlint-disable-next-line jsx_a11y/no-static-element-interactions */}
        <div
          className={cn("absolute -top-1 right-0 flex items-center gap-0.5", {
            "hidden group-hover/kanban-block:flex": !isMobile && !isTimingThisIssue,
            "!flex": isMenuActive || isTimingThisIssue,
          })}
          onClick={handleEventPropagation}
        >
          <button
            type="button"
            className={cn(
              "flex items-center justify-center p-1 rounded hover:bg-layer-1 transition-colors",
              isTimingThisIssue
                ? isRunning
                  ? "text-green-500 hover:text-green-600 bg-green-500/10"
                  : "text-amber-500 hover:text-amber-600 bg-amber-500/10"
                : "text-placeholder hover:text-primary"
            )}
            title={isTimingThisIssue ? (isRunning ? "Pause timer" : "Resume timer") : "Start focus timer"}
            onClick={handleToggleTimer}
          >
            {isTimingThisIssue && isRunning ? (
              <Pause className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className={cn("h-3.5 w-3.5", isTimingThisIssue && "fill-current")} />
            )}
          </button>
          {quickActions({
            issue,
            parentRef: cardRef,
            customActionButton,
          })}
        </div>
      </div>

      <Tooltip tooltipContent={issue.name} isMobile={isMobile} renderByDefault={false}>
        <div className="line-clamp-1 w-full text-body-sm-medium text-primary">
          <span>{issue.name}</span>
        </div>
      </Tooltip>

      <IssueProperties
        className="flex flex-wrap items-center gap-2 pt-1.5 whitespace-nowrap text-tertiary"
        issue={issue}
        displayProperties={displayProperties}
        activeLayout="Kanban"
        updateIssue={updateIssue}
        isReadOnly={isReadOnly}
        isEpic={isEpic}
      />
    </>
  );
});

export const KanbanIssueBlock = observer(function KanbanIssueBlock(props: IssueBlockProps) {
  const {
    issueId,
    groupId,
    subGroupId,
    issuesMap,
    displayProperties,
    canDropOverIssue,
    canDragIssuesInCurrentGrouping,
    updateIssue,
    quickActions,
    canEditProperties,
    scrollableContainerRef,
    shouldRenderByDefault,
    isEpic = false,
  } = props;

  const cardRef = useRef<HTMLAnchorElement | null>(null);
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // hooks
  const { getProjectIdentifierById } = useProject();
  const { getIsIssuePeeked } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);
  const { isMobile } = usePlatformOS();

  // handlers
  const handleIssuePeekOverview = (issue: TIssue) => handleRedirection(workspaceSlug, issue, isMobile);

  const issue = issuesMap[issueId];

  const { setIsDragging: setIsKanbanDragging } = useKanbanView();

  const [isDraggingOverBlock, setIsDraggingOverBlock] = useState(false);
  const [isCurrentBlockDragging, setIsCurrentBlockDragging] = useState(false);

  const canEditIssueProperties = canEditProperties(issue?.project_id ?? undefined);

  const isDragAllowed = canDragIssuesInCurrentGrouping && !issue?.tempId && canEditIssueProperties;
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
    isEpic,
    isArchived: !!issue?.archived_at,
  });

  useOutsideClickDetector(cardRef, () => {
    cardRef?.current?.classList?.remove(HIGHLIGHT_CLASS);
  });

  // Make Issue block both as as Draggable and,
  // as a DropTarget for other issues being dragged to get the location of drop
  useEffect(() => {
    const element = cardRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        dragHandle: element,
        canDrag: () => isDragAllowed,
        getInitialData: () => ({ id: issue?.id, type: "ISSUE" }),
        onDragStart: () => {
          setIsCurrentBlockDragging(true);
          setIsKanbanDragging(true);
        },
        onDrop: () => {
          setIsKanbanDragging(false);
          setIsCurrentBlockDragging(false);
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source?.data?.id !== issue?.id && canDropOverIssue,
        getData: () => ({ id: issue?.id, type: "ISSUE" }),
        onDragEnter: () => {
          setIsDraggingOverBlock(true);
        },
        onDragLeave: () => {
          setIsDraggingOverBlock(false);
        },
        onDrop: () => {
          setIsDraggingOverBlock(false);
        },
      })
    );
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [cardRef?.current, issue?.id, isDragAllowed, canDropOverIssue, setIsCurrentBlockDragging, setIsDraggingOverBlock]);

  if (!issue) return null;

  return (
    <>
      <DropIndicator isVisible={!isCurrentBlockDragging && isDraggingOverBlock} />
      <div
        id={`issue-${issueId}`}
        // make Z-index higher at the beginning of drag, to have a issue drag image of issue block without any overlaps
        className={cn(
          "group/kanban-block relative mb-2 transition-transform duration-150 will-change-transform [transform:translate3d(0,0,0)]",
          { "z-[1]": isCurrentBlockDragging }
        )}
        onDragStart={() => {
          if (isDragAllowed) setIsCurrentBlockDragging(true);
          else {
            setToast({
              type: TOAST_TYPE.WARNING,
              title: "Cannot move work item",
              message: !canEditIssueProperties
                ? "You are not allowed to move this work item"
                : "Drag and drop is disabled for the current grouping",
            });
          }
        }}
      >
        <ControlLink
          id={getIssueBlockId(issueId, groupId, subGroupId)}
          href={workItemLink}
          ref={cardRef}
          className={cn(
            "block w-full rounded-lg border border-subtle bg-layer-2 p-3 text-13 shadow-raised-100 outline-[0.5px] outline-transparent transition-all duration-150 will-change-transform [transform:translate3d(0,0,0)] hover:border-strong hover:shadow-raised-200",
            { "hover:cursor-pointer": isDragAllowed },
            { "border border-accent-strong hover:border-accent-strong": getIsIssuePeeked(issue.id) },
            { "z-[100] bg-layer-1 opacity-60 scale-[0.98] shadow-none": isCurrentBlockDragging },
            {
              "ring-2 ring-primary-500/30 shadow-lg scale-[1.01] transition-transform":
                isDraggingOverBlock && !isCurrentBlockDragging,
            }
          )}
          onClick={() => handleIssuePeekOverview(issue)}
          disabled={!!issue?.tempId}
        >
          <RenderIfVisible
            classNames="space-y-2"
            root={scrollableContainerRef}
            defaultHeight="100px"
            horizontalOffset={100}
            verticalOffset={200}
            defaultValue={shouldRenderByDefault}
          >
            <KanbanIssueDetailsBlock
              cardRef={cardRef}
              issue={issue}
              displayProperties={displayProperties}
              updateIssue={updateIssue}
              quickActions={quickActions}
              isReadOnly={!canEditIssueProperties}
              isEpic={isEpic}
            />
          </RenderIfVisible>
        </ControlLink>
      </div>
    </>
  );
});
