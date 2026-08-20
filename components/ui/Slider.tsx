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
        return `linear-gradient(to right, #d4d4d4 ${lo}%, #171717 ${lo}%, #171717 ${hi}%, #d4d4d4 ${hi}%)`;
      })()
    : `linear-gradient(to right, #171717 ${pct}%, #d4d4d4 ${pct}%)`;

  const shown = display ?? `${value > 0 && bidirectional ? "+" : ""}${value}${unit}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#404040]">{label}</span>
        <span className="min-w-[38px] rounded border border-[#d4d4d4] bg-[#eeeeee] px-1.5 py-0.5 text-center text-xs font-medium text-[#171717] tabular-nums">
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
        style={{ background: `${grad} center / 100% 6px no-repeat` }}
      />
    </div>
  );
}
