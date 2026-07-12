"use client";

import { useEditor } from "@/store/editorStore";

export function StatusBar() {
  const hasImage = useEditor((s) => !!s.base);
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);
  const zoom = useEditor((s) => s.zoom);
  const processing = useEditor((s) => s.processing);

  if (!hasImage) {
    return (
      <footer className="flex h-[30px] flex-none items-center border-t border-border bg-surface px-4 text-xs text-textmuted">
        No image loaded
      </footer>
    );
  }

  return (
    <footer className="flex h-[30px] flex-none items-center gap-4 border-t border-border bg-surface px-4 text-xs text-text2">
      <span className="tabular-nums">
        {width} × {height} px
      </span>
      <span className="text-[#3a4048]">|</span>
      <span className="tabular-nums">{zoom}%</span>
      <span className="text-[#3a4048]">|</span>
      <span>RGB · 8-bit</span>
      <div className="flex-1" />
      {processing ? (
        <div className="flex items-center gap-2 text-accent">
          <span className="h-[11px] w-[11px] animate-pixospin rounded-full border-[1.5px] border-accent border-t-transparent" />
          <span className="font-medium">{processing}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full bg-success" />
          <span>Ready</span>
        </div>
      )}
    </footer>
  );
}
