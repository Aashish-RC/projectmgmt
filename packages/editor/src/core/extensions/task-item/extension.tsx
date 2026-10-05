/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { TaskItem } from "@tiptap/extension-task-item";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TaskItemComponent } from "./task-item-component";

export interface ICustomTaskItemOptions {
  onElevateChecklistItem?: (
    text: string,
    pos?: number
  ) => Promise<{ identifier: string; sequence_id: number; title: string } | void>;
  nested?: boolean;
  HTMLAttributes?: Record<string, any>;
}

export const CustomTaskItemExtension = TaskItem.extend<ICustomTaskItemOptions>({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemComponent);
  },
});
