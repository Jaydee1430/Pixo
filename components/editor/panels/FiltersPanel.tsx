"use client";

import { useMemo } from "react";
import { useEditor } from "@/store/editorStore";
import { FILTER_PRESETS, presetToFilter } from "@/lib/image/filters";
import { createCanvas, imageDataToCanvas } from "@/lib/image/canvas";
import { Slider } from "@/components/ui/Slider";
import { cn } from "@/lib/cn";

/** Small thumbnail of the committed pixels, reused for every preset tile. */
function useThumb(): string | null {
  const base = useEditor((s) => s.base);
  return useMemo(() => {
    if (!base || typeof document === "undefined") return null;
    const maxSide = 128;
    const scale = Math.min(1, maxSide / Math.max(base.width, base.height));
    const w = Math.max(1, Math.round(base.width * scale));
    const h = Math.max(1, Math.round(base.height * scale));
    const c = createCanvas(w, h);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(imageDataToCanvas(base), 0, 0, w, h);
    return c.toDataURL("image/jpeg", 0.7);
  }, [base]);
}

export function FiltersPanel() {
  const filterId = useEditor((s) => s.look.filterId);
  const intensity = useEditor((s) => s.look.filterIntensity);
  const setFilter = useEditor((s) => s.setFilter);
  const commitLook = useEditor((s) => s.commitLook);
  const thumb = useThumb();

  const pick = (id: string) => {
    setFilter(id, id === "none" ? 1 : intensity);
    commitLook();
  };

  const tiles = useMemo(() => FILTER_PRESETS, []);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((p) => {
          const active = filterId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-lg border p-1.5 transition",
                active
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface2 hover:border-border2",
              )}
            >
              <span
                className="checkerboard block aspect-square w-full overflow-hidden rounded-md"
                style={{ backgroundSize: "10px 10px" }}
              >
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ filter: presetToFilter(p.id, p.id === filterId ? intensity : 1) || undefined }}
                    draggable={false}
                  />
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-accent" : "text-textlabel group-hover:text-textbright",
                )}
              >
                {p.name}
              </span>
            </button>
          );
        })}
      </div>

      {filterId !== "none" && (
        <>
          <div className="h-px bg-border" />
          <Slider
            label="Intensity"
            value={Math.round(intensity * 100)}
            min={10}
            max={100}
            unit="%"
            onChange={(v) => setFilter(filterId, v / 100)}
            onCommit={commitLook}
          />
        </>
      )}
    </div>
  );
}
