/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CircleDot, XCircle, ArrowRight, ArrowLeft, GitBranch } from "lucide-react";
import { RelatedIcon, DuplicatePropertyIcon } from "@plane/propel/icons";
import type { TRelationObject } from "@/components/issues/issue-detail-widgets/relations";
import type { TIssueRelationTypes } from "@plane/types";

export const ISSUE_RELATION_OPTIONS: Record<TIssueRelationTypes, TRelationObject> = {
  relates_to: {
    key: "relates_to",
    i18n_label: "issue.relation.relates_to",
    className: "bg-layer-1 text-secondary",
    icon: (size) => <RelatedIcon height={size} width={size} className="text-secondary" />,
    placeholder: "Add related work items",
  },
  duplicate: {
    key: "duplicate",
    i18n_label: "issue.relation.duplicate",
    className: "bg-layer-1 text-secondary",
    icon: (size) => <DuplicatePropertyIcon width={size} height={size} className="text-secondary" />,
    placeholder: "None",
  },
  blocked_by: {
    key: "blocked_by",
    i18n_label: "issue.relation.blocked_by",
    className: "bg-danger-subtle text-danger-primary",
    icon: (size) => <CircleDot size={size} className="text-secondary" />,
    placeholder: "None",
  },
  blocking: {
    key: "blocking",
    i18n_label: "issue.relation.blocking",
    className: "bg-yellow-500/20 text-yellow-700",
    icon: (size) => <XCircle size={size} className="text-secondary" />,
    placeholder: "None",
  },
  finish_to_start: {
    key: "finish_to_start",
    i18n_label: "issue.relation.finish_to_start",
    className: "bg-blue-500/20 text-blue-700",
    icon: (size) => <ArrowRight size={size} className="text-secondary" />,
    placeholder: "None",
  },
  predecessor: {
    key: "predecessor",
    i18n_label: "issue.relation.predecessor",
    className: "bg-danger-subtle text-danger-primary",
    icon: (size) => <ArrowLeft size={size} className="text-secondary" />,
    placeholder: "None",
  },
  successor: {
    key: "successor",
    i18n_label: "issue.relation.successor",
    className: "bg-yellow-500/20 text-yellow-700",
    icon: (size) => <ArrowRight size={size} className="text-secondary" />,
    placeholder: "None",
  },
  start_to_start: {
    key: "start_to_start",
    i18n_label: "issue.relation.start_to_start",
    className: "bg-indigo-500/20 text-indigo-700",
    icon: (size) => <GitBranch size={size} className="text-secondary" />,
    placeholder: "None",
  },
  finish_to_finish: {
    key: "finish_to_finish",
    i18n_label: "issue.relation.finish_to_finish",
    className: "bg-purple-500/20 text-purple-700",
    icon: (size) => <ArrowRight size={size} className="text-secondary" />,
    placeholder: "None",
  },
};


export const useTimeLineRelationOptions = () => ISSUE_RELATION_OPTIONS;
