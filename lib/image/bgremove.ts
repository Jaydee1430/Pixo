import { featherAlpha } from "./ops";

/**
 * Color-based background removal — no model, no download, instant & offline.
 * Every function only edits the ALPHA channel (0 = removed) and preserves RGB,
 * so "restore" is simply setting alpha back to 255.
 *
 * Edges use a SOFT threshold (matting): pixels very close to the background
 * color become fully transparent, the transition band gets partial alpha, and
 * subject pixels stay opaque. This removes the tell-tale white/near-bg "halo"
 * that a hard cut leaves behind and anti-aliases the edge.
 */

/** Map a 0..100 tolerance slider to a squared-distance threshold. */
function toleranceToThreshold(tolerance: number): number {
  const perChannel = (tolerance / 100) * 120;
  return perChannel * perChannel * 3;
}

const dist2 = (
  data: Uint8ClampedArray,
  i: number,
  r: number,
  g: number,
  b: number,
): number => {
  const dr = data[i] - r;
  const dg = data[i + 1] - g;
  const db = data[i + 2] - b;
  return dr * dr + dg * dg + db * db;
};

/** 0 (background) → 255 (subject) with a soft transition band between thresholds. */
function softAlpha(d2: number, thrHard: number, thrSoft: number): number {
  if (d2 <= thrHard) return 0;
  if (d2 >= thrSoft) return 255;
  return Math.round(((d2 - thrHard) / (thrSoft - thrHard)) * 255);
}

/** Quick check: does the image already have any transparent pixels? */
export function hasTransparency(src: ImageData): boolean {
  const d = src.data;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] < 250) return true;
  }
  return false;
}

function maybeFeather(out: ImageData, feather: number): ImageData {
  return feather > 0 ? featherAlpha(out, feather) : out;
}

/**
 * Remove the background by color, seeded from the image borders.
 * - `whole = false` (default): only pixels connected to the border are removed
 *   (safe — won't touch matching colors inside the subject).
 * - `whole = true`: every pixel matching the background color is removed,
 *   including enclosed gaps (ideal for logos / graphics on a solid color).
 */
export function removeByBorders(
  src: ImageData,
  tolerance: number,
  feather = 1,
  whole = false,
): ImageData {
  const { width: w, height: h } = src;
  const out = new ImageData(new Uint8ClampedArray(src.data), w, h);
  const d = out.data;
  const thrHard = toleranceToThreshold(tolerance);
  const thrSoft = toleranceToThreshold(Math.min(100, tolerance * 1.8));

  // average border color (skip already-transparent pixels)
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let n = 0;
  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    if (d[i + 3] < 8) return;
    sr += d[i];
    sg += d[i + 1];
    sb += d[i + 2];
    n++;
  };
  for (let x = 0; x < w; x++) {
    sample(x, 0);
    sample(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    sample(0, y);
    sample(w - 1, y);
  }
  if (n === 0) return src;
  const br = sr / n;
  const bg = sg / n;
  const bb = sb / n;

  if (whole) {
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      if (d[i + 3] === 0) continue;
      const a = softAlpha(dist2(d, i, br, bg, bb), thrHard, thrSoft);
      if (a < d[i + 3]) d[i + 3] = a;
    }
    return maybeFeather(out, feather);
  }

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const seed = (x: number, y: number) => {
    const p = y * w + x;
    if (visited[p]) return;
    if (dist2(d, p * 4, br, bg, bb) <= thrSoft) {
      visited[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x, 0);
    seed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    seed(0, y);
    seed(w - 1, y);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const i = p * 4;
    const a = softAlpha(dist2(d, i, br, bg, bb), thrHard, thrSoft);
    if (a < d[i + 3]) d[i + 3] = a;
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) seed(x - 1, y);
    if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < h - 1) seed(x, y + 1);
  }

  return maybeFeather(out, feather);
}

/**
 * Magic wand: remove pixels similar to the one clicked.
 * `whole = false` removes only the connected region; `whole = true` removes
 * every matching pixel across the image.
 */
export function magicWandRemove(
  src: ImageData,
  px: number,
  py: number,
  tolerance: number,
  feather = 1,
  whole = false,
): ImageData {
  const { width: w, height: h } = src;
  const x0 = Math.max(0, Math.min(w - 1, Math.round(px)));
  const y0 = Math.max(0, Math.min(h - 1, Math.round(py)));
  const out = new ImageData(new Uint8ClampedArray(src.data), w, h);
  const d = out.data;
  const start = (y0 * w + x0) * 4;
  if (d[start + 3] < 8) return src;
  const r = d[start];
  const g = d[start + 1];
  const b = d[start + 2];
  const thrHard = toleranceToThreshold(tolerance);
  const thrSoft = toleranceToThreshold(Math.min(100, tolerance * 1.8));

  if (whole) {
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      if (d[i + 3] === 0) continue;
      const a = softAlpha(dist2(d, i, r, g, b), thrHard, thrSoft);
      if (a < d[i + 3]) d[i + 3] = a;
    }
    return maybeFeather(out, feather);
  }

  const visited = new Uint8Array(w * h);
  const stack: number[] = [y0 * w + x0];
  visited[y0 * w + x0] = 1;
  const seed = (x: number, y: number) => {
    const p = y * w + x;
    if (visited[p]) return;
    if (dist2(d, p * 4, r, g, b) <= thrSoft) {
      visited[p] = 1;
      stack.push(p);
    }
  };
  while (stack.length) {
    const p = stack.pop()!;
    const i = p * 4;
    const a = softAlpha(dist2(d, i, r, g, b), thrHard, thrSoft);
    if (a < d[i + 3]) d[i + 3] = a;
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) seed(x - 1, y);
    if (x < w - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < h - 1) seed(x, y + 1);
  }

  return maybeFeather(out, feather);
}

export type BrushMode = "erase" | "restore";

/**
 * Apply a brushed mask (white where painted, at image resolution) to the alpha
 * channel: erase → 0, restore → 255. RGB is preserved either way.
 */
export function applyBrush(src: ImageData, mask: HTMLCanvasElement, mode: BrushMode): ImageData {
  const { width: w, height: h } = src;
  const out = new ImageData(new Uint8ClampedArray(src.data), w, h);
  const md = mask.getContext("2d")!.getImageData(0, 0, w, h).data;
  const alpha = mode === "erase" ? 0 : 255;
  const d = out.data;
  for (let i = 0; i < w * h; i++) {
    if (md[i * 4 + 3] > 16 && md[i * 4] > 16) d[i * 4 + 3] = alpha;
  }
  return out;
}

/** Restore the whole image (all alpha → 255). */
export function restoreAll(src: ImageData): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const d = out.data;
  for (let i = 3; i < d.length; i += 4) d[i] = 255;
  return out;
}

/** Re-feather the current cut-out edges. */
export function refeather(src: ImageData, feather: number): ImageData {
  return feather > 0 ? featherAlpha(src, feather) : src;
}
