"use client";

import { useEffect } from "react";
import { useEditor } from "@/store/editorStore";
import { useEditorUI } from "../uiContext";
import { defaultCropRect } from "../CropOverlay";
import { cropImageData } from "@/lib/image/ops";
import { cn } from "@/lib/cn";

const ASPECTS = ["free", "1:1", "4:5", "4:3", "3:2", "16:9", "9:16"];

export function CropPanel() {
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);
  const setTool = useEditor((s) => s.setTool);
  const { cropRect, setCropRect, cropAspect, setCropAspect } = useEditorUI();

  // initialise the crop rect when the tool opens
  useEffect(() => {
    if (!cropRect) setCropRect(defaultCropRect(width, height, cropAspect));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickAspect = (a: string) => {
    setCropAspect(a);
    setCropRect(defaultCropRect(width, height, a));
  };

  const applyCrop = () => {
    if (!cropRect) return;
    const s = useEditor.getState();
    if (!s.base) return;
    const result = cropImageData(s.base, s.look, cropRect);
    s.applyOp(result);
    setCropRect(null);
    setTool("select");
  };

  return (
    <div className="flex flex-col gap-3.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-text2">
        Aspect ratio
      </span>
      <div className="flex flex-wrap gap-1.5">
        {ASPECTS.map((a) => (
          <button
            key={a}
            onClick={() => pickAspect(a)}
            className={cn(
              "h-7 rounded-md border px-3 text-xs font-medium capitalize transition",
              cropAspect === a
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface2 text-textlabel hover:border-border2 hover:text-textbright",
            )}
          >
            {a}
          </button>
        ))}
      </div>

      {cropRect && (
        <p className="text-xs text-text2 tabular-nums">
          {Math.round(cropRect.w)} × {Math.round(cropRect.h)} px
        </p>
      )}

      <div className="h-px bg-border" />

      <button
        onClick={applyCrop}
        className="h-[34px] rounded-md bg-accent text-[13px] font-semibold text-canvas transition hover:brightness-110"
      >
        Apply crop
      </button>
      <button
        onClick={() => {
          setCropRect(null);
          setTool("select");
        }}
        className="h-[34px] rounded-md border border-border text-[13px] font-medium text-textlabel transition hover:border-border2 hover:text-textbright"
      >
        Cancel
      </button>
    </div>
  );
}
