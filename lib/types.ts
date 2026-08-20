export type ToolId =
  | "select"
  | "crop"
  | "resize"
  | "bgremove"
  | "adjust"
  | "object"
  | "enhance"
  | "filters"
  | "compress"
  | "watermark"
  | "convert"
  | "jpg-to-png"
  | "png-to-jpg"
  | "webp-to-png"
  | "png-to-webp"
  | "svg-to-png"
  | "svg-to-jpg"
  | "pdf-to-word"
  | "word-to-pdf"
  | "txt-to-pdf"
  | "txt-to-word"
  | "markdown-to-html"
  | "html-to-pdf"
  | "json-to-csv"
  | "csv-to-json"
  | "collage";

export interface Adjustments {
  brightness: number; // -100..100
  contrast: number;
  saturation: number;
  exposure: number;
  temperature: number;
}

export const NEUTRAL_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
};

/** The non-destructive "look" applied on top of committed pixels. */
export interface Look {
  adjustments: Adjustments;
  filterId: string;
  filterIntensity: number; // 0..1
}

export const NEUTRAL_LOOK: Look = {
  adjustments: { ...NEUTRAL_ADJUSTMENTS },
  filterId: "none",
  filterIntensity: 1,
};

export function looksEqual(a: Look, b: Look): boolean {
  const x = a.adjustments;
  const y = b.adjustments;
  return (
    x.brightness === y.brightness &&
    x.contrast === y.contrast &&
    x.saturation === y.saturation &&
    x.exposure === y.exposure &&
    x.temperature === y.temperature &&
    a.filterId === b.filterId &&
    a.filterIntensity === b.filterIntensity
  );
}
