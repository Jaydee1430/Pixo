"use client";

import { useState } from "react";
import { useEditor } from "@/store/editorStore";
import { resizeImageData } from "@/lib/image/ops";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const PRESETS = [
  { label: "Instagram post", w: 1080, h: 1080 },
  { label: "Full HD", w: 1920, h: 1080 },
  { label: "Web thumbnail", w: 800, h: 533 },
];

export function ResizePanel() {
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);

  const [w, setW] = useState(width);
  const [h, setH] = useState(height);
  const [locked, setLocked] = useState(true);
  const [prevDims, setPrevDims] = useState({ width, height });
  const ratio = width / height;

  // Re-sync the inputs when the committed image dimensions change (render-adjust pattern)
  if (prevDims.width !== width || prevDims.height !== height) {
    setPrevDims({ width, height });
    setW(width);
    setH(height);
  }

  const changeW = (val: number) => {
    setW(val);
    if (locked && val > 0) setH(Math.round(val / ratio));
  };
  const changeH = (val: number) => {
    setH(val);
    if (locked && val > 0) setW(Math.round(val * ratio));
  };

  const applyResize = () => {
    const s = useEditor.getState();
    if (!s.base || w < 1 || h < 1) return;
    s.applyOp(resizeImageData(s.base, s.look, w, h));
  };

  const unchanged = w === width && h === height;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-[1fr_28px_1fr] items-end gap-1.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-text2">Width</span>
          <input
            type="number"
            value={w}
            onChange={(e) => changeW(Number(e.target.value))}
            className="h-[30px] w-full rounded-md border border-border bg-surface2 px-2.5 text-[13px] font-medium text-textbright outline-none focus:border-accent"
          />
        </label>
        <button
          title="Lock aspect ratio"
          aria-pressed={locked}
          onClick={() => setLocked((v) => !v)}
          className={cn(
            "flex h-[30px] items-center justify-center rounded-md border transition",
            locked
              ? "border-accent bg-surface2 text-accent"
              : "border-border bg-surface2 text-text2 hover:text-textbright",
          )}
        >
          <Icon name="lock" size={12} />
        </button>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-text2">Height</span>
          <input
            type="number"
            value={h}
            onChange={(e) => changeH(Number(e.target.value))}
            className="h-[30px] w-full rounded-md border border-border bg-surface2 px-2.5 text-[13px] font-medium text-textbright outline-none focus:border-accent"
          />
        </label>
      </div>

      <span className="text-[11px] font-medium uppercase tracking-wider text-text2">Presets</span>
      <div className="flex flex-col gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setLocked(false);
              setW(p.w);
              setH(p.h);
            }}
            className="flex h-8 items-center justify-between rounded-md border border-border bg-surface2 px-3 text-xs font-medium text-textlabel transition hover:border-border2 hover:text-textbright"
          >
            <span>{p.label}</span>
            <span className="text-text2 tabular-nums">
              {p.w} × {p.h}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={applyResize}
        disabled={unchanged}
        className="h-[34px] rounded-md bg-accent text-[13px] font-semibold text-canvas transition hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
      >
        Apply resize
      </button>
    </div>
  );
}
