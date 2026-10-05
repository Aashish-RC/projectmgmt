/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Plus, Target, Lightbulb, Search } from "lucide-react";
import { useOkr } from "@/hooks/store/use-okr";
import { ObjectiveCard } from "./objective-card";
import { ObjectiveModal } from "./objective-modal";
import { KeyResultModal } from "./key-result-modal";
import { IdeaMatrix } from "./idea-matrix";
import { IdeaModal } from "./idea-modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const GoalsRoot: React.FC<Props> = observer(({ workspaceSlug, projectId }) => {
  const {
    getProjectObjectives,
    getProjectIdeas,
    getKeyResultsByObjectiveId,
    fetchObjectives,
    createObjective,
    fetchKeyResults,
    createKeyResult,
    fetchIdeas,
    createIdea,
    upvoteIdea,
    convertIdeaToIssue,
    convertIdeaToModule,
  } = useOkr();

  const [activeTab, setActiveTab] = useState<"okrs" | "ideas">("okrs");
  const [searchQuery, setSearchQuery] = useState("");
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [selectedObjectiveIdForKR, setSelectedObjectiveIdForKR] = useState<string | null>(null);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);

  useEffect(() => {
    if (workspaceSlug && projectId) {
      void fetchObjectives(workspaceSlug, projectId);
      void fetchKeyResults(workspaceSlug, projectId);
      void fetchIdeas(workspaceSlug, projectId);
    }
  }, [workspaceSlug, projectId, fetchObjectives, fetchKeyResults, fetchIdeas]);

  const objectives = getProjectObjectives(projectId);
  const ideas = getProjectIdeas(projectId);

  const filteredObjectives = objectives.filter((obj) => obj.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredIdeas = ideas.filter((idea) => idea.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-custom-background-90 flex-1 overflow-y-auto p-6 md:p-8">
      {/* Header */}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs tracking-wider text-custom-primary-100 font-semibold uppercase">
                Strategic Management
              </span>
            </div>
            <h1 className="text-2xl text-custom-text-100 font-bold tracking-tight">Goals, OKRs & Idea Sandbox</h1>
            <p className="text-xs text-custom-text-300 mt-1">
              Connect strategic objectives directly to delivery cycles, modules, and work items.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "okrs" ? (
              <button
                type="button"
                onClick={() => setIsObjectiveModalOpen(true)}
                className="text-xs bg-custom-primary-100 shadow-sm inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white transition-all hover:opacity-90"
              >
                <Plus size={15} />
                <span>New Objective</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsIdeaModalOpen(true)}
                className="text-xs bg-amber-500 shadow-sm inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white transition-all hover:opacity-90"
              >
                <Plus size={15} />
                <span>Submit Idea</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="border-custom-border-200 flex flex-col justify-between gap-4 border-b pb-2 sm:flex-row sm:items-center">
          {/* Tabs */}
          <div className="bg-custom-background-100 border-custom-border-200 flex w-fit items-center gap-2 rounded-xl border p-1">
            <button
              type="button"
              onClick={() => setActiveTab("okrs")}
              className={`text-xs inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeTab === "okrs"
                  ? "bg-custom-primary-100 shadow-xs text-white"
                  : "text-custom-text-300 hover:text-custom-text-100"
              }`}
            >
              <Target size={14} />
              <span>Objectives & Key Results ({objectives.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ideas")}
              className={`text-xs inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeTab === "ideas"
                  ? "bg-amber-500 shadow-xs text-white"
                  : "text-custom-text-300 hover:text-custom-text-100"
              }`}
            >
              <Lightbulb size={14} />
              <span>Idea Sandbox (2x2 Matrix) ({ideas.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative sm:w-64">
            <Search size={14} className="text-custom-text-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "okrs" ? "objectives..." : "ideas..."}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-custom-border-200 bg-custom-background-100 text-xs text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 w-full rounded-lg border py-1.5 pr-3 pl-9 transition-colors focus:outline-none"
            />
          </div>
        </div>

        {/* Content View */}
        {activeTab === "okrs" ? (
          <div className="space-y-4">
            {filteredObjectives.length === 0 ? (
              <div className="border-custom-border-200 bg-custom-background-100/50 rounded-2xl border border-dashed p-12 text-center">
                <div className="bg-custom-primary-100/10 text-custom-primary-100 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Target size={24} />
                </div>
                <h3 className="text-base text-custom-text-100 font-semibold">No Objectives Found</h3>
                <p className="text-xs text-custom-text-300 mx-auto mt-1 mb-6 max-w-sm">
                  Define strategic Objectives and measurable Key Results linked to your Cycles and Modules for automated
                  progress rollups.
                </p>
                <button
                  type="button"
                  onClick={() => setIsObjectiveModalOpen(true)}
                  className="text-xs bg-custom-primary-100 inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white transition-all hover:opacity-90"
                >
                  <Plus size={14} />
                  <span>Create First Objective</span>
                </button>
              </div>
            ) : (
              filteredObjectives.map((obj) => (
                <ObjectiveCard
                  key={obj.id}
                  objective={obj}
                  keyResults={getKeyResultsByObjectiveId(obj.id)}
                  onAddKeyResult={(objectiveId) => setSelectedObjectiveIdForKR(objectiveId)}
                />
              ))
            )}
          </div>
        ) : (
          <IdeaMatrix
            ideas={filteredIdeas}
            onUpvote={async (ideaId) => {
              await upvoteIdea(workspaceSlug, projectId, ideaId);
            }}
            onConvertToIssue={async (ideaId) => {
              await convertIdeaToIssue(workspaceSlug, projectId, ideaId);
            }}
            onConvertToModule={async (ideaId) => {
              await convertIdeaToModule(workspaceSlug, projectId, ideaId);
            }}
            onAddNewIdea={() => setIsIdeaModalOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      <ObjectiveModal
        isOpen={isObjectiveModalOpen}
        onClose={() => setIsObjectiveModalOpen(false)}
        onSubmit={async (data) => {
          await createObjective(workspaceSlug, projectId, data);
        }}
      />

      <KeyResultModal
        isOpen={Boolean(selectedObjectiveIdForKR)}
        objectiveId={selectedObjectiveIdForKR}
        onClose={() => setSelectedObjectiveIdForKR(null)}
        onSubmit={async (data) => {
          await createKeyResult(workspaceSlug, projectId, data);
        }}
      />

      <IdeaModal
        isOpen={isIdeaModalOpen}
        onClose={() => setIsIdeaModalOpen(false)}
        onSubmit={async (data) => {
          await createIdea(workspaceSlug, projectId, data);
        }}
      />
    </div>
  );
});
