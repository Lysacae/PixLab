import { writeExportFromUrl } from '@/lib/exportPath';
import { renderMusicToWav } from '@/lib/wavEncode';
import type { AudioFxState } from '@/stubs/audioFx';
import type { RenderJob, RenderSource } from '@/stores/types';

function uid() {
  return `job_${Math.random().toString(36).slice(2, 10)}`;
}

function todayLabel() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export function createRenderJob(input: {
  projectName: string;
  source: RenderSource;
  thumbnailUrl: string | null;
  format: string;
  durationLabel: string;
  outputPath: string;
  sourceUrl?: string | null;
  audioFx?: AudioFxState | null;
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
    error: null,
  };
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

    // Video stub — fichier placeholder lisible en texte
    if (api) {
      const note = `PIXLAB video export stub\nproject=${job.projectName}\n`;
      const b64 = btoa(note);
      const written = await api.writeFile(job.outputPath, b64);
      onDone(written.ok ? { ok: true, path: written.path } : written);
      return;
    }
    onDone({ ok: true, path: job.outputPath });
  };

  const timer = window.setInterval(() => {
    if (cancelled) return;
    pct = Math.min(job.source === 'music' ? 35 : 100, pct + 6 + Math.floor(Math.random() * 8));
    onProgress(pct);
    if (pct >= (job.source === 'music' ? 35 : 100)) {
      window.clearInterval(timer);
      void finish().then(() => {
        if (!cancelled) onProgress(100);
      });
    }
  }, 160);

  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}

export function getMusicThumbnail(): null {
  return null;
}
