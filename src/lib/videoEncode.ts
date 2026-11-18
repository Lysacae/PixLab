import { arrayBufferToBase64 } from '@/lib/wavEncode';
import type { MediaAsset, TimelineClip, TimelineTrack } from '@/stores/types';

export type VideoEncodeInput = {
  width: number;
  height: number;
  durationSec: number;
  fps?: number;
  videoAsset: MediaAsset | null;
  clips: TimelineClip[];
  tracks: TimelineTrack[];
  library: MediaAsset[];
  mutedSource: boolean;
  onProgress?: (pct: number) => void;
};

function pickMime(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return 'video/webm';
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = url;
  });
}

/** Encode un WebM lisible (VP8/VP9) a la resolution du projet. */
export async function renderTimelineToWebm(
  input: VideoEncodeInput,
): Promise<{ base64: string; mime: string; ext: 'webm' }> {
  const fps = Math.max(12, Math.min(60, input.fps ?? 30));
  const w = Math.max(16, Math.round(input.width));
  const h = Math.max(16, Math.round(input.height));
  const duration = Math.max(0.2, input.durationSec);
  const mime = pickMime();

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const videoEl = document.createElement('video');
  videoEl.crossOrigin = 'anonymous';
  videoEl.playsInline = true;
  videoEl.muted = true;
  if (input.videoAsset?.objectUrl) {
    videoEl.src = input.videoAsset.objectUrl;
    await new Promise<void>((resolve, reject) => {
      videoEl.onloadeddata = () => resolve();
      videoEl.onerror = () => reject(new Error('video source'));
    });
  }

  const imageCache = new Map<string, HTMLImageElement>();
  const imageClips = input.clips.filter((c) => {
    const t = input.tracks.find((tr) => tr.id === c.track);
    return t?.kind === 'images' && c.assetId;
  });
  for (const c of imageClips) {
    const asset = input.library.find((a) => a.id === c.assetId);
    if (asset?.objectUrl && !imageCache.has(asset.id)) {
      try {
        imageCache.set(asset.id, await loadImg(asset.objectUrl));
      } catch {
        /* skip */
      }
    }
  }

  const stream = canvas.captureStream(fps);
  // Mixe l'audio source si present
  let audioCtx: AudioContext | null = null;
  if (input.videoAsset?.objectUrl && !input.mutedSource) {
    try {
      audioCtx = new AudioContext();
      const audioEl = document.createElement('audio');
      audioEl.src = input.videoAsset.objectUrl;
      audioEl.crossOrigin = 'anonymous';
      await audioEl.play().catch(() => undefined);
      audioEl.pause();
      audioEl.currentTime = 0;
      const src = audioCtx.createMediaElementSource(audioEl);
      const dest = audioCtx.createMediaStreamDestination();
      src.connect(dest);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      // sync play with recording
      (videoEl as HTMLVideoElement & { __audio?: HTMLAudioElement }).__audio = audioEl;
    } catch {
      /* no audio track */
    }
  }

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
    recorder.onerror = () => reject(new Error('MediaRecorder error'));
  });

  recorder.start(200);
  const audioEl = (videoEl as HTMLVideoElement & { __audio?: HTMLAudioElement }).__audio;
  if (input.videoAsset) {
    videoEl.currentTime = 0;
    void videoEl.play().catch(() => undefined);
  }
  if (audioEl) void audioEl.play().catch(() => undefined);

  const start = performance.now();
  const totalMs = duration * 1000;

  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(duration, elapsed / 1000);
      input.onProgress?.(Math.min(95, Math.round((t / duration) * 95)));

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      if (input.videoAsset && videoEl.readyState >= 2) {
        // contain
        const vw = videoEl.videoWidth || w;
        const vh = videoEl.videoHeight || h;
        const scale = Math.min(w / vw, h / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(videoEl, (w - dw) / 2, (h - dh) / 2, dw, dh);
      }

      for (const c of imageClips) {
        if (t < c.startSec || t >= c.startSec + c.durationSec) continue;
        const asset = input.library.find((a) => a.id === c.assetId);
        const img = asset ? imageCache.get(asset.id) : null;
        if (!img) continue;
        const layout = c.layout ?? { x: 0, y: 0, w: 100, h: 100 };
        const dx = (layout.x / 100) * w;
        const dy = (layout.y / 100) * h;
        const dw = (layout.w / 100) * w;
        const dh = (layout.h / 100) * h;
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      for (const c of input.clips) {
        if (!c.text) continue;
        if (t < c.startSec || t >= c.startSec + c.durationSec) continue;
        ctx.fillStyle = c.text.color;
        ctx.font = `${c.text.fontSize}px sans-serif`;
        ctx.textAlign = c.text.align;
        ctx.fillText(c.text.content, (c.text.x / 100) * w, (c.text.y / 100) * h);
      }

      if (elapsed >= totalMs) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  videoEl.pause();
  audioEl?.pause();
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  await audioCtx?.close().catch(() => undefined);

  const blob = await done;
  input.onProgress?.(100);
  const buf = await blob.arrayBuffer();
  return { base64: arrayBufferToBase64(buf), mime, ext: 'webm' };
}

/** Copie brute de la source video (fichier valide immediatement). */
export async function copyVideoSourceBase64(objectUrl: string): Promise<string> {
  const res = await fetch(objectUrl);
  const buf = await res.arrayBuffer();
  return arrayBufferToBase64(buf);
}
