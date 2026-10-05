/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Menu, Transition } from "@headlessui/react";
import { Zap, Layers, GitBranch, Lock, Check, ChevronDown } from "lucide-react";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { ComplexityTier } from "@plane/types";
import { cn } from "@plane/utils";
import { useAdaptivePersona } from "@/hooks/store/use-adaptive-persona";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";

const TIERS: { key: ComplexityTier; label: string; icon: React.ComponentType<{ className?: string }>; color: string; desc: string }[] = [
  {
    key: "minimal",
    label: "Minimal",
    icon: Zap,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    desc: "Speed Flow (Linear/Trello)",
  },
  {
    key: "standard",
    label: "Standard",
    icon: Layers,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    desc: "Collaborative (Asana/Monday)",
  },
  {
    key: "deep",
    label: "Deep",
    icon: GitBranch,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    desc: "Enterprise Agile (Jira/OpenProject)",
  },
];

function isTyping(target: EventTarget | null): boolean {
  if (!target) return false;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true;
  const element = target as HTMLElement;
  if (element.isContentEditable) return true;
  if (element.classList?.contains("ProseMirror")) return true;
  if (element.getAttribute?.("contenteditable") === "true") return true;
  return false;
}

export const ComplexityDial: React.FC = observer(() => {
  const { projectId: routeProjectId } = useParams();
  const { getProjectById } = useProject();
  const { data: currentUser } = useUser();
  const adaptiveStore = useAdaptivePersona();

  const projectId = typeof routeProjectId === "string" ? routeProjectId : undefined;
  const project = projectId ? getProjectById(projectId) : undefined;
  const effectiveTier = adaptiveStore.getEffectiveTier(project);

  const policy = project?.complexity_policy ?? "bounded";
  const isLocked = policy === "locked";
  const isAdmin =
    (currentUser as any)?.role >= 20 ||
    project?.member_role === 20 ||
    (currentUser as any)?.role === "admin";
  const isToggleDisabled = isLocked && !isAdmin;

  const [showAdaptationPrompt, setShowAdaptationPrompt] = useState(false);

  // Check behavioral habit adaptation heuristic (e.g. Standard -> Minimal recommendation)
  useEffect(() => {
    if (effectiveTier === "standard") {
      adaptiveStore.habitDetector?.checkAdaptationHeuristic(effectiveTier, () => {
        setShowAdaptationPrompt(true);
      });
    }
  }, [effectiveTier, adaptiveStore]);

  // Cycle function for keyboard shortcut Cmd + .
  const cycleTier = useCallback(() => {
    if (isToggleDisabled) {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Complexity Locked",
        message: "Complexity is locked to project baseline by Workspace Admin.",
      });
      return;
    }

    const order: ComplexityTier[] = ["minimal", "standard", "deep"];
    const currentIndex = order.indexOf(effectiveTier);
    const nextTier = order[(currentIndex + 1) % order.length];

    const success = adaptiveStore.setTier(nextTier, project, (currentUser as any)?.role);
    if (success) {
      const tierInfo = TIERS.find((t) => t.key === nextTier);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: `Switched to ${tierInfo?.label}`,
        message: `Active persona: ${tierInfo?.desc}`,
      });
    }
  }, [isToggleDisabled, effectiveTier, adaptiveStore, project, currentUser]);

  // Keyboard shortcut listener: Cmd + . / Ctrl + .
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        if (isTyping(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        cycleTier();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [cycleTier]);

  const activeMeta = TIERS.find((t) => t.key === effectiveTier) || TIERS[1];
  const Icon = activeMeta.icon;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        disabled={isToggleDisabled}
        title={
          isToggleDisabled
            ? "Complexity locked to project baseline by Workspace Admin"
            : `Complexity: ${activeMeta.label} (Press Cmd + . to cycle)`
        }
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all select-none shadow-2xs",
          activeMeta.color,
          isToggleDisabled
            ? "opacity-80 cursor-not-allowed"
            : "cursor-pointer hover:brightness-105 active:scale-98"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline font-medium">{activeMeta.label}</span>
        {isLocked && <Lock className="h-3 w-3 text-placeholder ml-0.5" />}
        {!isToggleDisabled && <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />}
      </Menu.Button>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-1.5 w-64 origin-top-right rounded-xl border border-border-200 bg-surface-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 p-1.5">
          <div className="px-2 py-1.5 border-b border-border-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
              Complexity Persona
            </span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-placeholder border border-border-200">
              ⌘ + .
            </kbd>
          </div>

          <div className="py-1 flex flex-col gap-0.5">
            {TIERS.map((tier) => {
              const TierIcon = tier.icon;
              const isSelected = effectiveTier === tier.key;

              return (
                <Menu.Item key={tier.key}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => {
                        adaptiveStore.setTier(tier.key, project, (currentUser as any)?.role);
                        setToast({
                          type: TOAST_TYPE.SUCCESS,
                          title: `Persona: ${tier.label}`,
                          message: tier.desc,
                        });
                      }}
                      className={cn(
                        "w-full flex items-start gap-2.5 px-2 py-2 rounded-lg text-left transition-all cursor-pointer",
                        active || isSelected ? "bg-surface-2" : "hover:bg-surface-2/60",
                        isSelected && "font-semibold"
                      )}
                    >
                      <div className={cn("p-1 rounded-md shrink-0 mt-0.5 border", tier.color)}>
                        <TierIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-primary">{tier.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary-500 stroke-[2.5]" />}
                        </div>
                        <span className="text-[11px] text-tertiary truncate">{tier.desc}</span>
                      </div>
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>

          {isLocked && (
            <div className="mt-1 pt-1.5 border-t border-border-100 px-2 py-1 flex items-center gap-1.5 text-[10px] text-tertiary">
              <Lock className="h-3 w-3 text-placeholder shrink-0" />
              <span>Locked to project baseline by Workspace Admin</span>
            </div>
          )}
        </Menu.Items>
      </Transition>

      {/* Behavioral habit velocity adaptation prompt */}
      {showAdaptationPrompt && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-layer-2 px-4 py-3 shadow-xl backdrop-blur-md">
          <Zap className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-primary">High Velocity Detected!</span>
            <span className="text-xs text-secondary">
              You&apos;re working with high velocity! Would you like to switch to Minimal (Speed Flow) for a cleaner workspace?
            </span>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <button
              type="button"
              className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-600 transition-colors cursor-pointer"
              onClick={() => {
                adaptiveStore.setTier("minimal", project, (currentUser as any)?.role);
                setShowAdaptationPrompt(false);
                setToast({
                  type: TOAST_TYPE.SUCCESS,
                  title: "Switched to Minimal",
                  message: "Active persona: Speed Flow (Linear/Trello)",
                });
              }}
            >
              Switch to Minimal
            </button>
            <button
              type="button"
              className="rounded-md border border-subtle-2 px-2.5 py-1 text-xs font-medium text-secondary hover:bg-layer-1 transition-colors cursor-pointer"
              onClick={() => {
                adaptiveStore.habitDetector?.dismissPrompt();
                setShowAdaptationPrompt(false);
              }}
            >
              Keep Standard
            </button>
          </div>
        </div>
      )}
    </Menu>
  );
});
