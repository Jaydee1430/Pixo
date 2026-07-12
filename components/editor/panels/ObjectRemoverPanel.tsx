"use client";

import { useEditor } from "@/store/editorStore";
import { useEditorUI } from "../uiContext";
import { Slider } from "@/components/ui/Slider";
import { runOp } from "@/lib/runOp";
import { inpaint } from "@/lib/image/inpaint";

export function ObjectRemoverPanel() {
  const processing = useEditor((s) => s.processing);
  const { brushSize, setBrushSize, maskRef, hasMask, clearMask } = useEditorUI();

  const removeObject = async () => {
    const st = useEditor.getState();
    const baked = st.bakedImageData();
    const mask = maskRef.current;
    if (!baked || !mask || !hasMask) return;
    await runOp("Removing object…", () => inpaint(baked, mask));
    clearMask();
  };

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-xs leading-relaxed text-text2">
        Brush over a distraction on the canvas, then remove it. Inpainting fills the area from its
        surroundings — best for small objects and blemishes.
      </p>

      <Slider label="Brush size" value={brushSize} min={8} max={140} unit=" px" onChange={setBrushSize} />

      <button
        onClick={removeObject}
        disabled={!hasMask || !!processing}
        className="h-[38px] rounded-md bg-accent text-[13px] font-semibold text-canvas transition hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
      >
        Remove object
      </button>
      <button
        onClick={clearMask}
        disabled={!hasMask}
        className="h-[34px] rounded-md border border-border text-[13px] font-medium text-textlabel transition hover:border-border2 hover:text-textbright disabled:opacity-40"
      >
        Clear brush
      </button>

      {!hasMask && (
        <p className="text-xs text-textmuted">Paint on the image to enable removal.</p>
      )}
    </div>
  );
}
