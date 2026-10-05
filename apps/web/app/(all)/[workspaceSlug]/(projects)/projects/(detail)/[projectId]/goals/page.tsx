/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { useParams } from "next/navigation";
import { observer } from "mobx-react";
import { GoalsRoot } from "@/components/strategic/goals-root";
import { PageHead } from "@/components/core/page-title";
import { useProject } from "@/hooks/store/use-project";

export const ProjectGoalsPage = observer(function ProjectGoalsPage() {
  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;
  const projectId = params?.projectId as string;
  const { getProjectById } = useProject();

  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project.name} - Goals & OKRs` : "Goals & OKRs";

  if (!workspaceSlug || !projectId) {
    return null;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <GoalsRoot workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </>
  );
});

export default ProjectGoalsPage;
