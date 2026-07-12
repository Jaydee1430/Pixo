"use client";

import { create } from "zustand";
import type { Adjustments, Look, ToolId } from "@/lib/types";
import { NEUTRAL_LOOK, looksEqual } from "@/lib/types";
import { bakeLook } from "@/lib/image/canvas";

interface Snapshot {
  base: ImageData;
  width: number;
  height: number;
  look: Look;
}

interface LoadedImage {
  imageData: ImageData;
  width: number;
  height: number;
  name: string;
}

interface EditorState {
  fileName: string | null;
  width: number;
  height: number;
  base: ImageData | null;
  look: Look;
  activeTool: ToolId;
  zoom: number;
  processing: string | null; // status text while an async op runs
  history: Snapshot[];
  index: number;

  loadImage: (img: LoadedImage) => void;
  setTool: (t: ToolId) => void;
  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  setAdjustment: (k: keyof Adjustments, v: number) => void;
  resetAdjustments: () => void;
  setFilter: (id: string, intensity: number) => void;
  commitLook: () => void;
  bakedImageData: () => ImageData | null;
  applyOp: (next: ImageData) => void;
  undo: () => void;
  redo: () => void;
  setProcessing: (m: string | null) => void;
}

const MAX_HISTORY = 24;

const cloneData = (d: ImageData) =>
  new ImageData(new Uint8ClampedArray(d.data), d.width, d.height);

const cloneLook = (l: Look): Look => ({
  adjustments: { ...l.adjustments },
  filterId: l.filterId,
  filterIntensity: l.filterIntensity,
});

const freshLook = (): Look => cloneLook(NEUTRAL_LOOK);

const makeSnap = (s: {
  base: ImageData;
  width: number;
  height: number;
  look: Look;
}): Snapshot => ({
  base: cloneData(s.base),
  width: s.width,
  height: s.height,
  look: cloneLook(s.look),
});

export const useEditor = create<EditorState>((set, get) => {
  /** Push the current state onto the history stack (truncating any redo tail). */
  const pushCurrent = () => {
    const s = get();
    if (!s.base) return;
    const hist = s.history.slice(0, s.index + 1);
    hist.push(makeSnap({ base: s.base, width: s.width, height: s.height, look: s.look }));
    let index = hist.length - 1;
    while (hist.length > MAX_HISTORY) {
      hist.shift();
      index = hist.length - 1;
    }
    set({ history: hist, index });
  };

  const restore = (i: number) => {
    const s = get();
    const snap = s.history[i];
    if (!snap) return;
    set({
      index: i,
      base: cloneData(snap.base),
      width: snap.width,
      height: snap.height,
      look: cloneLook(snap.look),
    });
  };

  return {
    fileName: null,
    width: 0,
    height: 0,
    base: null,
    look: freshLook(),
    activeTool: "adjust",
    zoom: 100,
    processing: null,
    history: [],
    index: -1,

    loadImage: (img) => {
      const look = freshLook();
      set({
        fileName: img.name,
        base: img.imageData,
        width: img.width,
        height: img.height,
        look,
        activeTool: "adjust",
        zoom: 100,
        processing: null,
        history: [makeSnap({ base: img.imageData, width: img.width, height: img.height, look })],
        index: 0,
      });
    },

    setTool: (t) => set({ activeTool: t }),
    setZoom: (z) => set({ zoom: Math.max(10, Math.min(400, Math.round(z))) }),
    zoomIn: () => set((s) => ({ zoom: Math.min(400, s.zoom + 10) })),
    zoomOut: () => set((s) => ({ zoom: Math.max(10, s.zoom - 10) })),
    zoomFit: () => set({ zoom: 100 }),

    setAdjustment: (k, v) =>
      set((s) => ({
        look: { ...s.look, adjustments: { ...s.look.adjustments, [k]: v } },
      })),

    resetAdjustments: () => {
      set((s) => ({
        look: { ...s.look, adjustments: { ...NEUTRAL_LOOK.adjustments } },
      }));
      get().commitLook();
    },

    setFilter: (id, intensity) =>
      set((s) => ({ look: { ...s.look, filterId: id, filterIntensity: intensity } })),

    commitLook: () => {
      const s = get();
      if (!s.base || s.index < 0) return;
      if (looksEqual(s.look, s.history[s.index].look)) return;
      pushCurrent();
    },

    bakedImageData: () => {
      const s = get();
      return s.base ? bakeLook(s.base, s.look) : null;
    },

    applyOp: (next) => {
      set({ base: next, width: next.width, height: next.height, look: freshLook() });
      pushCurrent();
    },

    undo: () => {
      const s = get();
      if (s.index > 0) restore(s.index - 1);
    },
    redo: () => {
      const s = get();
      if (s.index < s.history.length - 1) restore(s.index + 1);
    },

    setProcessing: (m) => set({ processing: m }),
  };
});
