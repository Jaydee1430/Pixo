"use client";

import { useEditor } from "@/store/editorStore";
import { TOOLS } from "@/lib/tools";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function LeftToolRail() {
  const activeTool = useEditor((s) => s.activeTool);
  const setTool = useEditor((s) => s.setTool);
  const hasImage = useEditor((s) => !!s.base);

  return (
    <nav
      aria-label="Tools"
      className="flex w-14 flex-none flex-col items-center gap-1 border-r border-border bg-surface py-3"
    >
      {TOOLS.map((tool, i) => {
        const prev = TOOLS[i - 1];
        const dividerBefore = prev && prev.version !== tool.version;
        const active = activeTool === tool.id;
        return (
          <div key={tool.id} className="contents">
            {dividerBefore && <div className="my-2 h-px w-7 bg-border" />}
            <div className="group relative">
              <button
                aria-label={tool.label}
                aria-pressed={active}
                disabled={!hasImage}
                onClick={() => setTool(tool.id)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  active
                    ? "border-accent bg-accent/15 text-accent shadow-[0_0_16px_rgba(76,141,255,0.25)]"
                    : "border-transparent text-text2 hover:bg-surface2 hover:text-textbright",
                )}
              >
                <Icon name={tool.icon} size={18} />
              </button>
              {hasImage && (
                <div className="pointer-events-none absolute left-12 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-border2 bg-surface3 px-2.5 py-1.5 text-xs font-medium text-textbright shadow-lg group-hover:flex">
                  {tool.label}
                  <span className="text-text2">{tool.key}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
