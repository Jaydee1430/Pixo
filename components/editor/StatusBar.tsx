"use client";

import { useEditor } from "@/store/editorStore";

export function StatusBar() {
  const hasImage = useEditor((s) => !!s.base);
  const fileName = useEditor((s) => s.fileName);
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);
  const zoom = useEditor((s) => s.zoom);
  const processing = useEditor((s) => s.processing);

  if (!hasImage) {
    return (
      <footer className="flex h-[30px] flex-none items-center border-t border-border bg-surface px-3 text-xs text-textmuted sm:px-4">
        No image loaded
      </footer>
    );
  }

  return (
    <footer className="flex h-[30px] flex-none items-center gap-2 overflow-hidden border-t border-border bg-surface px-3 text-xs text-text2 sm:gap-4 sm:px-4">
      <span className="min-w-0 truncate font-medium text-textbright md:hidden">{fileName}</span>
      <span className="text-[#3a4048] md:hidden">·</span>
      <span className="whitespace-nowrap tabular-nums">
        {width} × {height}
      </span>
      <span className="text-[#3a4048]">|</span>
      <span className="whitespace-nowrap tabular-nums">{zoom}%</span>
      <span className="hidden text-[#3a4048] sm:inline">|</span>
      <span className="hidden sm:inline">RGB · 8-bit</span>
      <div className="flex-1" />
      {processing ? (
        <div className="flex min-w-0 items-center gap-2 text-accent">
          <span className="h-[11px] w-[11px] flex-none animate-pixospin rounded-full border-[1.5px] border-accent border-t-transparent" />
          <span className="truncate font-medium">{processing}</span>
        </div>
      ) : (
        <div className="flex flex-none items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full bg-success" />
          <span className="hidden sm:inline">Ready</span>
        </div>
      )}
    </footer>
  );
}
