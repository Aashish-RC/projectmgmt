/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { ComplexityTier } from "@plane/types";
import { useAdaptivePersona } from "@/hooks/store/use-adaptive-persona";
import { useProject } from "@/hooks/store/use-project";

export interface AdaptiveSlotProps {
  children: React.ReactNode;
  field?: string;
  minTier?: ComplexityTier;
  feature?: string;
  navKey?: string;
  fallback?: React.ReactNode;
  projectId?: string;
  className?: string;
}

const TIER_ORDER: Record<ComplexityTier, number> = {
  minimal: 1,
  standard: 2,
  deep: 3,
};

export const AdaptiveSlot: React.FC<AdaptiveSlotProps> = observer(({
  children,
  field,
  minTier,
  feature,
  navKey,
  fallback = null,
  projectId: propProjectId,
  className,
}) => {
  const { workspaceSlug: _workspaceSlug, projectId: routeProjectId } = useParams();
  const effectiveProjectId = propProjectId || (typeof routeProjectId === "string" ? routeProjectId : undefined);

  const { getProjectById } = useProject();
  const project = effectiveProjectId ? getProjectById(effectiveProjectId) : undefined;

  const {
    isFieldVisible,
    isNavigationVisible,
    isFeatureAllowed,
    getEffectiveTier,
  } = useAdaptivePersona();

  const currentTier = getEffectiveTier(project);

  // 1. MinTier check
  if (minTier && TIER_ORDER[currentTier] < TIER_ORDER[minTier]) {
    return <>{fallback}</>;
  }

  // 2. Feature check
  if (feature && !isFeatureAllowed(feature, project)) {
    return <>{fallback}</>;
  }

  // 3. Navigation key check
  if (navKey && !isNavigationVisible(navKey, project)) {
    return <>{fallback}</>;
  }

  // 4. Field check (with mandatory field safeguard)
  if (field && !isFieldVisible(field, project)) {
    return <>{fallback}</>;
  }

  if (className) {
    return <div className={className}>{children}</div>;
  }

  return <>{children}</>;
});
