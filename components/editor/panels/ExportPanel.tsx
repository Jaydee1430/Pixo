"use client";

import { useState } from "react";
import { useEditor } from "@/store/editorStore";
import type { ExportFormat } from "@/lib/image/canvas";
import { baseName, downloadBlob, estimateSize, exportImage } from "@/lib/image/canvas";
import { Slider } from "@/components/ui/Slider";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const FORMATS: { id: ExportFormat; label: string; ext: string }[] = [
  { id: "png", label: "PNG", ext: "png" },
  { id: "jpg", label: "JPG", ext: "jpg" },
  { id: "webp", label: "WebP", ext: "webp" },
];

export function ExportPanel() {
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);
  const fileName = useEditor((s) => s.fileName);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);

  const active = FORMATS.find((f) => f.id === format)!;
  const showQuality = format !== "png";

  const download = async () => {
    const s = useEditor.getState();
    if (!s.base) return;
    setBusy(true);
    try {
      const blob = await exportImage(s.base, s.look, format, quality);
      downloadBlob(blob, `${baseName(fileName ?? "image")}-pixo.${active.ext}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-text2">Format</span>
      <div className="flex gap-1.5">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={cn(
              "h-[30px] flex-1 rounded-md border text-xs font-medium transition",
              format === f.id
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface2 text-textlabel hover:border-border2 hover:text-textbright",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showQuality && (
        <Slider label="Quality" value={quality} min={1} max={100} unit="%" onChange={setQuality} />
      )}

      <div className="h-px bg-border" />

      <div className="flex items-center justify-between text-xs text-text2">
        <span>Output size</span>
        <span className="text-textbright tabular-nums">
          {width} × {height} · ~{estimateSize(width, height, format, quality)}
        </span>
      </div>

      <button
        onClick={download}
        disabled={busy}
        className="flex h-[38px] items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-semibold text-canvas transition hover:brightness-110 disabled:opacity-50"
      >
        <Icon name="download" size={14} />
        {busy ? "Preparing…" : `Download ${active.label}`}
      </button>
    </div>
  );
}
