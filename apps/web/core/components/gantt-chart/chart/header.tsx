/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Expand, Shrink } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane
import type { TGanttViews } from "@plane/types";
import { Row } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { VIEWS_LIST } from "@/components/gantt-chart/data";
// helpers
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { GANTT_BREADCRUMBS_HEIGHT } from "../constants";

type Props = {
  blockIds: string[];
  fullScreenMode: boolean;
  handleChartView: (view: TGanttViews) => void;
  handleToday: () => void;
  loaderTitle: string;
  toggleFullScreenMode: () => void;
  showToday: boolean;
};

export const GanttChartHeader = observer(function GanttChartHeader(props: Props) {
  const { t } = useTranslation();
  const { blockIds, fullScreenMode, handleChartView, handleToday, loaderTitle, toggleFullScreenMode, showToday } =
    props;
  // chart hook
  const { currentView, showCriticalPath, setShowCriticalPath } = useTimeLineChartStore();

  return (
    <Row
      className="relative flex w-full flex-shrink-0 flex-wrap items-center gap-2 bg-surface-1 py-2 whitespace-nowrap"
      style={{ height: `${GANTT_BREADCRUMBS_HEIGHT}px` }}
    >
      <div className="ml-auto">
        <div className="ml-auto text-11 font-medium text-tertiary">
          {blockIds ? `${blockIds.length} ${loaderTitle}` : t("common.loading")}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {VIEWS_LIST.map((chartView: any) => (
          <div
            key={chartView?.key}
            className={cn(
              "cursor-pointer rounded-md bg-layer-transparent p-1 px-2 text-11 hover:bg-layer-transparent-hover",
              {
                "bg-layer-transparent-selected": currentView === chartView?.key,
              }
            )}
            onClick={() => handleChartView(chartView?.key)}
          >
            {t(chartView?.i18n_title)}
          </div>
        ))}
      </div>

      {showToday && (
        <button
          type="button"
          className="rounded-md bg-layer-transparent p-1 px-2 text-11 hover:bg-layer-transparent-hover"
          onClick={handleToday}
        >
          {t("common.today")}
        </button>
      )}

      <button
        type="button"
        id="gantt-toggle-critical-path"
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-2 py-1 text-11 font-medium transition-all",
          showCriticalPath
            ? "border-red-500/60 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            : "border-subtle bg-layer-transparent text-secondary hover:bg-layer-transparent-hover"
        )}
        onClick={() => setShowCriticalPath(!showCriticalPath)}
        title="Show Critical Path (tasks with zero float determining project duration)"
      >
        <span
          className={cn(
            "size-2 rounded-full transition-colors",
            showCriticalPath ? "bg-red-500 animate-pulse" : "bg-tertiary"
          )}
        />
        Show Critical Path
      </button>


      <button
        type="button"
        className="flex items-center justify-center rounded-md border border-subtle bg-layer-transparent p-1 transition-all hover:bg-layer-transparent-hover"
        onClick={toggleFullScreenMode}
      >
        {fullScreenMode ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
      </button>
    </Row>
  );
});
