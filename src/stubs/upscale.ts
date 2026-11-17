import type { ImageRatio } from '@/stores/types';

export type PreviewResult = {
  scale: 2 | 4;
  ratio: ImageRatio;
  outWidth: number;
  outHeight: number;
  readyAt: number;
};

const RATIO_MAP: Record<Exclude<ImageRatio, 'Libre'>, [number, number]> = {
  '1:1': [1, 1],
  '4:3': [4, 3],
  '3:2': [3, 2],
  '16:9': [16, 9],
  '9:16': [9, 16],
  '21:9': [21, 9],
  '4:5': [4, 5],
  '2:3': [2, 3],
  '5:4': [5, 4],
};

export function computeOutputSize(
  srcW: number,
  srcH: number,
  scale: 2 | 4,
  ratio: ImageRatio,
): { outWidth: number; outHeight: number } {
  const baseW = Math.max(1, Math.round(srcW * scale));
  const baseH = Math.max(1, Math.round(srcH * scale));
  if (ratio === 'Libre') return { outWidth: baseW, outHeight: baseH };

  const [rw, rh] = RATIO_MAP[ratio];
  const target = rw / rh;
  const current = baseW / baseH;
  if (current > target) {
    const outHeight = baseH;
    const outWidth = Math.round(outHeight * target);
    return { outWidth, outHeight };
  }
  const outWidth = baseW;
  const outHeight = Math.round(outWidth / target);
  return { outWidth, outHeight };
}

/** Stub IA : simule un délai de preview. */
export async function previewUpscale(
  srcW: number,
  srcH: number,
  scale: 2 | 4,
  ratio: ImageRatio,
): Promise<PreviewResult> {
  await new Promise((r) => setTimeout(r, 350));
  const size = computeOutputSize(srcW, srcH, scale, ratio);
  return {
    scale,
    ratio,
    ...size,
    readyAt: Date.now(),
  };
}
