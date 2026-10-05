/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { Check, Eye } from "lucide-react";
import type { ComplexityTier, TComplexityPolicy } from "@plane/types";
import { cn } from "@plane/utils";
import { ADAPTIVE_PERSONA_VISUALS } from "@/constants/adaptive-personas";

type Props = {
  selectedTier: ComplexityTier;
  onSelectTier?: (tier: ComplexityTier) => void;
  disabled?: boolean;
  policy?: TComplexityPolicy;
};

export const PersonaPreviewCards: React.FC<Props> = ({
  selectedTier,
  onSelectTier,
  disabled = false,
  policy: _policy = "bounded",
}) => {
  const tiers: ComplexityTier[] = ["minimal", "standard", "deep"];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {tiers.map((tierKey) => {
          const meta = ADAPTIVE_PERSONA_VISUALS[tierKey];
          const isSelected = selectedTier === tierKey;
          const Icon = meta.icon;

          return (
            <div
              key={tierKey}
              className={cn(
                "relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all",
                isSelected
                  ? "border-primary-500 shadow-md ring-primary-500/20 bg-surface-1 ring-2"
                  : "border-border-200 hover:border-border-300 hover:shadow-sm bg-surface-1"
              )}
            >
              {/* Top Accent Gradient Bar */}
              <div
                className={cn(
                  "h-1.5 w-full",
                  tierKey === "minimal" && "from-amber-400 to-amber-600 bg-gradient-to-r",
                  tierKey === "standard" && "from-blue-400 to-indigo-600 bg-gradient-to-r",
                  tierKey === "deep" && "from-purple-500 to-fuchsia-600 bg-gradient-to-r"
                )}
              />

              <div className="flex flex-col gap-4 p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("rounded-xl p-2", meta.badgeBg)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold tracking-tight text-primary">{meta.manifest.label}</h3>
                      <span className="text-[11px] font-medium text-secondary">{meta.headline}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="bg-primary-500 shadow-xs flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white">
                      <Check className="h-3 w-3 stroke-[3]" /> Active
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-tertiary">{meta.manifest.description}</p>

                {/* Mock UI Preview Illustration */}
                <div className="border-border-200 flex flex-col gap-2.5 rounded-xl border bg-surface-2/60 p-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Eye className="text-primary-500 h-3.5 w-3.5" />
                      UI Layout Profile
                    </span>
                    <span className="font-mono text-[10px] text-tertiary">{meta.previewElements.defaultLayout}</span>
                  </div>

                  {/* Wireframe Mock */}
                  <div className="border-border-100 flex gap-2 rounded-lg border bg-surface-1 p-2.5">
                    {/* Mock Sidebar */}
                    <div className="flex w-16 shrink-0 flex-col gap-1 rounded bg-surface-2 p-1.5">
                      <div className="bg-placeholder/60 h-1.5 w-8 rounded" />
                      <div className="bg-primary-500/50 h-1.5 w-10 rounded" />
                      {tierKey !== "minimal" && (
                        <>
                          <div className="bg-placeholder/40 h-1.5 w-7 rounded" />
                          <div className="bg-placeholder/40 h-1.5 w-9 rounded" />
                        </>
                      )}
                      {tierKey === "deep" && (
                        <>
                          <div className="bg-placeholder/40 h-1.5 w-8 rounded" />
                          <div className="bg-placeholder/40 h-1.5 w-6 rounded" />
                        </>
                      )}
                    </div>

                    {/* Mock Content Board/List */}
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="bg-placeholder/50 h-2 w-16 rounded" />
                        <div className="bg-primary-500/30 h-2 w-6 rounded" />
                      </div>

                      {/* Mock Cards */}
                      <div className="flex flex-col gap-1">
                        <div className="border-border-100 flex items-center justify-between rounded border bg-surface-2 p-1.5">
                          <div className="bg-secondary/60 h-1.5 w-20 rounded" />
                          {tierKey === "minimal" && <div className="bg-emerald-500 h-1.5 w-3 rounded-full" />}
                          {tierKey === "standard" && (
                            <div className="flex gap-1">
                              <div className="bg-blue-500/50 h-1.5 w-4 rounded" />
                              <div className="bg-amber-500 h-1.5 w-3 rounded-full" />
                            </div>
                          )}
                          {tierKey === "deep" && (
                            <div className="font-mono flex items-center gap-1 text-[8px] text-tertiary">
                              <span className="text-primary-500 text-[8px] font-bold">1.2.1</span>
                              <div className="bg-purple-500/50 h-1.5 w-4 rounded" />
                            </div>
                          )}
                        </div>
                        <div className="border-border-100 flex items-center justify-between rounded border bg-surface-2 p-1.5">
                          <div className="bg-secondary/60 h-1.5 w-14 rounded" />
                          <div className="bg-blue-500 h-1.5 w-3 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Density & Sidebar summary */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-tertiary">
                    <div>
                      <span className="font-semibold text-secondary">Sidebar: </span>
                      {meta.previewElements.sidebarCount}
                    </div>
                    <div>
                      <span className="font-semibold text-secondary">Density: </span>
                      {meta.previewElements.cardDensityText}
                    </div>
                  </div>
                </div>

                {/* Key Feature Highlights */}
                <div className="flex flex-col gap-1.5">
                  <span className="tracking-wider text-[11px] font-semibold text-secondary uppercase">
                    Included Features
                  </span>
                  <div className="flex flex-col gap-1">
                    {meta.keyHighlights.map((hl) => (
                      <div key={hl} className="text-xs flex items-center gap-2 text-primary">
                        <div className="bg-primary-500 h-1.5 w-1.5 shrink-0 rounded-full" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streamlined / Hidden Notice */}
                {meta.disabledHighlights.length > 0 && (
                  <div className="border-border-100 flex flex-col gap-1 border-t pt-1">
                    <span className="tracking-wider text-[10px] font-semibold text-placeholder uppercase">
                      Streamlined Out of View
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {meta.disabledHighlights.map((dh) => (
                        <div key={dh} className="flex items-center gap-1.5 text-[11px] text-tertiary">
                          <span className="text-placeholder">-</span>
                          <span>{dh}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Action */}
              <div className="border-border-100 flex items-center justify-between border-t bg-surface-2/40 p-4">
                <span className="text-[11px] text-tertiary">
                  Target: <strong className="text-secondary">{meta.manifest.targetAudience.split(",")[0]}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => onSelectTier?.(tierKey)}
                  disabled={disabled || isSelected}
                  className={cn(
                    "text-xs shadow-xs cursor-pointer rounded-lg px-3 py-1.5 font-semibold transition-all",
                    isSelected
                      ? "bg-primary-500/10 text-primary-500 border-primary-500/20 cursor-default border"
                      : "border-border-200 hover:border-border-300 border bg-surface-1 text-primary hover:bg-surface-2",
                    disabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  {isSelected ? "Currently Active" : "Apply Persona"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
