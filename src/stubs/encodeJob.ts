import { writeExportFromUrl } from '@/lib/exportPath';
import { copyVideoSourceBase64, renderTimelineToWebm } from '@/lib/videoEncode';
import { renderMusicToWav } from '@/lib/wavEncode';
import type { AudioFxState } from '@/stubs/audioFx';
import type { RenderJob, RenderSource } from '@/stores/types';
import type { VideoEncodeMeta } from '@/stubs/encodeJobMeta';

function uid() {
  return `job_${Math.random().toString(36).slice(2, 10)}`;
}

function todayLabel() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export type { VideoEncodeMeta } from '@/stubs/encodeJobMeta';

export function createRenderJob(input: {
  projectName: string;
  source: RenderSource;
  thumbnailUrl: string | null;
  format: string;
  durationLabel: string;
  outputPath: string;
  sourceUrl?: string | null;
  audioFx?: AudioFxState | null;
  videoMeta?: VideoEncodeMeta | null;
}): RenderJob {
  return {
    id: uid(),
    projectName: input.projectName,
    source: input.source,
    status: 'waiting',
    progress: 0,
    format: input.format,
    durationLabel: input.durationLabel,
    dateLabel: todayLabel(),
    thumbnailUrl: input.source === 'music' ? null : input.thumbnailUrl,
    outputPath: input.outputPath,
    sourceUrl: input.sourceUrl ?? input.thumbnailUrl,
    audioFx: input.audioFx ?? null,
    videoMeta: input.videoMeta ?? null,
    error: null,
  };
}

function ensureExt(path: string, ext: string) {
  const clean = path.replace(/\.(mp4|webm|mov|avi)$/i, '');
  return `${clean}.${ext}`;
}

export function runStubEncode(
  job: RenderJob,
  onProgress: (pct: number) => void,
  onDone: (result: { ok: true; path: string } | { ok: false; error: string }) => void,
): () => void {
  let pct = 0;
  let cancelled = false;

  const finish = async () => {
    if (cancelled) return;
    const api = window.pixlab;

    if (job.source === 'image') {
      const written = await writeExportFromUrl(job.outputPath, job.sourceUrl ?? job.thumbnailUrl);
      onDone(written);
      return;
    }

    if (job.source === 'music') {
      if (!job.sourceUrl) {
        onDone({ ok: false, error: 'Aucune source audio' });
        return;
      }
      try {
        onProgress(40);
        const fx = job.audioFx ?? {
          speed: 1,
          pitchSemitones: 0,
          reverb: 0,
          inSec: 0,
          outSec: 99999,
          loop: false,
        };
        const { base64 } = await renderMusicToWav(job.sourceUrl, fx);
        onProgress(85);
        if (!api) {
          onDone({ ok: false, error: 'API Electron indisponible' });
          return;
        }
        const written = await api.writeFile(job.outputPath, base64);
        onDone(written.ok ? { ok: true, path: written.path } : written);
      } catch (e) {
        onDone({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
      return;
    }

    // VIDEO — fichier conteneur reel (WebM VP8/VP9) lisible par le lecteur Windows
    try {
      if (!api) {
        onDone({ ok: false, error: 'API Electron indisponible' });
        return;
      }
      const meta = job.videoMeta;
      let base64: string;
      let outPath = job.outputPath;

      const hasOverlays =
        !!meta &&
        (meta.clips.some((c) => c.text || meta.tracks.find((t) => t.id === c.track)?.kind === 'images') ||
          !meta.videoAsset);

      if (meta && (hasOverlays || !meta.videoAsset?.objectUrl)) {
        const encoded = await renderTimelineToWebm({
          ...meta,
          onProgress: (p) => onProgress(Math.min(95, 20 + Math.round(p * 0.75))),
        });
        base64 = encoded.base64;
        outPath = ensureExt(job.outputPath, 'webm');
      } else if (job.sourceUrl || meta?.videoAsset?.objectUrl) {
        onProgress(30);
        const src = job.sourceUrl || meta!.videoAsset!.objectUrl;
        base64 = await copyVideoSourceBase64(src);
        // conserve l'extension d'origine si possible
        const m = src.match(/\.(mp4|webm|mov)/i);
        if (m) outPath = ensureExt(job.outputPath, m[1].toLowerCase());
        else outPath = ensureExt(job.outputPath, 'mp4');
        onProgress(90);
      } else {
        onDone({ ok: false, error: 'Aucune source video' });
        return;
      }

      const written = await api.writeFile(outPath, base64);
      onDone(written.ok ? { ok: true, path: written.path } : written);
    } catch (e) {
      onDone({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  };

  const timer = window.setInterval(() => {
    if (cancelled) return;
    const cap = job.source === 'music' || job.source === 'video' ? 18 : 100;
    pct = Math.min(cap, pct + 5 + Math.floor(Math.random() * 6));
    onProgress(pct);
    if (pct >= cap) {
      window.clearInterval(timer);
      void finish().then(() => {
        if (!cancelled) onProgress(100);
      });
    }
  }, 140);

  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}

export function getMusicThumbnail(): null {
  return null;
}
