import type { Adjustments, Look } from "@/lib/types";

/**
 * Adjustments → CSS/canvas filter string.
 * The SAME string is used for the live DOM preview (element.style.filter) and
 * for baking on export (ctx.filter), which guarantees WYSIWYG parity.
 */
export function adjustmentsToFilter(a: Adjustments): string {
  const parts: string[] = [];
  const brightness = 1 + a.brightness / 250 + a.exposure / 200;
  const contrast = 1 + a.contrast / 250;
  const saturate = 1 + a.saturation / 150;
  parts.push(`brightness(${brightness.toFixed(4)})`);
  parts.push(`contrast(${contrast.toFixed(4)})`);
  parts.push(`saturate(${saturate.toFixed(4)})`);
  if (a.temperature !== 0) {
    const t = a.temperature;
    const sepia = Math.abs(t / 400);
    const hue = t < 0 ? (180 * Math.abs(t)) / 800 : 0;
    parts.push(`sepia(${sepia.toFixed(4)})`);
    if (hue > 0) parts.push(`hue-rotate(${hue.toFixed(1)}deg)`);
  }
  return parts.join(" ");
}

type FilterTerm = { fn: string; from: number; to: number; unit?: string };

export interface FilterPreset {
  id: string;
  name: string;
  terms: FilterTerm[];
}

/** Presets expressed as filter functions that lerp identity → full by intensity. */
export const FILTER_PRESETS: FilterPreset[] = [
  { id: "none", name: "Original", terms: [] },
  { id: "mono", name: "Mono", terms: [{ fn: "grayscale", from: 0, to: 1 }] },
  {
    id: "noir",
    name: "Noir",
    terms: [
      { fn: "grayscale", from: 0, to: 1 },
      { fn: "contrast", from: 1, to: 1.45 },
      { fn: "brightness", from: 1, to: 0.92 },
    ],
  },
  {
    id: "warm",
    name: "Warm",
    terms: [
      { fn: "sepia", from: 0, to: 0.35 },
      { fn: "saturate", from: 1, to: 1.3 },
      { fn: "brightness", from: 1, to: 1.03 },
    ],
  },
  {
    id: "cool",
    name: "Cool",
    terms: [
      { fn: "sepia", from: 0, to: 0.25 },
      { fn: "hue-rotate", from: 0, to: 165, unit: "deg" },
      { fn: "saturate", from: 1, to: 1.2 },
    ],
  },
  {
    id: "vintage",
    name: "Vintage",
    terms: [
      { fn: "sepia", from: 0, to: 0.45 },
      { fn: "contrast", from: 1, to: 0.9 },
      { fn: "brightness", from: 1, to: 1.05 },
      { fn: "saturate", from: 1, to: 1.2 },
    ],
  },
  {
    id: "fade",
    name: "Fade",
    terms: [
      { fn: "contrast", from: 1, to: 0.82 },
      { fn: "brightness", from: 1, to: 1.12 },
      { fn: "saturate", from: 1, to: 0.82 },
    ],
  },
  {
    id: "vivid",
    name: "Vivid",
    terms: [
      { fn: "saturate", from: 1, to: 1.55 },
      { fn: "contrast", from: 1, to: 1.12 },
    ],
  },
  { id: "sepia", name: "Sepia", terms: [{ fn: "sepia", from: 0, to: 0.85 }] },
];

export const FILTER_BY_ID: Record<string, FilterPreset> = Object.fromEntries(
  FILTER_PRESETS.map((p) => [p.id, p]),
);

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

export function presetToFilter(id: string, intensity: number): string {
  const preset = FILTER_BY_ID[id];
  if (!preset || preset.terms.length === 0) return "";
  const t = Math.max(0, Math.min(1, intensity));
  return preset.terms
    .map((term) => `${term.fn}(${lerp(term.from, term.to, t).toFixed(4)}${term.unit ?? ""})`)
    .join(" ");
}

/** Full look (adjustments + selected preset) → single filter string. */
export function lookToFilter(look: Look): string {
  const adj = adjustmentsToFilter(look.adjustments);
  const preset = presetToFilter(look.filterId, look.filterIntensity);
  return [adj, preset].filter(Boolean).join(" ") || "none";
}
