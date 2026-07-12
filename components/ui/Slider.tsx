"use client";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  bidirectional?: boolean;
  display?: string;
  unit?: string;
  onChange: (v: number) => void;
  onCommit?: () => void;
};

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  bidirectional = false,
  display,
  unit = "",
  onChange,
  onCommit,
}: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  const grad = bidirectional
    ? (() => {
        const lo = Math.min(50, pct);
        const hi = Math.max(50, pct);
        return `linear-gradient(to right, var(--color-border) ${lo}%, var(--accent) ${lo}%, var(--accent) ${hi}%, var(--color-border) ${hi}%)`;
      })()
    : `linear-gradient(to right, var(--accent) ${pct}%, var(--color-border) ${pct}%)`;

  const shown = display ?? `${value > 0 && bidirectional ? "+" : ""}${value}${unit}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-textlabel">{label}</span>
        <span className="min-w-[38px] rounded border border-border bg-surface2 px-1.5 py-0.5 text-center text-xs font-medium text-textbright tabular-nums">
          {shown}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={() => onCommit?.()}
        onKeyUp={() => onCommit?.()}
        aria-label={label}
        style={{ background: `${grad} center / 100% 4px no-repeat` }}
      />
    </div>
  );
}
