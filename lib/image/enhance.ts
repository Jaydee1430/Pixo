import { blurImageData } from "./ops";

/**
 * Auto-enhance: gray-world white balance → per-channel percentile levels
 * stretch → unsharp mask. `strength` (0..1) blends the result with the original.
 * Pure client-side pixel math — instant, offline, no cost.
 */
export function enhance(src: ImageData, strength = 1): ImageData {
  const { width, height } = src;
  const n = width * height;
  const s = src.data;

  // 1) gray-world white balance (clamped gains)
  let sr = 0;
  let sg = 0;
  let sb = 0;
  for (let i = 0; i < n; i++) {
    sr += s[i * 4];
    sg += s[i * 4 + 1];
    sb += s[i * 4 + 2];
  }
  const mr = sr / n || 1;
  const mg = sg / n || 1;
  const mb = sb / n || 1;
  const mgray = (mr + mg + mb) / 3;
  const clampGain = (k: number) => Math.min(1.5, Math.max(0.75, k));
  const gr = clampGain(mgray / mr);
  const gg = clampGain(mgray / mg);
  const gb = clampGain(mgray / mb);

  // 2) per-channel percentile stretch
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  const wb = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const r = Math.min(255, s[i * 4] * gr) | 0;
    const g = Math.min(255, s[i * 4 + 1] * gg) | 0;
    const b = Math.min(255, s[i * 4 + 2] * gb) | 0;
    wb[i * 4] = r;
    wb[i * 4 + 1] = g;
    wb[i * 4 + 2] = b;
    wb[i * 4 + 3] = s[i * 4 + 3];
    hist[0][r]++;
    hist[1][g]++;
    hist[2][b]++;
  }
  const clip = Math.max(1, Math.floor(n * 0.005));
  const luts: Uint8ClampedArray[] = [];
  for (let c = 0; c < 3; c++) {
    let lo = 0;
    let hi = 255;
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[c][v];
      if (acc > clip) {
        lo = v;
        break;
      }
    }
    acc = 0;
    for (let v = 255; v >= 0; v--) {
      acc += hist[c][v];
      if (acc > clip) {
        hi = v;
        break;
      }
    }
    if (hi <= lo) {
      lo = 0;
      hi = 255;
    }
    const lut = new Uint8ClampedArray(256);
    const range = hi - lo;
    for (let v = 0; v < 256; v++) lut[v] = ((v - lo) / range) * 255;
    luts.push(lut);
  }
  const stretched = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    stretched[i * 4] = luts[0][wb[i * 4]];
    stretched[i * 4 + 1] = luts[1][wb[i * 4 + 1]];
    stretched[i * 4 + 2] = luts[2][wb[i * 4 + 2]];
    stretched[i * 4 + 3] = wb[i * 4 + 3];
  }

  // 3) unsharp mask (blur via canvas, then add the high-frequency detail back)
  const blurred = blurImageData(new ImageData(stretched, width, height), 1.2).data;
  const amount = 0.55;
  const out = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) {
      const idx = i * 4 + c;
      const sharp = stretched[idx] + amount * (stretched[idx] - blurred[idx]);
      // 4) blend enhanced result with the original by strength
      out[idx] = s[idx] + (sharp - s[idx]) * strength;
    }
    out[i * 4 + 3] = s[i * 4 + 3];
  }
  return new ImageData(out, width, height);
}
