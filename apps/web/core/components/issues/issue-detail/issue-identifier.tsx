/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TIssueIdentifierProps } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";

export const IssueIdentifier = observer(function IssueIdentifier(props: TIssueIdentifierProps) {
  const { projectId, variant, size, displayProperties, enableClickToCopyIdentifier = false } = props;
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // Determine if the component is using store data or not
  const isUsingStoreData = "issueId" in props;
  // derived values
  const issue = isUsingStoreData ? getIssueById(props.issueId) : null;
  const projectIdentifier = isUsingStoreData ? getProjectIdentifierById(projectId) : props.projectIdentifier;
  const issueSequenceId = isUsingStoreData ? issue?.sequence_id : props.issueSequenceId;
  const shouldRenderIssueID = displayProperties ? displayProperties.key : true;
  const shouldRenderWBS = displayProperties ? displayProperties.wbs ?? true : true;

  if (!shouldRenderIssueID) return null;

  // Resolve WBS number from issue, props, or hierarchical structure
  let wbsNumber: string | undefined | null = props.wbsNumber ?? issue?.wbs_number;
  if (!wbsNumber && issue) {
    if (issue.parent_id) {
      const parentIssue = getIssueById(issue.parent_id);
      const parentWbs = parentIssue?.wbs_number || "1.0";
      const baseWbs = parentWbs.endsWith(".0") ? parentWbs.slice(0, -2) : parentWbs;
      wbsNumber = `${baseWbs}.${issue.sequence_id || 1}`;
    }
  }

  return (
    <div className="flex shrink-0 items-center space-x-1.5">
      {shouldRenderWBS && wbsNumber && (
        <span
          className="inline-flex items-center rounded bg-layer-2 px-1.5 py-0.5 text-[10px] font-mono font-semibold tracking-wide text-secondary border border-border-subtle"
          title={`Work Breakdown Structure (WBS): ${wbsNumber}`}
        >
          [{wbsNumber}]
        </span>
      )}
      <IdentifierText
        identifier={`${projectIdentifier}-${issueSequenceId}`}
        enableClickToCopyIdentifier={enableClickToCopyIdentifier}
        variant={variant}
        size={size}
      />
    </div>
  );
});
