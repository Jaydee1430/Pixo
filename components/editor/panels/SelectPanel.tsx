"use client";

import { useEditor } from "@/store/editorStore";

function Field({ label, value }: { label: string; value: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-text2">{label}</span>
      <input
        value={value}
        readOnly
        className="h-[30px] w-full rounded-md border border-border bg-surface2 px-2.5 text-[13px] font-medium text-textbright tabular-nums outline-none"
      />
    </label>
  );
}

export function SelectPanel() {
  const width = useEditor((s) => s.width);
  const height = useEditor((s) => s.height);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="X" value={0} />
        <Field label="Y" value={0} />
        <Field label="W" value={width} />
        <Field label="H" value={height} />
      </div>
      <p className="text-xs leading-relaxed text-text2">
        Drag the canvas to pan, and ⌘/Ctrl&nbsp;+&nbsp;scroll to zoom. Pick a tool from the left to
        start editing.
      </p>
    </div>
  );
}
