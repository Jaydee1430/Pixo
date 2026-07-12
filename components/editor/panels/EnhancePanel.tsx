"use client";

import { useState } from "react";
import { useEditor } from "@/store/editorStore";
import { Slider } from "@/components/ui/Slider";
import { Icon } from "@/components/ui/Icon";
import { runOp } from "@/lib/runOp";
import { enhance } from "@/lib/image/enhance";

export function EnhancePanel() {
  const processing = useEditor((s) => s.processing);
  const [strength, setStrength] = useState(80);

  const apply = () => {
    const baked = useEditor.getState().bakedImageData();
    if (baked) runOp("Enhancing…", () => enhance(baked, strength / 100));
  };

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-xs leading-relaxed text-text2">
        One-tap fix for flat photos: auto white balance, levels stretch, and gentle sharpening —
        all computed on your device.
      </p>

      <Slider label="Strength" value={strength} min={10} max={100} unit="%" onChange={setStrength} />

      <button
        onClick={apply}
        disabled={!!processing}
        className="flex h-[38px] items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-semibold text-canvas transition hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
      >
        <Icon name="sparkle" size={14} />
        Auto-enhance
      </button>

      <p className="text-xs text-textmuted">Applies instantly — undo with Ctrl+Z if you change your mind.</p>
    </div>
  );
}
