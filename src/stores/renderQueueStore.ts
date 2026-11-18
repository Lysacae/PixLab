import { create } from 'zustand';
import { createRenderJob, runStubEncode } from '@/stubs/encodeJob';
import type { RenderJob, RenderSource } from './types';

type State = {
  jobs: RenderJob[];
  selectedId: string | null;
  cancelCurrent: (() => void) | null;
  enqueue: (input: {
    projectName: string;
    source: RenderSource;
    thumbnailUrl: string | null;
    format: string;
    durationLabel: string;
    outputPath: string;
    sourceUrl?: string | null;
    audioFx?: import('@/stubs/audioFx').AudioFxState | null;
    videoMeta?: import('@/stubs/encodeJobMeta').VideoEncodeMeta | null;
  }) => string;
  select: (id: string) => void;
  cancel: (id: string) => void;
  removeJob: (id: string) => void;
  activeCount: () => number;
  bumpQueue: () => void;
};

export const useRenderQueueStore = create<State>((set, get) => ({
  jobs: [],
  selectedId: null,
  cancelCurrent: null,

  enqueue: (input) => {
    const job = createRenderJob(input);
    set((s) => ({
      jobs: [...s.jobs, job],
      selectedId: job.id,
    }));
    queueMicrotask(() => get().bumpQueue());
    return job.id;
  },

  select: (selectedId) => set({ selectedId }),

  removeJob: (id) => {
    const { jobs, cancelCurrent, selectedId } = get();
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    if (job.status === 'running') cancelCurrent?.();
    set({
      cancelCurrent: job.status === 'running' ? null : get().cancelCurrent,
      jobs: jobs.filter((j) => j.id !== id),
      selectedId: selectedId === id ? jobs.find((j) => j.id !== id)?.id ?? null : selectedId,
    });
  },

  cancel: (id) => {
    const { jobs, cancelCurrent } = get();
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    if (job.status === 'running') {
      cancelCurrent?.();
      set((s) => ({
        cancelCurrent: null,
        jobs: s.jobs.filter((j) => j.id !== id),
        selectedId: s.jobs.find((j) => j.id !== id)?.id ?? null,
      }));
      queueMicrotask(() => get().bumpQueue());
      return;
    }
    if (job.status === 'waiting') {
      set((s) => ({
        jobs: s.jobs.filter((j) => j.id !== id),
        selectedId: s.selectedId === id ? s.jobs.find((j) => j.id !== id)?.id ?? null : s.selectedId,
      }));
    }
  },

  activeCount: () => get().jobs.filter((j) => j.status === 'waiting' || j.status === 'running').length,

  bumpQueue: () => {
    const { jobs, cancelCurrent } = get();
    if (jobs.some((j) => j.status === 'running')) return;
    if (cancelCurrent) return;
    const next = jobs.find((j) => j.status === 'waiting');
    if (!next) return;

    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === next.id ? { ...j, status: 'running' as const, progress: 0, error: null } : j,
      ),
    }));

    const cancel = runStubEncode(
      next,
      (pct) => {
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === next.id ? { ...j, progress: pct } : j)),
        }));
      },
      (result) => {
        set((s) => ({
          cancelCurrent: null,
          jobs: s.jobs.map((j) =>
            j.id === next.id
              ? {
                  ...j,
                  status: result.ok ? ('done' as const) : ('done' as const),
                  progress: 100,
                  outputPath: result.ok ? result.path : j.outputPath,
                  error: result.ok ? null : result.error,
                }
              : j,
          ),
        }));
        queueMicrotask(() => get().bumpQueue());
      },
    );
    set({ cancelCurrent: cancel });
  },
}));

export function bootstrapRenderQueue() {
  /* file vide au démarrage — pas de jobs démo */
}
