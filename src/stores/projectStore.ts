import { create } from 'zustand';
import { splitClipAt } from '@/lib/timelineMap';
import { DEFAULT_AUDIO_FX, emptyWaveform, type AudioFxState } from '@/stubs/audioFx';
import { computeOutputSize, previewUpscale } from '@/stubs/upscale';
import { extractWaveformFromUrl } from '@/stubs/waveform';
import { realEsrganUpscale } from '@/lib/realEsrgan';
import type {
  ClipLayout,
  CropRect,
  ImageRatio,
  InspectorTarget,
  MediaAsset,
  TextStyle,
  TimelineClip,
  TimelineMarker,
  TimelineTrack,
  VideoTool,
} from './types';

const ZOOM_STEPS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

export const DEFAULT_TRACKS: TimelineTrack[] = [
  { id: 'video', label: 'Video', kind: 'video' },
  { id: 'audio1', label: 'Audio 1', kind: 'audio' },
  { id: 'texte', label: 'Texte', kind: 'texte' },
  { id: 'images', label: 'Images', kind: 'images' },
];

function clipId() {
  return `clip_${Math.random().toString(36).slice(2, 9)}`;
}

function trackId() {
  return `track_${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_TEXT: TextStyle = {
  content: 'Nouveau texte',
  fontSize: 24,
  color: '#F5EFE0',
  align: 'center',
  x: 50,
  y: 50,
};

type ProjectState = {
  projectName: string;
  videoAsset: MediaAsset | null;
  imageAsset: MediaAsset | null;
  musicAsset: MediaAsset | null;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  activeTool: VideoTool | null;
  playing: boolean;
  currentTime: number;
  zoom: number;
  crop: CropRect;
  mutedSource: boolean;
  selectedClipId: string | null;
  inspector: InspectorTarget;
  imageScale: 2 | 4;
  imageRatio: ImageRatio;
  outputName: string;
  imagePreviewReady: boolean;
  imageOutW: number;
  imageOutH: number;
  imageUpscaledUrl: string | null;
  imageUpscaleProgress: number;
  audioFx: AudioFxState;
  waveform: number[];
  musicPlaying: boolean;
  musicTime: number;
  musicFocus: 'reverb' | 'pitch' | null;
  renameFocused: boolean;
  timelinePxPerSec: number;
  timelineMinSec: number;
  markers: TimelineMarker[];
  videoExportFormat: string;
  videoWidth: number;
  videoHeight: number;
  videoFps: number;
  dirty: boolean;

  markDirty: () => void;
  markClean: () => void;
  cutAtPlayhead: () => boolean;
  setProjectName: (name: string) => void;
  setActiveTool: (tool: VideoTool | null) => void;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setCurrentTime: (t: number) => void;
  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setCrop: (crop: CropRect) => void;
  toggleMuteSource: () => void;
  toggleClipMute: (clipId: string) => void;
  addClip: (clip: Omit<TimelineClip, 'id'> & { id?: string }) => string;
  updateClip: (id: string, patch: Partial<TimelineClip>) => void;
  moveClip: (id: string, startSec: number) => void;
  removeClip: (id: string) => void;
  setSelectedClipId: (id: string | null) => void;
  setInspector: (target: InspectorTarget) => void;
  addTrack: (kind: TimelineTrack['kind']) => void;
  removeTrack: (id: string) => void;
  setVideoAsset: (asset: MediaAsset | null) => void;
  setImageAsset: (asset: MediaAsset | null) => void;
  setMusicAsset: (asset: MediaAsset | null) => Promise<void>;
  setImageScale: (scale: 2 | 4) => void;
  setImageRatio: (ratio: ImageRatio) => void;
  setOutputName: (name: string) => void;
  refreshImagePreview: () => Promise<void>;
  sendImageToVideo: () => void;
  setAudioFx: (patch: Partial<AudioFxState>) => void;
  setMusicPlaying: (v: boolean) => void;
  toggleMusicPlay: () => void;
  setMusicTime: (t: number) => void;
  setMusicFocus: (f: 'reverb' | 'pitch' | null) => void;
  setRenameFocused: (v: boolean) => void;
  addTextOverlay: () => void;
  updateTextClip: (id: string, patch: Partial<TextStyle>) => void;
  updateClipLayout: (id: string, layout: Partial<ClipLayout>) => void;
  addMarker: (timeSec?: number, label?: string) => void;
  removeMarker: (id: string) => void;
  setTimelineMinSec: (sec: number) => void;
  setVideoExportFormat: (format: string) => void;
  setVideoCanvas: (w: number, h: number, fps?: number) => void;
  trimClipEdge: (
    id: string,
    edge: 'start' | 'end',
    deltaSec: number,
    maxSourceDuration?: number,
  ) => void;
  snapTimeToMarker: (t: number, thresholdSec?: number) => number;
  applyNewProject: (p: {
    name: string;
    width: number;
    height: number;
    format: string;
    fps: number;
  }) => void;
  newBlankProject: () => void;
  duration: () => number;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'Sans_titre',
  videoAsset: null,
  imageAsset: null,
  musicAsset: null,
  tracks: DEFAULT_TRACKS.map((t) => ({ ...t })),
  clips: [],
  activeTool: null,
  playing: false,
  currentTime: 0,
  zoom: 100,
  crop: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
  mutedSource: false,
  selectedClipId: null,
  inspector: null,
  imageScale: 2,
  imageRatio: '16:9',
  outputName: 'sortie_x2.png',
  imagePreviewReady: true,
  imageOutW: 1920,
  imageOutH: 1080,
  imageUpscaledUrl: null,
  imageUpscaleProgress: 0,
  audioFx: { ...DEFAULT_AUDIO_FX },
  waveform: emptyWaveform(),
  musicPlaying: false,
  musicTime: 0,
  musicFocus: null,
  renameFocused: false,
  timelinePxPerSec: 40,
  timelineMinSec: 60,
  markers: [],
  videoExportFormat: 'MP4 1080p',
  videoWidth: 1920,
  videoHeight: 1080,
  videoFps: 30,
  dirty: false,

  markDirty: () => set({ dirty: true }),
  markClean: () => set({ dirty: false }),
  cutAtPlayhead: () => {
    const { clips, currentTime } = get();
    const vClip = clips.find(
      (c) =>
        c.track === 'video' &&
        currentTime > c.startSec + 0.05 &&
        currentTime < c.startSec + c.durationSec - 0.05,
    );
    if (!vClip) return false;
    const next = splitClipAt(clips, vClip.id, currentTime, clipId);
    if (!next) return false;
    set({ clips: next, dirty: true, activeTool: 'cut' });
    return true;
  },
  setProjectName: (projectName) => set({ projectName, dirty: true }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setPlaying: (playing) => set({ playing }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setCurrentTime: (currentTime) => set({ currentTime: Math.max(0, currentTime) }),
  setZoom: (zoom) => set({ zoom }),
  zoomIn: () => {
    const { zoom } = get();
    const next = ZOOM_STEPS.find((z) => z > zoom) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
    set({ zoom: next });
  },
  zoomOut: () => {
    const { zoom } = get();
    const prev = [...ZOOM_STEPS].reverse().find((z) => z < zoom) ?? ZOOM_STEPS[0];
    set({ zoom: prev });
  },
  setCrop: (crop) => set({ crop, dirty: true }),
  toggleMuteSource: () =>
    set((s) => {
      const muted = !s.mutedSource;
      return {
        dirty: true,
        mutedSource: muted,
        clips: s.clips.map((c) =>
          c.track === 'audio1' || c.linkedTo ? { ...c, muted } : c,
        ),
      };
    }),
  toggleClipMute: (id) =>
    set((s) => ({
      dirty: true,
      clips: s.clips.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c)),
    })),
  addClip: (clip) => {
    const id = clip.id ?? clipId();
    set((s) => ({ clips: [...s.clips, { ...clip, id }], dirty: true }));
    return id;
  },
  updateClip: (id, patch) =>
    set((s) => ({
      dirty: true,
      clips: s.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  moveClip: (id, startSec) => {
    const dur = get().duration();
    set((s) => ({
      dirty: true,
      clips: s.clips.map((c) => {
        if (c.id !== id) return c;
        const maxStart = Math.max(0, dur - c.durationSec);
        const next = Math.max(0, Math.min(maxStart, startSec));
        return { ...c, startSec: next };
      }),
    }));
  },
  removeClip: (id) =>
    set((s) => ({
      dirty: true,
      clips: s.clips.filter((c) => c.id !== id && c.linkedTo !== id),
      selectedClipId: s.selectedClipId === id ? null : s.selectedClipId,
      inspector:
        s.inspector && 'clipId' in s.inspector && s.inspector.clipId === id ? null : s.inspector,
    })),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  setInspector: (inspector) => set({ inspector }),
  addTrack: (kind) => {
    const n = get().tracks.filter((t) => t.kind === kind).length + 1;
    const labels: Record<TimelineTrack['kind'], string> = {
      video: `Video ${n}`,
      audio: `Audio ${n}`,
      texte: `Texte ${n}`,
      images: `Images ${n}`,
    };
    set((s) => ({
      dirty: true,
      tracks: [...s.tracks, { id: trackId(), label: labels[kind], kind }],
    }));
  },
  removeTrack: (id) => {
    const track = get().tracks.find((t) => t.id === id);
    if (!track || get().tracks.filter((t) => t.kind === track.kind).length <= 1) return;
    set((s) => ({
      dirty: true,
      tracks: s.tracks.filter((t) => t.id !== id),
      clips: s.clips.filter((c) => c.track !== id),
    }));
  },
  setVideoAsset: (videoAsset) => {
    if (!videoAsset) {
      set({ videoAsset: null, clips: [], currentTime: 0, playing: false, dirty: true });
      return;
    }
    const vidId = clipId();
    const audId = clipId();
    set({
      dirty: true,
      videoAsset,
      projectName: videoAsset.name.replace(/\.[^.]+$/, '') || 'Projet_Video',
      currentTime: 0,
      playing: false,
      mutedSource: false,
      clips: [
        {
          id: vidId,
          track: 'video',
          label: videoAsset.name,
          startSec: 0,
          durationSec: videoAsset.durationSec,
          sourceOffsetSec: 0,
          assetId: videoAsset.id,
          color: 'var(--cyan)',
        },
        {
          id: audId,
          track: 'audio1',
          label: `${videoAsset.name} (audio)`,
          startSec: 0,
          durationSec: videoAsset.durationSec,
          sourceOffsetSec: 0,
          assetId: videoAsset.id,
          linkedTo: vidId,
          color: 'var(--or)',
          muted: false,
        },
      ],
      timelinePxPerSec: Math.max(20, Math.min(80, 800 / Math.max(1, videoAsset.durationSec))),
    });
  },
  setImageAsset: (imageAsset) => {
    if (!imageAsset) {
      const prev = get().imageUpscaledUrl;
      if (prev) URL.revokeObjectURL(prev);
      set({ imageAsset: null, imageUpscaledUrl: null });
      return;
    }
    const scale = get().imageScale;
    const ratio = get().imageRatio;
    const size = computeOutputSize(imageAsset.width ?? 1024, imageAsset.height ?? 576, scale, ratio);
    const base = imageAsset.name.replace(/\.[^.]+$/, '') || 'Portrait_upscale';
    const prev = get().imageUpscaledUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      imageAsset,
      projectName: base,
      outputName: `${base}_x${scale}.png`,
      imageOutW: size.outWidth,
      imageOutH: size.outHeight,
      imagePreviewReady: false,
      imageUpscaledUrl: null,
      imageUpscaleProgress: 0,
    });
    void get().refreshImagePreview();
  },
  setMusicAsset: async (musicAsset) => {
    if (!musicAsset) {
      set({
        musicAsset: null,
        waveform: emptyWaveform(),
        musicTime: 0,
        musicPlaying: false,
        audioFx: { ...DEFAULT_AUDIO_FX },
      });
      return;
    }
    set({
      musicAsset,
      projectName: musicAsset.name.replace(/\.[^.]+$/, '') || 'Theme_lofi',
      musicTime: 0,
      musicPlaying: false,
      audioFx: {
        ...DEFAULT_AUDIO_FX,
        inSec: 0,
        outSec: musicAsset.durationSec,
      },
      waveform: emptyWaveform(),
    });
    try {
      const bars = await extractWaveformFromUrl(musicAsset.objectUrl, 180);
      if (get().musicAsset?.id === musicAsset.id) set({ waveform: bars });
    } catch {
      /* keep empty bars */
    }
  },
  setImageScale: (imageScale) => {
    set({ imageScale, outputName: get().outputName.replace(/_x[24]/, `_x${imageScale}`) });
    void get().refreshImagePreview();
  },
  setImageRatio: (imageRatio) => {
    set({ imageRatio });
    void get().refreshImagePreview();
  },
  setOutputName: (outputName) => set({ outputName }),
  refreshImagePreview: async () => {
    const { imageAsset, imageScale, imageRatio, imageUpscaledUrl } = get();
    if (!imageAsset) {
      set({ imagePreviewReady: true, imageOutW: 1920, imageOutH: 1080 });
      return;
    }
    set({ imagePreviewReady: false, imageUpscaleProgress: 0 });
    try {
      if (imageUpscaledUrl) URL.revokeObjectURL(imageUpscaledUrl);
      const up = await realEsrganUpscale(
        imageAsset.objectUrl,
        imageScale,
        imageRatio,
        (pct) => set({ imageUpscaleProgress: pct }),
      );
      const size = computeOutputSize(imageAsset.width ?? up.width, imageAsset.height ?? up.height, imageScale, imageRatio);
      set({
        imagePreviewReady: true,
        imageUpscaledUrl: up.objectUrl,
        imageOutW: up.width || size.outWidth,
        imageOutH: up.height || size.outHeight,
        imageUpscaleProgress: 100,
      });
    } catch {
      const result = await previewUpscale(
        imageAsset.width ?? 1024,
        imageAsset.height ?? 576,
        imageScale,
        imageRatio,
      );
      set({
        imagePreviewReady: true,
        imageOutW: result.outWidth,
        imageOutH: result.outHeight,
        imageUpscaleProgress: 0,
      });
    }
  },
  sendImageToVideo: () => {
    const { imageAsset, outputName, imageUpscaledUrl } = get();
    if (!imageAsset) return;
    get().addClip({
      track: 'images',
      label: outputName,
      startSec: get().currentTime,
      durationSec: 5,
      assetId: imageAsset.id,
      color: 'var(--bronze)',
      layout: { x: 10, y: 10, w: 40, h: 40 },
      // stash upscaled url via label only — asset uses library url; layout for flexibility
    });
    void imageUpscaledUrl;
  },
  updateClipLayout: (id, layout) =>
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === id
          ? {
              ...c,
              layout: {
                x: layout.x ?? c.layout?.x ?? 0,
                y: layout.y ?? c.layout?.y ?? 0,
                w: layout.w ?? c.layout?.w ?? 100,
                h: layout.h ?? c.layout?.h ?? 100,
              },
            }
          : c,
      ),
      dirty: true,
    })),
  addMarker: (timeSec, label) => {
    const t = timeSec ?? get().currentTime;
    const id = `mk_${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({
      markers: [...s.markers, { id, timeSec: Math.max(0, t), label: label || `M${s.markers.length + 1}` }],
      dirty: true,
    }));
  },
  removeMarker: (id) => set((s) => ({ markers: s.markers.filter((m) => m.id !== id), dirty: true })),
  setTimelineMinSec: (timelineMinSec) => set({ timelineMinSec: Math.max(10, timelineMinSec) }),
  setVideoExportFormat: (videoExportFormat) => set({ videoExportFormat }),
  setVideoCanvas: (videoWidth, videoHeight, videoFps) =>
    set({
      videoWidth,
      videoHeight,
      ...(videoFps ? { videoFps } : {}),
      dirty: true,
    }),
  trimClipEdge: (id, edge, deltaSec, maxSourceDuration) => {
    set((s) => {
      const clip = s.clips.find((c) => c.id === id);
      if (!clip) return s;
      const srcOff = clip.sourceOffsetSec ?? 0;
      let startSec = clip.startSec;
      let durationSec = clip.durationSec;
      let sourceOffsetSec = srcOff;

      if (edge === 'end') {
        let next = durationSec + deltaSec;
        if (maxSourceDuration != null) {
          next = Math.min(next, Math.max(0.1, maxSourceDuration - srcOff));
        }
        durationSec = Math.max(0.1, next);
      } else {
        // start edge: move start + source offset together
        let d = deltaSec;
        if (durationSec - d < 0.1) d = durationSec - 0.1;
        if (srcOff + d < 0) d = -srcOff;
        if (maxSourceDuration != null && srcOff + d + (durationSec - d) > maxSourceDuration) {
          /* keep */
        }
        startSec = Math.max(0, startSec + d);
        sourceOffsetSec = Math.max(0, srcOff + d);
        durationSec = Math.max(0.1, durationSec - d);
      }

      return {
        clips: s.clips.map((c) =>
          c.id === id ? { ...c, startSec, durationSec, sourceOffsetSec } : c,
        ),
        dirty: true,
      };
    });
  },
  applyNewProject: (p) => {
    get().newBlankProject();
    set({
      projectName: p.name,
      videoWidth: p.width,
      videoHeight: p.height,
      videoFps: p.fps,
      videoExportFormat: p.format,
      dirty: false,
    });
  },
  snapTimeToMarker: (t, thresholdSec = 0.12) => {
    const { markers } = get();
    let best = t;
    let bestDist = thresholdSec;
    for (const m of markers) {
      const d = Math.abs(m.timeSec - t);
      if (d <= bestDist) {
        bestDist = d;
        best = m.timeSec;
      }
    }
    return best;
  },
  setAudioFx: (patch) => set((s) => ({ audioFx: { ...s.audioFx, ...patch } })),
  setMusicPlaying: (musicPlaying) => set({ musicPlaying }),
  toggleMusicPlay: () => set((s) => ({ musicPlaying: !s.musicPlaying })),
  setMusicTime: (musicTime) => set({ musicTime }),
  setMusicFocus: (musicFocus) => set({ musicFocus }),
  setRenameFocused: (renameFocused) => set({ renameFocused }),
  addTextOverlay: () => {
    const id = get().addClip({
      track: 'texte',
      label: 'Texte',
      startSec: get().currentTime,
      durationSec: Math.max(4, Math.min(10, get().duration() || 8)),
      color: 'var(--violet-magie)',
      text: { ...DEFAULT_TEXT },
    });
    set({
      selectedClipId: id,
      inspector: { type: 'text', clipId: id },
      activeTool: 'addText',
    });
  },
  updateTextClip: (id, patch) =>
    set((s) => ({
      clips: s.clips.map((c) =>
        c.id === id && c.text ? { ...c, text: { ...c.text, ...patch }, label: patch.content ?? c.label } : c,
      ),
    })),
  newBlankProject: () =>
    set({
      projectName: 'Sans_titre',
      videoAsset: null,
      imageAsset: null,
      musicAsset: null,
      tracks: DEFAULT_TRACKS.map((t) => ({ ...t })),
      clips: [],
      playing: false,
      currentTime: 0,
      mutedSource: false,
      selectedClipId: null,
      inspector: null,
      activeTool: null,
      waveform: emptyWaveform(),
      musicPlaying: false,
      musicTime: 0,
      audioFx: { ...DEFAULT_AUDIO_FX },
      markers: [],
      timelineMinSec: 60,
      imageUpscaledUrl: null,
      videoWidth: 1920,
      videoHeight: 1080,
      videoFps: 30,
      videoExportFormat: 'MP4 1080p',
      dirty: false,
    }),
  duration: () => {
    const { videoAsset, clips, timelineMinSec, currentTime, musicAsset } = get();
    const fromClips = clips.reduce((m, c) => Math.max(m, c.startSec + c.durationSec), 0);
    const fromMusic = musicAsset?.durationSec ?? 0;
    // Timeline longue même vide — les chiffres continuent au-delà de 10s
    return Math.max(
      videoAsset?.durationSec ?? 0,
      fromClips,
      fromMusic,
      timelineMinSec,
      currentTime + 2,
    );
  },
}));

