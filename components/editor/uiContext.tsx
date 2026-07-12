"use client";

import { createContext, useContext } from "react";
import type { RefObject } from "react";
import type { Rect } from "@/lib/image/ops";

export interface EditorUI {
  openPicker: () => void;
  isDragging: boolean;

  // Crop tool
  cropRect: Rect | null;
  setCropRect: (r: Rect | null) => void;
  cropAspect: string;
  setCropAspect: (a: string) => void;

  // Brush mask at image resolution (shared by Object Remover + Background brush)
  maskRef: RefObject<HTMLCanvasElement | null>;
  brushSize: number;
  setBrushSize: (n: number) => void;
  maskVersion: number;
  bumpMask: () => void;
  clearMask: () => void;
  hasMask: boolean;

  // Background Removal tool
  bgMode: "wand" | "brush";
  setBgMode: (m: "wand" | "brush") => void;
  bgBrushMode: "erase" | "restore";
  setBgBrushMode: (m: "erase" | "restore") => void;
  bgTolerance: number;
  setBgTolerance: (n: number) => void;
  bgFeather: number;
  setBgFeather: (n: number) => void;
  bgWhole: boolean;
  setBgWhole: (b: boolean) => void;
}

export const EditorUIContext = createContext<EditorUI | null>(null);

export function useEditorUI(): EditorUI {
  const ctx = useContext(EditorUIContext);
  if (!ctx) throw new Error("useEditorUI must be used within EditorShell");
  return ctx;
}
