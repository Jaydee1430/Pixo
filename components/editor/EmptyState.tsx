"use client";

import { useEditorUI } from "./uiContext";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function EmptyState() {
  const { openPicker, isDragging } = useEditorUI();

  return (
    <div className="relative flex h-full w-full items-center justify-center p-12">
      <div className="checkerboard absolute inset-0 opacity-35" />
      <button
        type="button"
        onClick={openPicker}
        className={cn(
          "relative z-10 flex h-full w-full flex-col items-center justify-center gap-5 rounded-xl border-[1.5px] border-dashed bg-surface/40 transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
          isDragging
            ? "border-accent bg-accent/[0.06]"
            : "border-border2 hover:border-accent hover:bg-accent/[0.04]",
        )}
      >
        <span
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl border bg-surface2 text-accent transition",
            isDragging
              ? "border-accent shadow-[0_0_40px_rgba(76,141,255,0.45)]"
              : "border-border shadow-[0_0_28px_rgba(76,141,255,0.18)]",
          )}
        >
          <Icon name="upload" size={26} />
        </span>
        <span className="flex flex-col items-center gap-1.5">
          <span className="text-[17px] font-semibold text-text">
            {isDragging ? "Drop to open" : "Drag & drop an image to start"}
          </span>
          <span className="text-[13px] text-text2">or</span>
        </span>
        <span className="inline-flex h-[38px] items-center rounded-md bg-accent px-5 text-[13px] font-semibold text-canvas transition hover:brightness-110">
          Browse files
        </span>
        <span className="text-xs text-textmuted">JPG · PNG · WebP — up to 50 MB</span>
      </button>
    </div>
  );
}
