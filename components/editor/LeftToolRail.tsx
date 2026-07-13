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
      className={cn(
        "flex flex-none border-border bg-surface",
        "order-3 w-full flex-row items-center gap-0.5 overflow-x-auto border-t px-2 py-1.5 scroll-thin",
        "md:order-none md:w-14 md:flex-col md:items-center md:gap-1 md:overflow-visible md:border-r md:border-t-0 md:px-0 md:py-3",
      )}
    >
      {TOOLS.map((tool, i) => {
        const prev = TOOLS[i - 1];
        const dividerBefore = prev && prev.version !== tool.version;
        const active = activeTool === tool.id;
        return (
          <div key={tool.id} className="contents">
            {dividerBefore && (
              <>
                <div className="mx-1 h-7 w-px flex-none bg-border md:my-2 md:mx-0 md:h-px md:w-7" />
              </>
            )}
            <div className="group relative flex-none">
              <button
                aria-label={tool.label}
                aria-pressed={active}
                disabled={!hasImage}
                onClick={() => setTool(tool.id)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border transition md:h-10 md:w-10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  active
                    ? "border-accent bg-accent/15 text-accent shadow-[0_0_16px_rgba(76,141,255,0.25)]"
                    : "border-transparent text-text2 hover:bg-surface2 hover:text-textbright",
                )}
              >
                <Icon name={tool.icon} size={17} />
              </button>
              {hasImage && (
                <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-border2 bg-surface3 px-2.5 py-1.5 text-xs font-medium text-textbright shadow-lg group-hover:flex md:left-12 md:top-1/2 md:mt-0 md:-translate-x-0 md:-translate-y-1/2">
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
