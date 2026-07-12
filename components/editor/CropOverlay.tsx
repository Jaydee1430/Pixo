"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@/store/editorStore";
import { useEditorUI } from "./uiContext";
import type { Rect } from "@/lib/image/ops";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const HANDLES: { id: string; x: number; y: number; cursor: string }[] = [
  { id: "nw", x: 0, y: 0, cursor: "nwse-resize" },
  { id: "n", x: 0.5, y: 0, cursor: "ns-resize" },
  { id: "ne", x: 1, y: 0, cursor: "nesw-resize" },
  { id: "w", x: 0, y: 0.5, cursor: "ew-resize" },
  { id: "e", x: 1, y: 0.5, cursor: "ew-resize" },
  { id: "sw", x: 0, y: 1, cursor: "nesw-resize" },
  { id: "s", x: 0.5, y: 1, cursor: "ns-resize" },
  { id: "se", x: 1, y: 1, cursor: "nwse-resize" },
];

export function defaultCropRect(imgW: number, imgH: number, aspect: string): Rect {
  const ratio = parseAspect(aspect);
  if (!ratio) {
    return { x: imgW * 0.1, y: imgH * 0.1, w: imgW * 0.8, h: imgH * 0.8 };
  }
  let w = imgW;
  let h = w / ratio;
  if (h > imgH) {
    h = imgH;
    w = h * ratio;
  }
  w *= 0.9;
  h *= 0.9;
  return { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h };
}

function parseAspect(a: string): number | null {
  if (a === "free") return null;
  const [wr, hr] = a.split(":").map(Number);
  return wr / hr;
}

export function CropOverlay({ scale }: { scale: number }) {
  const imgW = useEditor((s) => s.width);
  const imgH = useEditor((s) => s.height);
  const { cropRect, setCropRect } = useEditorUI();
  const drag = useRef<null | { handle: string; sx: number; sy: number; rect: Rect }>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const { handle, sx, sy, rect } = drag.current;
      const dx = (e.clientX - sx) / scale;
      const dy = (e.clientY - sy) / scale;
      let { x, y, w, h } = rect;
      const min = 24;
      if (handle === "move") {
        x = clamp(x + dx, 0, imgW - w);
        y = clamp(y + dy, 0, imgH - h);
      } else {
        if (handle.includes("w")) {
          const nx = clamp(x + dx, 0, x + w - min);
          w += x - nx;
          x = nx;
        }
        if (handle.includes("e")) w = clamp(w + dx, min, imgW - x);
        if (handle.includes("n")) {
          const ny = clamp(y + dy, 0, y + h - min);
          h += y - ny;
          y = ny;
        }
        if (handle.includes("s")) h = clamp(h + dy, min, imgH - y);
      }
      setCropRect({ x, y, w, h });
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [scale, imgW, imgH, setCropRect]);

  if (!cropRect) return null;
  const start = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { handle, sx: e.clientX, sy: e.clientY, rect: { ...cropRect } };
  };

  const px = (v: number) => v * scale;
  const box = {
    left: px(cropRect.x),
    top: px(cropRect.y),
    width: px(cropRect.w),
    height: px(cropRect.h),
  };

  const dark = "rgba(11,13,16,0.6)";
  return (
    <div className="absolute inset-0 z-10">
      {/* darkened area outside the crop rect (four strips) */}
      <div className="pointer-events-none absolute left-0 top-0 w-full" style={{ height: box.top, background: dark }} />
      <div className="pointer-events-none absolute left-0 w-full" style={{ top: box.top + box.height, bottom: 0, background: dark }} />
      <div className="pointer-events-none absolute left-0" style={{ top: box.top, height: box.height, width: box.left, background: dark }} />
      <div className="pointer-events-none absolute" style={{ left: box.left + box.width, right: 0, top: box.top, height: box.height, background: dark }} />
      <div
        className="absolute cursor-move border border-accent"
        style={box}
        onPointerDown={(e) => start(e, "move")}
      >
        {/* rule-of-thirds guides */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute top-1/3 left-0 h-px w-full bg-white/20" />
          <div className="absolute top-2/3 left-0 h-px w-full bg-white/20" />
        </div>
        {HANDLES.map((hd) => (
          <div
            key={hd.id}
            onPointerDown={(e) => start(e, hd.id)}
            style={{
              left: `${hd.x * 100}%`,
              top: `${hd.y * 100}%`,
              cursor: hd.cursor,
            }}
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border-[1.5px] border-accent bg-white"
          />
        ))}
      </div>
    </div>
  );
}
