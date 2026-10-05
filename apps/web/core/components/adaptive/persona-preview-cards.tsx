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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {tiers.map((tierKey) => {
          const meta = ADAPTIVE_PERSONA_VISUALS[tierKey];
          const isSelected = selectedTier === tierKey;
          const Icon = meta.icon;

          return (
            <div
              key={tierKey}
              className={cn(
                "relative flex flex-col justify-between rounded-2xl border transition-all overflow-hidden",
                isSelected
                  ? "border-primary-500 bg-surface-1 shadow-md ring-2 ring-primary-500/20"
                  : "border-border-200 bg-surface-1 hover:border-border-300 hover:shadow-sm"
              )}
            >
              {/* Top Accent Gradient Bar */}
              <div
                className={cn(
                  "h-1.5 w-full",
                  tierKey === "minimal" && "bg-gradient-to-r from-amber-400 to-amber-600",
                  tierKey === "standard" && "bg-gradient-to-r from-blue-400 to-indigo-600",
                  tierKey === "deep" && "bg-gradient-to-r from-purple-500 to-fuchsia-600"
                )}
              />

              <div className="p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-2 rounded-xl", meta.badgeBg)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-primary tracking-tight">
                        {meta.manifest.label}
                      </h3>
                      <span className="text-[11px] font-medium text-secondary">
                        {meta.headline}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-500 text-white shadow-xs">
                      <Check className="h-3 w-3 stroke-[3]" /> Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-tertiary leading-relaxed">
                  {meta.manifest.description}
                </p>

                {/* Mock UI Preview Illustration */}
                <div className="rounded-xl border border-border-200 bg-surface-2/60 p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-primary-500" />
                      UI Layout Profile
                    </span>
                    <span className="text-[10px] text-tertiary font-mono">
                      {meta.previewElements.defaultLayout}
                    </span>
                  </div>

                  {/* Wireframe Mock */}
                  <div className="rounded-lg border border-border-100 bg-surface-1 p-2.5 flex gap-2">
                    {/* Mock Sidebar */}
                    <div className="w-16 rounded bg-surface-2 p-1.5 flex flex-col gap-1 shrink-0">
                      <div className="h-1.5 w-8 rounded bg-placeholder/60" />
                      <div className="h-1.5 w-10 rounded bg-primary-500/50" />
                      {tierKey !== "minimal" && (
                        <>
                          <div className="h-1.5 w-7 rounded bg-placeholder/40" />
                          <div className="h-1.5 w-9 rounded bg-placeholder/40" />
                        </>
                      )}
                      {tierKey === "deep" && (
                        <>
                          <div className="h-1.5 w-8 rounded bg-placeholder/40" />
                          <div className="h-1.5 w-6 rounded bg-placeholder/40" />
                        </>
                      )}
                    </div>

                    {/* Mock Content Board/List */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-16 rounded bg-placeholder/50" />
                        <div className="h-2 w-6 rounded bg-primary-500/30" />
                      </div>

                      {/* Mock Cards */}
                      <div className="flex flex-col gap-1">
                        <div className="rounded border border-border-100 bg-surface-2 p-1.5 flex items-center justify-between">
                          <div className="h-1.5 w-20 rounded bg-secondary/60" />
                          {tierKey === "minimal" && <div className="h-1.5 w-3 rounded-full bg-emerald-500" />}
                          {tierKey === "standard" && (
                            <div className="flex gap-1">
                              <div className="h-1.5 w-4 rounded bg-blue-500/50" />
                              <div className="h-1.5 w-3 rounded-full bg-amber-500" />
                            </div>
                          )}
                          {tierKey === "deep" && (
                            <div className="flex items-center gap-1 font-mono text-[8px] text-tertiary">
                              <span className="text-[8px] font-bold text-primary-500">1.2.1</span>
                              <div className="h-1.5 w-4 rounded bg-purple-500/50" />
                            </div>
                          )}
                        </div>
                        <div className="rounded border border-border-100 bg-surface-2 p-1.5 flex items-center justify-between">
                          <div className="h-1.5 w-14 rounded bg-secondary/60" />
                          <div className="h-1.5 w-3 rounded-full bg-blue-500" />
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
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                    Included Features
                  </span>
                  <div className="flex flex-col gap-1">
                    {meta.keyHighlights.map((hl) => (
                      <div key={hl} className="flex items-center gap-2 text-xs text-primary">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streamlined / Hidden Notice */}
                {meta.disabledHighlights.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-border-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-placeholder">
                      Streamlined Out of View
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {meta.disabledHighlights.map((dh) => (
                        <div key={dh} className="text-[11px] text-tertiary flex items-center gap-1.5">
                          <span className="text-placeholder">-</span>
                          <span>{dh}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Action */}
              <div className="p-4 border-t border-border-100 bg-surface-2/40 flex items-center justify-between">
                <span className="text-[11px] text-tertiary">
                  Target: <strong className="text-secondary">{meta.manifest.targetAudience.split(",")[0]}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => onSelectTier?.(tierKey)}
                  disabled={disabled || isSelected}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer",
                    isSelected
                      ? "bg-primary-500/10 text-primary-500 border border-primary-500/20 cursor-default"
                      : "bg-surface-1 text-primary border border-border-200 hover:bg-surface-2 hover:border-border-300",
                    disabled && "opacity-60 cursor-not-allowed"
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
