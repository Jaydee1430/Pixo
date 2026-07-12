import type { Look } from "@/lib/types";
import { bakeLook, canvasToImageData, createCanvas, imageDataToCanvas } from "./canvas";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Bake the current look, then crop to a pixel rect. */
export function cropImageData(base: ImageData, look: Look, rect: Rect): ImageData {
  const baked = bakeLook(base, look);
  const src = imageDataToCanvas(baked);
  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const w = Math.max(1, Math.round(rect.w));
  const h = Math.max(1, Math.round(rect.h));
  const out = createCanvas(w, h);
  const ctx = out.getContext("2d")!;
  ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
  return canvasToImageData(out);
}

/** Bake the current look, then resample to new dimensions. */
export function resizeImageData(base: ImageData, look: Look, w: number, h: number): ImageData {
  const baked = bakeLook(base, look);
  const out = createCanvas(w, h);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imageDataToCanvas(baked), 0, 0, w, h);
  return canvasToImageData(out);
}

/** Blur an image via the hardware-accelerated canvas filter. */
export function blurImageData(src: ImageData, px: number): ImageData {
  if (px <= 0) return src;
  const out = createCanvas(src.width, src.height);
  const ctx = out.getContext("2d")!;
  ctx.filter = `blur(${px}px)`;
  ctx.drawImage(imageDataToCanvas(src), 0, 0);
  return canvasToImageData(out);
}

/** Soften the alpha edge of a cutout (feather) by blurring the alpha channel only. */
export function featherAlpha(src: ImageData, px: number): ImageData {
  if (px <= 0) return src;
  const w = src.width;
  const h = src.height;
  const alpha = createCanvas(w, h);
  const actx = alpha.getContext("2d")!;
  const aimg = actx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const a = src.data[i * 4 + 3];
    aimg.data[i * 4] = a;
    aimg.data[i * 4 + 1] = a;
    aimg.data[i * 4 + 2] = a;
    aimg.data[i * 4 + 3] = 255;
  }
  actx.putImageData(aimg, 0, 0);
  const blurred = blurImageData(canvasToImageData(alpha), px);
  const out = new Uint8ClampedArray(src.data);
  for (let i = 0; i < w * h; i++) out[i * 4 + 3] = blurred.data[i * 4];
  return new ImageData(out, w, h);
}

/** Composite a subject cutout over a solid color. */
export function compositeOverColor(cutout: ImageData, color: string): ImageData {
  const out = createCanvas(cutout.width, cutout.height);
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(imageDataToCanvas(cutout), 0, 0);
  return canvasToImageData(out);
}

/** Composite a subject cutout over another image (cover-fit, centered). */
export function compositeOverImage(cutout: ImageData, bg: ImageData): ImageData {
  const cw = cutout.width;
  const ch = cutout.height;
  const out = createCanvas(cw, ch);
  const ctx = out.getContext("2d")!;
  const scale = Math.max(cw / bg.width, ch / bg.height);
  const dw = bg.width * scale;
  const dh = bg.height * scale;
  ctx.drawImage(imageDataToCanvas(bg), (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  ctx.drawImage(imageDataToCanvas(cutout), 0, 0);
  return canvasToImageData(out);
}
