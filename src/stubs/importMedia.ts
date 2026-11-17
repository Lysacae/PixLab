import type { MediaAsset, MediaKind } from '@/stores/types';

function uid() {
  return `asset_${Math.random().toString(36).slice(2, 10)}`;
}

function guessKind(file: File): MediaKind {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'image';
}

export async function importMedia(file: File): Promise<MediaAsset> {
  const kind = guessKind(file);
  const objectUrl = URL.createObjectURL(file);

  if (kind === 'video') {
    const meta = await readVideoMeta(objectUrl);
    return {
      id: uid(),
      kind,
      name: file.name,
      objectUrl,
      durationSec: meta.duration,
      width: meta.width,
      height: meta.height,
    };
  }

  if (kind === 'audio') {
    const meta = await readAudioMeta(objectUrl);
    return {
      id: uid(),
      kind,
      name: file.name,
      objectUrl,
      durationSec: meta.duration,
      sampleRate: meta.sampleRate,
      channels: meta.channels,
    };
  }

  const size = await readImageSize(objectUrl);
  return {
    id: uid(),
    kind: 'image',
    name: file.name,
    objectUrl,
    durationSec: 5,
    width: size.width,
    height: size.height,
  };
}

function readVideoMeta(url: string): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.src = url;
    v.onloadedmetadata = () => {
      resolve({
        duration: Number.isFinite(v.duration) ? v.duration : 84,
        width: v.videoWidth || 1280,
        height: v.videoHeight || 720,
      });
    };
    v.onerror = () => resolve({ duration: 84, width: 1280, height: 720 });
  });
}

function readAudioMeta(url: string): Promise<{ duration: number; sampleRate: number; channels: number }> {
  return new Promise((resolve) => {
    const a = document.createElement('audio');
    a.preload = 'metadata';
    a.src = url;
    a.onloadedmetadata = () => {
      resolve({
        duration: Number.isFinite(a.duration) ? a.duration : 134,
        sampleRate: 44100,
        channels: 2,
      });
    };
    a.onerror = () => resolve({ duration: 134, sampleRate: 44100, channels: 2 });
  });
}

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 1024, height: 576 });
    img.src = url;
  });
}
