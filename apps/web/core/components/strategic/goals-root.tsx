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

  const filteredObjectives = objectives.filter((obj) =>
    obj.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIdeas = ideas.filter((idea) =>
    idea.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-custom-background-90 p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-custom-primary-100">
                Strategic Management
              </span>
            </div>
            <h1 className="text-2xl font-bold text-custom-text-100 tracking-tight">
              Goals, OKRs & Idea Sandbox
            </h1>
            <p className="text-xs text-custom-text-300 mt-1">
              Connect strategic objectives directly to delivery cycles, modules, and work items.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "okrs" ? (
              <button
                type="button"
                onClick={() => setIsObjectiveModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-custom-primary-100 text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>New Objective</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsIdeaModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Submit Idea</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-custom-border-200">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-custom-background-100 border border-custom-border-200 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("okrs")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "okrs"
                  ? "bg-custom-primary-100 text-white shadow-xs"
                  : "text-custom-text-300 hover:text-custom-text-100"
              }`}
            >
              <Target size={14} />
              <span>Objectives & Key Results ({objectives.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ideas")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "ideas"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-custom-text-300 hover:text-custom-text-100"
              }`}
            >
              <Lightbulb size={14} />
              <span>Idea Sandbox (2x2 Matrix) ({ideas.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-custom-text-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "okrs" ? "objectives..." : "ideas..."}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-custom-border-200 bg-custom-background-100 text-xs text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:border-custom-primary-100 transition-colors"
            />
          </div>
        </div>

        {/* Content View */}
        {activeTab === "okrs" ? (
          <div className="space-y-4">
            {filteredObjectives.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-custom-border-200 bg-custom-background-100/50 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-custom-primary-100/10 text-custom-primary-100 flex items-center justify-center mx-auto mb-4">
                  <Target size={24} />
                </div>
                <h3 className="text-base font-semibold text-custom-text-100">No Objectives Found</h3>
                <p className="text-xs text-custom-text-300 max-w-sm mx-auto mt-1 mb-6">
                  Define strategic Objectives and measurable Key Results linked to your Cycles and Modules for automated progress rollups.
                </p>
                <button
                  type="button"
                  onClick={() => setIsObjectiveModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-custom-primary-100 text-white hover:opacity-90 transition-all cursor-pointer"
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
