/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IFocusStore } from "@/store/focus.store";

export const useFocus = (): IFocusStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFocus must be used within StoreProvider");
  return context.focus;
};

export const useFocusStore = useFocus;
