"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor } from "@/store/editorStore";
import { useEditorUI } from "./uiContext";
import { applyBrush, magicWandRemove } from "@/lib/image/bgremove";

export function BgRemoveOverlay({
  scale,
  dispW,
  dispH,
}: {
  scale: number;
  dispW: number;
  dispH: number;
}) {
  const imgW = useEditor((s) => s.width);
  const imgH = useEditor((s) => s.height);
  const {
    bgMode,
    bgBrushMode,
    bgTolerance,
    bgFeather,
    bgWhole,
    brushSize,
    maskRef,
    bumpMask,
    clearMask,
    maskVersion,
  } = useEditorUI();

  const overlayRef = useRef<HTMLCanvasElement>(null);
  const painting = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const tint = bgBrushMode === "erase" ? "rgba(255,86,86,0.55)" : "rgba(62,207,142,0.55)";

  // Render the brush mask preview (erase = red, restore = green)
  useEffect(() => {
    const o = overlayRef.current;
    const m = maskRef.current;
    if (!o || !m) return;
    o.width = imgW;
    o.height = imgH;
    const ctx = o.getContext("2d")!;
    ctx.clearRect(0, 0, imgW, imgH);
    if (bgMode !== "brush") return;
    ctx.drawImage(m, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, imgW, imgH);
    ctx.globalCompositeOperation = "source-over";
  }, [maskVersion, imgW, imgH, maskRef, bgMode, tint]);

  const toImg = (e: React.PointerEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
  };

  const wand = (x: number, y: number) => {
    const st = useEditor.getState();
    const baked = st.bakedImageData();
    if (!baked) return;
    st.applyOp(magicWandRemove(baked, x, y, bgTolerance, bgFeather, bgWhole));
  };

  const paintMask = (x: number, y: number, prev: { x: number; y: number } | null) => {
    const m = maskRef.current;
    if (!m) return;
    const ctx = m.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    const r = brushSize / 2 / scale;
    if (prev) {
      ctx.lineWidth = r * 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    bumpMask();
  };

  const commitBrush = () => {
    const st = useEditor.getState();
    const baked = st.bakedImageData();
    const m = maskRef.current;
    if (!baked || !m) return;
    st.applyOp(applyBrush(baked, m, bgBrushMode));
    clearMask();
  };

  return (
    <div
      className="absolute inset-0 z-10"
      style={{ cursor: bgMode === "wand" ? "crosshair" : "none", width: dispW, height: dispH }}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const p = toImg(e);
        if (bgMode === "wand") {
          wand(p.x, p.y);
          return;
        }
        painting.current = true;
        setCursor({ x: p.dx, y: p.dy });
        paintMask(p.x, p.y, null);
        last.current = { x: p.x, y: p.y };
      }}
      onPointerMove={(e) => {
        if (bgMode !== "brush") return;
        const p = toImg(e);
        setCursor({ x: p.dx, y: p.dy });
        if (painting.current) {
          paintMask(p.x, p.y, last.current);
          last.current = { x: p.x, y: p.y };
        }
      }}
      onPointerUp={() => {
        if (bgMode === "brush" && painting.current) commitBrush();
        painting.current = false;
        last.current = null;
      }}
      onPointerLeave={() => setCursor(null)}
    >
      <canvas
        ref={overlayRef}
        className="absolute inset-0 h-full w-full"
        style={{ width: dispW, height: dispH }}
      />
      {bgMode === "brush" && cursor && (
        <div
          className="pointer-events-none absolute rounded-full border border-white/80 bg-white/10"
          style={{
            width: brushSize,
            height: brushSize,
            left: cursor.x - brushSize / 2,
            top: cursor.y - brushSize / 2,
          }}
        />
      )}
    </div>
  );
}
