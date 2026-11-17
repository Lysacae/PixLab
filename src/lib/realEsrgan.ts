/**
 * Vrai upscale Real-ESRGAN / Real-CUGAN via @plotdb/upscaler + tf.js.
 */
import * as tf from '@tensorflow/tfjs';

export type UpscaleProgress = (pct: number) => void;

type WebUpscalerCtor = new (opts: Record<string, unknown>) => {
  warmup: () => Promise<unknown>;
  upscale: (
    input: Blob,
    options?: { format?: string; onProgress?: (p: number) => void },
  ) => Promise<Blob>;
  dispose: () => void;
};

let cachedCtor: WebUpscalerCtor | null = null;

async function getWebUpscaler(): Promise<WebUpscalerCtor> {
  if (cachedCtor) return cachedCtor;
  (globalThis as unknown as { tf: typeof tf }).tf = tf;
  await tf.ready();
  try {
    await tf.setBackend('webgl');
  } catch {
    /* cpu fallback */
  }
  const mod = await import('@plotdb/upscaler');
  cachedCtor = ((mod as { default?: WebUpscalerCtor }).default ||
    (mod as unknown as WebUpscalerCtor)) as WebUpscalerCtor;
  return cachedCtor;
}

function modelBaseUrl() {
  const base = import.meta.env.BASE_URL || './';
  return `${base}upscaler-models`.replace(/\/{2,}/g, '/').replace(':/', '://');
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Impossible de charger limage'));
    img.src = url;
  });
}

async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

function cropBlobToRatio(blob: Blob, ratio: string): Promise<{ blob: Blob; w: number; h: number }> {
  if (ratio === 'Libre') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const u = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(u);
        resolve({ blob, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(u);
        reject(new Error('decode'));
      };
      img.src = u;
    });
  }
  const parts = ratio.split(':').map(Number);
  const target = parts[0] / parts[1];
  return new Promise((resolve, reject) => {
    const img = new Image();
    const u = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(u);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const current = w / h;
      let cw = w;
      let ch = h;
      let sx = 0;
      let sy = 0;
      if (current > target) {
        cw = Math.round(h * target);
        sx = Math.round((w - cw) / 2);
      } else {
        ch = Math.round(w / target);
        sy = Math.round((h - ch) / 2);
      }
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext('2d')!.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
      canvas.toBlob(
        (b) => (b ? resolve({ blob: b, w: cw, h: ch }) : reject(new Error('crop'))),
        'image/png',
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(u);
      reject(new Error('decode'));
    };
    img.src = u;
  });
}

/** Fallback net local si le modèle ML échoue. */
async function fallbackSharpenUpscale(
  sourceUrl: string,
  scale: 2 | 4,
  ratio: string,
  onProgress?: UpscaleProgress,
) {
  onProgress?.(10);
  const img = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  // Unsharp fort
  const blur = document.createElement('canvas');
  blur.width = canvas.width;
  blur.height = canvas.height;
  const bctx = blur.getContext('2d')!;
  bctx.filter = 'blur(1.2px)';
  bctx.drawImage(canvas, 0, 0);
  const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const blurred = bctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const d = src.data;
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const s = d[i + c];
      const b = blurred[i + c];
      d[i + c] = Math.max(0, Math.min(255, s + (s - b) * 1.15));
    }
  }
  ctx.putImageData(src, 0, 0);
  onProgress?.(80);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png');
  });
  const cropped = await cropBlobToRatio(blob, ratio);
  onProgress?.(100);
  return {
    objectUrl: URL.createObjectURL(cropped.blob),
    width: cropped.w,
    height: cropped.h,
  };
}

export async function realEsrganUpscale(
  sourceUrl: string,
  scale: 2 | 4,
  ratio: string,
  onProgress?: UpscaleProgress,
): Promise<{ objectUrl: string; width: number; height: number }> {
  onProgress?.(3);
  try {
    const WebUpscaler = await getWebUpscaler();
    onProgress?.(8);
    const input = await urlToBlob(sourceUrl);

    // x2 → Real-CUGAN, x4 → Real-ESRGAN anime (meilleure netteté)
    const upscaler =
      scale === 2
        ? new WebUpscaler({
            modelType: 'realcugan',
            scale: 2,
            denoise: 'denoise3x',
            tileSize: 64,
            overlap: 12,
            sharpen: 0.35,
            modelBaseUrl: modelBaseUrl(),
            backend: 'webgl',
          })
        : new WebUpscaler({
            modelType: 'realesrgan',
            model: 'anime_fast',
            scale: 4,
            tileSize: 64,
            overlap: 12,
            sharpen: 0.4,
            modelBaseUrl: modelBaseUrl(),
            backend: 'webgl',
          });

    onProgress?.(12);
    await upscaler.warmup();
    onProgress?.(25);

    const outBlob = await upscaler.upscale(input, {
      format: 'png',
      onProgress: (p) => onProgress?.(25 + Math.round(p * 0.65)),
    });
    upscaler.dispose();

    const cropped = await cropBlobToRatio(outBlob, ratio);
    onProgress?.(100);
    return {
      objectUrl: URL.createObjectURL(cropped.blob),
      width: cropped.w,
      height: cropped.h,
    };
  } catch (e) {
    console.warn('[PIXLAB] Real-ESRGAN fallback', e);
    return fallbackSharpenUpscale(sourceUrl, scale, ratio, onProgress);
  }
}
