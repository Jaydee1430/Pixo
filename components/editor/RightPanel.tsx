"use client";

import type { ComponentType } from "react";
import { useEditor } from "@/store/editorStore";
import { TOOL_BY_ID } from "@/lib/tools";
import { Icon } from "@/components/ui/Icon";
import type { ToolId } from "@/lib/types";
import { AdjustmentsPanel } from "./panels/AdjustmentsPanel";
import { SelectPanel } from "./panels/SelectPanel";
import { CropPanel } from "./panels/CropPanel";
import { ResizePanel } from "./panels/ResizePanel";
import { BgRemovePanel } from "./panels/BgRemovePanel";
import { BgReplacePanel } from "./panels/BgReplacePanel";
import { ObjectRemoverPanel } from "./panels/ObjectRemoverPanel";
import { EnhancePanel } from "./panels/EnhancePanel";
import { FiltersPanel } from "./panels/FiltersPanel";
import { ExportPanel } from "./panels/ExportPanel";

const PANELS: Record<ToolId, ComponentType> = {
  adjust: AdjustmentsPanel,
  select: SelectPanel,
  crop: CropPanel,
  resize: ResizePanel,
  bgremove: BgRemovePanel,
  bgreplace: BgReplacePanel,
  object: ObjectRemoverPanel,
  enhance: EnhancePanel,
  filters: FiltersPanel,
  export: ExportPanel,
};

export function RightPanel() {
  const tool = useEditor((s) => s.activeTool);
  const Panel = PANELS[tool];
  const def = TOOL_BY_ID[tool];

  return (
    <aside className="flex w-[300px] flex-none flex-col border-l border-border bg-surface">
      <div className="flex flex-none items-center gap-2.5 border-b border-border px-4 pb-3 pt-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent">
          <Icon name={def.icon} size={13} />
        </span>
        <span className="text-[13px] font-semibold text-text">{def.label}</span>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto p-4">
        <div key={tool} className="animate-pixofade">
          <Panel />
        </div>
      </div>
      <div className="flex-none border-t border-border px-4 py-3">
        <span className="text-[11px] text-text2">Non-destructive — undo any time, edits bake on export.</span>
      </div>
    </aside>
  );
}
