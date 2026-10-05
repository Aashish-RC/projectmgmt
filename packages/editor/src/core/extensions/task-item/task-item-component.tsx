/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@plane/utils";

export const TaskItemComponent: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, editor, getPos } = props;
  const isChecked = Boolean(node.attrs.checked);
  const [isElevating, setIsElevating] = useState(false);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ checked: e.target.checked });
  };

  const handleElevate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isElevating) return;
    setIsElevating(true);

    const rawText = node.textContent?.trim() || "";
    // If checklist item is empty or already elevated with badge, don't elevate again
    if (!rawText || rawText.startsWith("#")) {
      setIsElevating(false);
      return;
    }

    try {
      let elevatedBadge: string | null = null;
      const callback = (editor.options as any)?.onElevateChecklistItem;
      if (typeof callback === "function") {
        const res = await callback(rawText, typeof getPos === "function" ? getPos() : undefined);
        if (res && res.identifier) {
          elevatedBadge = `#${res.identifier}-${res.sequence_id} ${res.title || rawText}`;
        }
      }

      if (!elevatedBadge) {
        // Dispatch custom event to let the hosting view (e.g. DescriptionInput) handle creation
        await new Promise<void>((resolve) => {
          const evt = new CustomEvent("plane:elevate-checklist-item", {
            bubbles: true,
            composed: true,
            detail: {
              text: rawText,
              pos: typeof getPos === "function" ? getPos() : undefined,
              node,
              editor,
              onSuccess: (badge: string) => {
                elevatedBadge = badge;
                resolve();
              },
            },
          });
          const target = editor.view?.dom || window;
          target.dispatchEvent(evt);
          setTimeout(resolve, 3000);
        });
      }

      if (elevatedBadge && typeof getPos === "function") {
        const pos = getPos();
        editor
          .chain()
          .focus()
          .command(({ tr, state }) => {
            const from = pos + 1;
            const to = pos + node.nodeSize - 1;
            const schema = state.schema;
            const paragraph = schema.nodes.paragraph.create(null, schema.text(elevatedBadge!));
            tr.replaceWith(from, to, paragraph);
            return true;
          })
          .run();
      }
    } catch (err) {
      console.error("Failed to elevate checklist item to work item:", err);
    } finally {
      setIsElevating(false);
    }
  };

  return (
    <NodeViewWrapper
      as="li"
      data-type="taskItem"
      data-checked={isChecked}
      className={cn(
        "group/task-item relative my-1.5 flex items-start gap-2 transition-colors",
        isChecked ? "text-tertiary" : "text-primary"
      )}
    >
      <label aria-label="Task item checkbox" className="flex cursor-pointer items-center pt-0.5 select-none">
        <input
          aria-label="Task item checkbox"
          type="checkbox"
          checked={isChecked}
          onChange={handleToggle}
          disabled={!editor.isEditable}
          className="h-4 w-4 cursor-pointer rounded border-subtle text-primary focus:ring-0"
        />
      </label>
      <div className="min-w-0 flex-1">
        <NodeViewContent
          as="div"
          className={cn(
            "task-item-content text-body-sm-regular break-words",
            isChecked && "text-tertiary line-through"
          )}
        />
      </div>
      {editor.isEditable && (
        <button
          type="button"
          onClick={handleElevate}
          disabled={isElevating}
          title="Elevate to Work Item"
          className={cn(
            "inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded p-0.5 text-placeholder opacity-0 transition-opacity group-hover/task-item:opacity-100 hover:bg-layer-2 hover:text-primary focus:opacity-100",
            isElevating && "animate-pulse text-accent-primary opacity-100"
          )}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      )}
    </NodeViewWrapper>
  );
};
