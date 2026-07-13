"use client";

import Link from "next/link";
import Image from "next/image";
import { useEditor } from "@/store/editorStore";
import { useEditorUI } from "./uiContext";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function TopBar() {
  const { openPicker } = useEditorUI();
  const fileName = useEditor((s) => s.fileName);
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);
  const zoom = useEditor((s) => s.zoom);
  const hasImage = useEditor((s) => !!s.base);
  const edited = useEditor((s) => s.index > 0);
  const canUndo = useEditor((s) => s.index > 0);
  const canRedo = useEditor((s) => s.index < s.history.length - 1);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const zoomIn = useEditor((s) => s.zoomIn);
  const zoomOut = useEditor((s) => s.zoomOut);
  const setTool = useEditor((s) => s.setTool);

  return (
    <header className="flex h-12 flex-none items-center gap-2 border-b border-border bg-surface px-3 sm:h-[52px] sm:gap-4 sm:px-4">
      <Link href="/" className="flex flex-none items-center gap-2 sm:w-[200px]">
        <Image
          src="/pixo-logo.png"
          alt="Pixo logo"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
        <span className="text-[15px] font-bold tracking-tight text-text sm:text-[16px]">Pixo</span>
      </Link>

      <div className="hidden min-w-0 flex-1 items-center justify-center gap-2.5 md:flex">
        {hasImage ? (
          <>
            <span className="truncate text-[13px] font-medium text-textbright">{fileName}</span>
            <span className="text-[#3a4048]">·</span>
            <span className="whitespace-nowrap text-xs text-text2 tabular-nums">
              {width} × {height} px
            </span>
            {edited && (
              <span className="rounded border border-border bg-surface2 px-1.5 py-0.5 text-[10px] font-medium text-text2">
                Edited
              </span>
            )}
          </>
        ) : (
          <span className="text-[13px] text-textmuted">No file open</span>
        )}
      </div>

      <div className="ml-auto flex flex-none items-center gap-1 sm:gap-2">
        <IconBtn label="Undo (Ctrl+Z)" icon="undo" onClick={undo} disabled={!canUndo} />
        <IconBtn label="Redo (Ctrl+Shift+Z)" icon="redo" onClick={redo} disabled={!canRedo} />
        <div className="hidden h-5 w-px bg-border sm:block" />
        <div className="hidden items-center gap-0.5 rounded-md border border-border bg-surface2 p-0.5 sm:flex">
          <button
            title="Zoom out"
            onClick={zoomOut}
            disabled={!hasImage}
            className="flex h-[26px] w-[26px] items-center justify-center rounded text-textlabel transition hover:bg-surface3 hover:text-textbright disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Icon name="minus" size={14} />
          </button>
          <span className="w-11 text-center text-xs font-medium text-textbright tabular-nums">
            {hasImage ? `${zoom}%` : "—"}
          </span>
          <button
            title="Zoom in"
            onClick={zoomIn}
            disabled={!hasImage}
            className="flex h-[26px] w-[26px] items-center justify-center rounded text-textlabel transition hover:bg-surface3 hover:text-textbright disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Icon name="plus" size={14} />
          </button>
        </div>
        <div className="hidden h-5 w-px bg-border sm:block" />
        <Button variant="secondary" onClick={openPicker} className="px-2.5 sm:px-3.5">
          <Icon name="import" size={14} />
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button
          variant="primary"
          onClick={() => setTool("export")}
          disabled={!hasImage}
          className="px-2.5 sm:px-3.5"
        >
          <Icon name="download" size={14} />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </header>
  );
}

function IconBtn({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: "undo" | "redo";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-textlabel transition",
        "hover:bg-surface2 hover:text-textbright",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
        "disabled:cursor-not-allowed disabled:text-textmuted disabled:opacity-60 disabled:hover:bg-transparent",
      )}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
