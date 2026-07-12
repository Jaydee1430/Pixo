import type { Look } from "@/lib/types";
import { lookToFilter } from "./filters";

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round(height));
  return c;
}

export function imageDataToCanvas(data: ImageData): HTMLCanvasElement {
  const c = createCanvas(data.width, data.height);
  const ctx = c.getContext("2d")!;
  ctx.putImageData(data, 0, 0);
  return c;
}

export function canvasToImageData(c: HTMLCanvasElement): ImageData {
  const ctx = c.getContext("2d")!;
  return ctx.getImageData(0, 0, c.width, c.height);
}

/** Load a File/Blob into ImageData plus metadata. */
export async function loadImageFile(
  file: File | Blob,
  name = "image",
): Promise<{ imageData: ImageData; width: number; height: number; name: string }> {
  const bitmap = await createImageBitmap(file);
  const c = createCanvas(bitmap.width, bitmap.height);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  return { imageData, width: c.width, height: c.height, name };
}

/** Bake the live look into pixels (used by destructive ops that must read final pixels). */
export function bakeLook(source: ImageData, look: Look): ImageData {
  const filter = lookToFilter(look);
  if (filter === "none") return source;
  const src = imageDataToCanvas(source);
  const out = createCanvas(source.width, source.height);
  const ctx = out.getContext("2d")!;
  ctx.filter = filter;
  ctx.drawImage(src, 0, 0);
  return canvasToImageData(out);
}

export type ExportFormat = "png" | "jpg" | "webp";

const MIME: Record<ExportFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

/** Bake the look and produce a downloadable Blob in the requested format. */
export async function exportImage(
  base: ImageData,
  look: Look,
  format: ExportFormat,
  quality: number, // 1..100
): Promise<Blob> {
  const canvas = createCanvas(base.width, base.height);
  const ctx = canvas.getContext("2d")!;
  // JPG has no alpha — fill white so transparent areas don't turn black.
  if (format === "jpg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const filter = lookToFilter(look);
  if (filter !== "none") ctx.filter = filter;
  ctx.drawImage(imageDataToCanvas(base), 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      MIME[format],
      format === "png" ? undefined : quality / 100,
    );
  });
}

/** Rough byte estimate of the current export (for the panel's "Output size"). */
export function estimateSize(
  width: number,
  height: number,
  format: ExportFormat,
  quality: number,
): string {
  const px = width * height;
  let bytes: number;
  if (format === "png") bytes = px * 1.6;
  else if (format === "jpg") bytes = px * (0.06 + (quality / 100) * 0.35);
  else bytes = px * (0.04 + (quality / 100) * 0.22);
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
