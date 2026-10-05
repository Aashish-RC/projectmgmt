/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ComplexityDial } from "@/components/adaptive";
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
import { TopNavTimerWidget } from "@/components/workspace/timer-widget";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";

export const ExtendedAppHeader = observer(function ExtendedAppHeader(props: { header: ReactNode }) {
  const { header } = props;
  // params
  const { projectId, workItem } = useParams();
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  // derived values
  const shouldShowSidebarToggleButton = projectPreferences.navigationMode === "ACCORDION" || (!projectId && !workItem);

  return (
    <>
      {sidebarCollapsed && shouldShowSidebarToggleButton && <AppSidebarToggleButton />}
      <div className="flex w-full items-center justify-between">
        <div className="min-w-0 flex-1">{header}</div>
        <div className="flex flex-shrink-0 items-center gap-2 px-3">
          <ComplexityDial />
          <TopNavTimerWidget />
        </div>
      </div>
    </>
  );
});
