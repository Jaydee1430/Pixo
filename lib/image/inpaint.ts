/**
 * Classical, zero-cost inpainting for the Object Remover.
 * "Onion-peel" fill: masked pixels are filled inward from their known
 * neighbours, then lightly smoothed to hide seams. It removes small
 * distractions cleanly and runs instantly in the browser.
 */
export function inpaint(base: ImageData, mask: HTMLCanvasElement): ImageData {
  const w = base.width;
  const h = base.height;
  const out = new Uint8ClampedArray(base.data);

  const md = mask.getContext("2d")!.getImageData(0, 0, w, h).data;
  const need = new Uint8Array(w * h); // 1 = still needs filling
  let count = 0;
  for (let i = 0; i < w * h; i++) {
    if (md[i * 4 + 3] > 16 && md[i * 4] > 16) {
      need[i] = 1;
      count++;
    }
  }
  if (!count) return base;

  // global mean of known pixels (fallback for anything left over)
  let mr = 0;
  let mg = 0;
  let mb = 0;
  let known = 0;
  for (let i = 0; i < w * h; i++) {
    if (!need[i]) {
      mr += out[i * 4];
      mg += out[i * 4 + 1];
      mb += out[i * 4 + 2];
      known++;
    }
  }
  if (known) {
    mr /= known;
    mg /= known;
    mb /= known;
  }

  const passes = Math.min(80, Math.max(20, Math.round(Math.sqrt(count))));
  for (let p = 0; p < passes; p++) {
    let changed = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (!need[idx]) continue;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const nidx = ny * w + nx;
            if (!need[nidx]) {
              r += out[nidx * 4];
              g += out[nidx * 4 + 1];
              b += out[nidx * 4 + 2];
              n++;
            }
          }
        }
        if (n > 0) {
          out[idx * 4] = r / n;
          out[idx * 4 + 1] = g / n;
          out[idx * 4 + 2] = b / n;
          out[idx * 4 + 3] = 255;
          need[idx] = 0;
          changed++;
        }
      }
    }
    if (!changed) break;
  }

  // anything not reached: fallback to global mean
  for (let i = 0; i < w * h; i++) {
    if (need[i]) {
      out[i * 4] = mr;
      out[i * 4 + 1] = mg;
      out[i * 4 + 2] = mb;
      out[i * 4 + 3] = 255;
    }
  }

  // smoothing passes over the original masked region to reduce seams
  const wasMasked = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (md[i * 4 + 3] > 16 && md[i * 4] > 16) wasMasked[i] = 1;
  const tmp = new Uint8ClampedArray(out);
  for (let p = 0; p < 3; p++) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (!wasMasked[idx]) continue;
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) sum += out[((y + dy) * w + (x + dx)) * 4 + c];
          tmp[idx * 4 + c] = sum / 9;
        }
      }
    }
    out.set(tmp);
  }

  return new ImageData(out, w, h);
}
