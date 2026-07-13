"use client";

import type { ComponentType } from "react";
import { useEditor } from "@/store/editorStore";
import { TOOL_BY_ID } from "@/lib/tools";
import { Icon } from "@/components/ui/Icon";
import type { ToolId } from "@/lib/types";
import { useEditorUI } from "./uiContext";
import { cn } from "@/lib/cn";
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
  const { mobilePanelOpen, setMobilePanelOpen } = useEditorUI();

  return (
    <>
      {!mobilePanelOpen && (
        <button
          type="button"
          onClick={() => setMobilePanelOpen(true)}
          className="order-2 flex flex-none items-center justify-between border-t border-border bg-surface px-4 py-2.5 text-left md:hidden"
          aria-label={`Open ${def.label} panel`}
        >
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent">
              <Icon name={def.icon} size={11} />
            </span>
            <span className="text-[13px] font-semibold text-text">{def.label}</span>
          </span>
          <Icon name="chevron-down" size={14} className="text-text2" />
        </button>
      )}

      <aside
        className={cn(
          "flex flex-col border-border bg-surface",
          "order-2 max-h-[min(44dvh,380px)] w-full flex-none border-t shadow-[0_-8px_32px_rgba(0,0,0,0.35)]",
          "md:order-none md:max-h-none md:w-[300px] md:flex-none md:border-l md:border-t-0 md:shadow-none",
          !mobilePanelOpen && "max-md:hidden",
        )}
      >
        <div className="flex flex-none items-center gap-2.5 border-b border-border px-4 pb-3 pt-3 md:pt-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent">
            <Icon name={def.icon} size={13} />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text">{def.label}</span>
          <button
            type="button"
            onClick={() => setMobilePanelOpen(false)}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-textlabel transition hover:bg-surface2 hover:text-textbright md:hidden"
            aria-label="Collapse panel"
          >
            <Icon name="chevron-down" size={14} className="rotate-180" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-4">
          <div key={tool} className="animate-pixofade">
            <Panel />
          </div>
        </div>
        <div className="hidden flex-none border-t border-border px-4 py-3 md:block">
          <span className="text-[11px] text-text2">Non-destructive — undo any time, edits bake on export.</span>
        </div>
      </aside>
    </>
  );
}
