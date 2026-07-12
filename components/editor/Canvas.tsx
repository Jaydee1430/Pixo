"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor } from "@/store/editorStore";
import { lookToFilter } from "@/lib/image/filters";
import { CropOverlay } from "./CropOverlay";
import { MaskOverlay } from "./MaskOverlay";
import { BgRemoveOverlay } from "./BgRemoveOverlay";

export function Canvas() {
  const base = useEditor((s) => s.base);
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);
  const look = useEditor((s) => s.look);
  const zoom = useEditor((s) => s.zoom);
  const setZoom = useEditor((s) => s.setZoom);
  const tool = useEditor((s) => s.activeTool);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panning = useRef<null | { sx: number; sy: number; ox: number; oy: number }>(null);
  const [grabbing, setGrabbing] = useState(false);

  // Paint committed pixels whenever they change
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !base) return;
    c.width = base.width;
    c.height = base.height;
    c.getContext("2d")!.putImageData(base, 0, 0);
  }, [base]);

  // Auto fit-to-view when the image dimensions change
  const dimsKey = `${width}x${height}`;
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !width || !height) return;
    const pad = 80;
    const fit = Math.min((el.clientWidth - pad) / width, (el.clientHeight - pad) / height, 1);
    setZoom(Math.max(10, Math.round(fit * 100)));
    setPan({ x: 0, y: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimsKey]);

  // Ctrl/Cmd + wheel to zoom (non-passive so we can preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(useEditor.getState().zoom + (e.deltaY < 0 ? 8 : -8));
      } else {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setZoom]);

  const scale = zoom / 100;
  const dispW = width * scale;
  const dispH = height * scale;
  const canPan = tool !== "crop" && tool !== "object" && tool !== "bgremove";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-canvas"
      style={{ cursor: canPan ? (grabbing ? "grabbing" : "grab") : "default" }}
      onPointerDown={(e) => {
        if (!canPan || (e.button !== 0 && e.button !== 1)) return;
        panning.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
        setGrabbing(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!panning.current) return;
        setPan({
          x: panning.current.ox + (e.clientX - panning.current.sx),
          y: panning.current.oy + (e.clientY - panning.current.sy),
        });
      }}
      onPointerUp={() => {
        panning.current = null;
        setGrabbing(false);
      }}
    >
      <div className="checkerboard absolute inset-0 opacity-50" />

      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px)` }}
      >
        <div className="relative" style={{ width: dispW, height: dispH }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full rounded-[2px]"
            style={{
              filter: lookToFilter(look),
              boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.5)",
              imageRendering: scale >= 2.5 ? "pixelated" : "auto",
            }}
          />

          {tool === "select" && (
            <div className="pointer-events-none absolute -inset-px border-[1.5px] border-accent">
              {[
                "left-0 top-0",
                "left-1/2 top-0 -translate-x-1/2",
                "right-0 top-0",
                "left-0 top-1/2 -translate-y-1/2",
                "right-0 top-1/2 -translate-y-1/2",
                "left-0 bottom-0",
                "left-1/2 bottom-0 -translate-x-1/2",
                "right-0 bottom-0",
              ].map((pos, i) => (
                <span
                  key={i}
                  className={`absolute h-[9px] w-[9px] rounded-[2px] border-[1.5px] border-accent bg-white ${pos}`}
                  style={{ margin: "-4.5px" }}
                />
              ))}
            </div>
          )}

          {tool === "crop" && <CropOverlay scale={scale} />}
          {tool === "object" && <MaskOverlay scale={scale} dispW={dispW} dispH={dispH} />}
          {tool === "bgremove" && <BgRemoveOverlay scale={scale} dispW={dispW} dispH={dispH} />}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-text2 backdrop-blur">
        <span>Drag to pan · ⌘/Ctrl + scroll to zoom</span>
      </div>
    </div>
  );
}
