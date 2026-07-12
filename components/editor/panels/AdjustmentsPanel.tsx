"use client";

import { useEditor } from "@/store/editorStore";
import { Slider } from "@/components/ui/Slider";
import { Icon } from "@/components/ui/Icon";
import { runOp } from "@/lib/runOp";
import { enhance } from "@/lib/image/enhance";
import type { Adjustments } from "@/lib/types";

const FIELDS: { key: keyof Adjustments; label: string }[] = [
  { key: "brightness", label: "Brightness" },
  { key: "contrast", label: "Contrast" },
  { key: "saturation", label: "Saturation" },
  { key: "exposure", label: "Exposure" },
  { key: "temperature", label: "Temperature" },
];

export function AdjustmentsPanel() {
  const adjustments = useEditor((s) => s.look.adjustments);
  const setAdjustment = useEditor((s) => s.setAdjustment);
  const commitLook = useEditor((s) => s.commitLook);
  const resetAdjustments = useEditor((s) => s.resetAdjustments);
  const processing = useEditor((s) => s.processing);

  const isNeutral = FIELDS.every((f) => adjustments[f.key] === 0);

  const autoEnhance = () => {
    const baked = useEditor.getState().bakedImageData();
    if (baked) runOp("Enhancing…", () => enhance(baked, 1));
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <button
        onClick={resetAdjustments}
        disabled={isNeutral}
        className="self-end rounded-md border border-border px-2 py-1 text-[11px] font-medium text-text2 transition hover:border-border2 hover:text-textbright disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text2"
      >
        Reset
      </button>

      {FIELDS.map((f) => (
        <Slider
          key={f.key}
          label={f.label}
          value={adjustments[f.key]}
          min={-100}
          max={100}
          bidirectional
          onChange={(v) => setAdjustment(f.key, v)}
          onCommit={commitLook}
        />
      ))}

      <div className="h-px bg-border" />

      <button
        onClick={autoEnhance}
        disabled={!!processing}
        className="flex h-[34px] items-center justify-center gap-2 rounded-md border border-border bg-surface2 text-[13px] font-medium text-textbright transition hover:border-border2 hover:bg-surface3 disabled:opacity-50"
      >
        <Icon name="sparkle" size={14} />
        Auto-enhance
      </button>
    </div>
  );
}
