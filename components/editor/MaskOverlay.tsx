"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor } from "@/store/editorStore";
import { useEditorUI } from "./uiContext";

export function MaskOverlay({
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
  const { maskRef, brushSize, bumpMask, maskVersion } = useEditorUI();
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const painting = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // Re-render the red mask preview whenever the mask changes
  useEffect(() => {
    const o = overlayRef.current;
    const m = maskRef.current;
    if (!o || !m) return;
    o.width = imgW;
    o.height = imgH;
    const ctx = o.getContext("2d")!;
    ctx.clearRect(0, 0, imgW, imgH);
    ctx.drawImage(m, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "rgba(255,86,86,0.55)";
    ctx.fillRect(0, 0, imgW, imgH);
    ctx.globalCompositeOperation = "source-over";
  }, [maskVersion, imgW, imgH, maskRef]);

  const toImg = (e: React.PointerEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
  };

  const paint = (x: number, y: number, prev: { x: number; y: number } | null) => {
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

  return (
    <div
      className="absolute inset-0 z-10"
      style={{ cursor: "none", width: dispW, height: dispH }}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        painting.current = true;
        const p = toImg(e);
        setCursor({ x: p.dx, y: p.dy });
        paint(p.x, p.y, null);
        last.current = { x: p.x, y: p.y };
      }}
      onPointerMove={(e) => {
        const p = toImg(e);
        setCursor({ x: p.dx, y: p.dy });
        if (painting.current) {
          paint(p.x, p.y, last.current);
          last.current = { x: p.x, y: p.y };
        }
      }}
      onPointerUp={() => {
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
      {cursor && (
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
