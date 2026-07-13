"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "@/store/editorStore";
import { loadImageFile } from "@/lib/image/canvas";
import type { Rect } from "@/lib/image/ops";
import { TOOLS } from "@/lib/tools";
import { EditorUIContext } from "./uiContext";
import { TopBar } from "./TopBar";
import { LeftToolRail } from "./LeftToolRail";
import { Canvas } from "./Canvas";
import { RightPanel } from "./RightPanel";
import { StatusBar } from "./StatusBar";
import { EmptyState } from "./EmptyState";

export function EditorShell() {
  const hasImage = useEditor((s) => !!s.base);
  const setTool = useEditor((s) => s.setTool);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const zoomIn = useEditor((s) => s.zoomIn);
  const zoomOut = useEditor((s) => s.zoomOut);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [cropAspect, setCropAspect] = useState("free");

  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const [brushSize, setBrushSize] = useState(44);
  const [maskVersion, setMaskVersion] = useState(0);
  const [hasMask, setHasMask] = useState(false);

  const [bgMode, setBgMode] = useState<"wand" | "brush">("wand");
  const [bgBrushMode, setBgBrushMode] = useState<"erase" | "restore">("erase");
  const [bgTolerance, setBgTolerance] = useState(36);
  const [bgFeather, setBgFeather] = useState(1);
  const [bgWhole, setBgWhole] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(true);

  useEffect(() => {
    if (!maskRef.current) maskRef.current = document.createElement("canvas");
  }, []);

  const clearMask = useCallback(() => {
    const m = maskRef.current;
    if (m) {
      const { width: w, height: h } = useEditor.getState();
      if (w) m.width = w;
      if (h) m.height = h;
      m.getContext("2d")!.clearRect(0, 0, m.width, m.height);
    }
    setHasMask(false);
    setMaskVersion((v) => v + 1);
  }, []);

  const bumpMask = useCallback(() => {
    setHasMask(true);
    setMaskVersion((v) => v + 1);
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const file = arr.find((f) => f.type.startsWith("image/")) ?? arr[0];
    if (!file) return;
    try {
      const res = await loadImageFile(file, file.name);
      useEditor.getState().loadImage(res);
      setCropRect(null);
      setCropAspect("free");
      const m = maskRef.current;
      if (m) {
        m.width = res.width;
        m.height = res.height;
        m.getContext("2d")!.clearRect(0, 0, res.width, res.height);
      }
      setHasMask(false);
      setMaskVersion((v) => v + 1);
    } catch {
      window.alert("Sorry — that image couldn't be opened. Try a JPG, PNG, or WebP file.");
    }
  }, []);

  const openPicker = useCallback(() => fileInputRef.current?.click(), []);

  // Clear the crop rect when leaving the crop tool, and reset the brush mask
  // whenever the committed image dimensions change (crop/resize/new image).
  useEffect(() => {
    return useEditor.subscribe((s, prev) => {
      if (s.activeTool !== prev.activeTool && s.activeTool !== "crop") setCropRect(null);
      if (s.width !== prev.width || s.height !== prev.height) clearMask();
    });
  }, [clearMask]);

  useEffect(() => {
    return useEditor.subscribe((s, prev) => {
      if (s.activeTool !== prev.activeTool && s.activeTool !== "select") {
        setMobilePanelOpen(true);
      }
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
        return;
      }
      if (meta) return;
      if (e.key === "+" || e.key === "=") return zoomIn();
      if (e.key === "-" || e.key === "_") return zoomOut();
      if (!hasImage) return;
      const tool = TOOLS.find((x) => x.key.toLowerCase() === e.key.toLowerCase());
      if (tool) setTool(tool.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasImage, redo, undo, zoomIn, zoomOut, setTool]);

  const ctx = useMemo(
    () => ({
      openPicker,
      isDragging,
      cropRect,
      setCropRect,
      cropAspect,
      setCropAspect,
      maskRef,
      brushSize,
      setBrushSize,
      maskVersion,
      bumpMask,
      clearMask,
      hasMask,
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
      mobilePanelOpen,
      setMobilePanelOpen,
    }),
    [
      openPicker,
      isDragging,
      cropRect,
      cropAspect,
      brushSize,
      maskVersion,
      bumpMask,
      clearMask,
      hasMask,
      bgMode,
      bgBrushMode,
      bgTolerance,
      bgFeather,
      bgWhole,
      mobilePanelOpen,
    ],
  );

  return (
    <EditorUIContext.Provider value={ctx}>
      <div
        className="flex h-dvh flex-col overflow-hidden bg-canvas text-[13px] text-textbright"
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current++;
          if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) setIsDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current--;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setIsDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setIsDragging(false);
          if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
        }}
      >
        <TopBar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <LeftToolRail />
          <main className="relative order-1 min-h-0 min-w-0 flex-1 md:order-none">
            {hasImage ? <Canvas /> : <EmptyState />}
          </main>
          {hasImage && <RightPanel />}
        </div>
        <StatusBar />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </EditorUIContext.Provider>
  );
}
