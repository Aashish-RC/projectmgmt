/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { CircularProgressIndicator, CollapsibleButton } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { SubWorkItemTitleActions } from "./title-actions";

type Props = {
  isOpen: boolean;
  parentIssueId: string;
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
  projectId: string;
  workspaceSlug: string;
};

export const SubIssuesCollapsibleTitle = observer(function SubIssuesCollapsibleTitle(props: Props) {
  const { isOpen, parentIssueId, disabled, issueServiceType = EIssueServiceType.ISSUES, projectId } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
    subIssues: { subIssuesByIssueId, stateDistributionByIssueId },
  } = useIssueDetail(issueServiceType);
  // derived values
  const parentIssue = getIssueById(parentIssueId);
  const subIssuesDistribution = stateDistributionByIssueId(parentIssueId);
  const subIssues = subIssuesByIssueId(parentIssueId);
  // if there are no sub-issues, return null
  if (!subIssues) return null;

  // calculate percentage of completed sub-issues (with cumulative rollup support for nested trees)
  const directTotal = subIssues.length;
  const directCompleted = subIssuesDistribution?.completed?.length ?? 0;
  const hasNestedSubIssues = Boolean(parentIssue?.total_sub_issues_count && parentIssue.total_sub_issues_count > directTotal);

  const totalCount = hasNestedSubIssues
    ? (parentIssue?.total_sub_issues_count ?? directTotal)
    : directTotal;
  const completedCount = hasNestedSubIssues
    ? (parentIssue?.completed_sub_issues_count ?? directCompleted)
    : directCompleted;
  const percentage = completedCount && totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={`${issueServiceType === EIssueServiceType.EPICS ? t("issue.label", { count: 1 }) : t("common.sub_work_items")}`}
      indicatorElement={
        <div className="flex items-center gap-1.5 text-13 text-tertiary">
          <CircularProgressIndicator size={18} percentage={percentage} strokeWidth={3} />
          <span>
            {completedCount}/{totalCount} {hasNestedSubIssues ? `sub-items (${percentage}%)` : t("common.done")}
          </span>
        </div>
      }
      actionItemElement={
        <SubWorkItemTitleActions
          projectId={projectId}
          parentId={parentIssueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      }
    />
  );
});
