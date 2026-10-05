/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { FeaturesSwitchboard } from "@/components/project/settings/features-switchboard";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { FeaturesSwitchboardProjectSettingsHeader } from "./header";

function FeaturesSwitchboardSettingsPage() {
  const params = useParams();
  const workspaceSlug = params?.workspaceSlug as string;
  const projectId = params?.projectId as string;

  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} settings - Feature Switchboard`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT
  );

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<FeaturesSwitchboardProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <FeaturesSwitchboard
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isAdmin={canPerformProjectAdminActions}
        />
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(FeaturesSwitchboardSettingsPage);
