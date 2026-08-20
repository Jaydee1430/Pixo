"use client";

import { useEffect } from "react";
import { useEditor } from "@/store/editorStore";
import { useEditorUI } from "../uiContext";
import { hasTransparency, removeByBorders, restoreAll } from "@/lib/image/bgremove";
import { Slider } from "@/components/ui/Slider";
import { cn } from "@/lib/cn";

export function BgRemovePanel() {
  const {
    bgMode,
    setBgMode,
    bgBrushMode,
    setBgBrushMode,
    bgTolerance,
    setBgTolerance,
    bgFeather,
    setBgFeather,
    bgWhole,
    setBgWhole,
    brushSize,
    setBrushSize,
  } = useEditorUI();

  // Automatic first pass when the tool opens on a still-opaque image
  useEffect(() => {
    const st = useEditor.getState();
    const baked = st.bakedImageData();
    if (baked && !hasTransparency(baked)) {
      st.applyOp(removeByBorders(baked, bgTolerance, bgFeather));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoRemove = () => {
    const st = useEditor.getState();
    const baked = st.bakedImageData();
    if (baked) st.applyOp(removeByBorders(baked, bgTolerance, bgFeather, bgWhole));
  };

  const reset = () => {
    const st = useEditor.getState();
    if (st.history.length > 0 && st.history[0]?.base) {
      const orig = st.history[0].base;
      st.applyOp(new ImageData(new Uint8ClampedArray(orig.data), orig.width, orig.height));
    } else if (st.base) {
      st.applyOp(restoreAll(st.base));
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Mode */}
      <Segmented
        value={bgMode}
        onChange={(v) => setBgMode(v as "wand" | "brush")}
        options={[
          { value: "wand", label: "Magic wand" },
          { value: "brush", label: "Brush" },
        ]}
      />

      {bgMode === "wand" ? (
        <>
          <p className="text-xs leading-relaxed text-text2">
            Click a background area on the canvas to remove pixels of a similar color. Raise
            tolerance if a white edge or halo is left behind.
          </p>
          <Slider label="Tolerance" value={bgTolerance} min={5} max={90} onChange={setBgTolerance} />

          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-surface2 p-2.5">
            <input
              type="checkbox"
              checked={bgWhole}
              onChange={(e) => setBgWhole(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-accent"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-textbright">Remove all matching areas</span>
              <span className="text-[11px] leading-snug text-text2">
                Clears every region of that color at once — including gaps enclosed by the subject.
                Best for logos &amp; graphics.
              </span>
            </span>
          </label>

          <button
            onClick={autoRemove}
            className="h-[38px] rounded-md bg-accent text-[13px] font-semibold text-canvas transition hover:brightness-110"
          >
            Auto-remove background
          </button>
        </>
      ) : (
        <>
          <p className="text-xs leading-relaxed text-text2">
            Paint over the image to remove or bring back areas by hand.
          </p>
          <Segmented
            value={bgBrushMode}
            onChange={(v) => setBgBrushMode(v as "erase" | "restore")}
            options={[
              { value: "erase", label: "Erase" },
              { value: "restore", label: "Restore" },
            ]}
          />
          <Slider label="Brush size" value={brushSize} min={8} max={140} unit=" px" onChange={setBrushSize} />
        </>
      )}

      <div className="h-px bg-border" />

      <Slider label="Edge feather" value={bgFeather} min={0} max={8} unit=" px" onChange={setBgFeather} />
      <p className="text-xs text-text2">Softens the cut-out edge as you remove.</p>

      <button
        onClick={reset}
        className="h-[34px] rounded-md border border-border text-[13px] font-medium text-textlabel transition hover:border-border2 hover:text-textbright"
      >
        Restore full image
      </button>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-md border border-border bg-surface2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-7 flex-1 rounded text-xs font-medium transition",
            value === o.value
              ? "bg-accent/15 text-accent"
              : "text-textlabel hover:text-textbright",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
