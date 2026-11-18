import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type WheelEventHandler,
} from 'react';
import {
  Button,
  IconCrop,
  IconFolder,
  IconImage,
  IconMute,
  IconPause,
  IconPlay,
  IconScissors,
  IconText,
  IconWave,
  IconZoomIn,
  IconZoomOut,
  Panel,
  TextField,
  Slider,
} from '@/design-system';
import { mapTimelineToVideoSource } from '@/lib/timelineMap';
import { useLibraryStore } from '@/stores/libraryStore';
import { useProjectStore } from '@/stores/projectStore';
import type { TimelineClip, VideoTool } from '@/stores/types';
import './VideoScreen.css';

const SIDE_W = 96;
const MAGNET_PX = 4;

const EXPORT_PRESETS = [
  { id: 'hd', label: 'HD 1080p', format: 'MP4 1080p', w: 1920, h: 1080 },
  { id: '720', label: 'HD 720p', format: 'MP4 720p', w: 1280, h: 720 },
  { id: '2k', label: '2K', format: 'MP4 2K', w: 2560, h: 1440 },
  { id: '4k', label: '4K', format: 'MP4 4K', w: 3840, h: 2160 },
  { id: 'square', label: '1:1 1080', format: 'MP4 1:1', w: 1080, h: 1080 },
  { id: 'vertical', label: '9:16', format: 'MP4 9:16', w: 1080, h: 1920 },
];

function formatTc(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

const TOOLS: { id: VideoTool; label: string; icon: ReactNode }[] = [
  { id: 'import', label: 'Importer', icon: <IconFolder /> },
  { id: 'crop', label: 'Recadrer', icon: <IconCrop /> },
  { id: 'cut', label: 'Couper', icon: <IconScissors /> },
  { id: 'mute', label: 'Retirer le son', icon: <IconMute /> },
  { id: 'addAudio', label: 'Ajouter audio', icon: <IconWave /> },
  { id: 'addText', label: 'Ajouter texte', icon: <IconText /> },
  { id: 'addImage', label: 'Ajouter image', icon: <IconImage /> },
];

type Props = {
  onImport: () => void;
  onImportAudio: () => void;
  onImportImage: () => void;
};

type CtxMenu = { x: number; y: number; trackId?: string; clipId?: string } | null;

function placeCtxMenu(clientX: number, clientY: number, menuW: number, menuH: number) {
  const pad = 8;
  let x = clientX;
  let y = clientY;
  if (x + menuW > window.innerWidth - pad) x = Math.max(pad, clientX - menuW);
  if (y + menuH > window.innerHeight - pad) y = Math.max(pad, clientY - menuH);
  if (x < pad) x = pad;
  if (y < pad) y = pad;
  return { x, y };
}

export function VideoScreen({ onImport, onImportAudio, onImportImage }: Props) {
  const library = useLibraryStore((s) => s.items);
  const store = useProjectStore();
  const {
    activeTool,
    setActiveTool,
    playing,
    togglePlay,
    setPlaying,
    currentTime,
    setCurrentTime,
    zoom,
    zoomIn,
    zoomOut,
    crop,
    clips,
    tracks,
    videoAsset,
    duration,
    addClip,
    moveClip,
    removeClip,
    toggleMuteSource,
    toggleClipMute,
    mutedSource,
    selectedClipId,
    setSelectedClipId,
    inspector,
    setInspector,
    addTrack,
    removeTrack,
    addTextOverlay,
    updateTextClip,
    updateClipLayout,
    timelinePxPerSec,
    cutAtPlayhead,
    markers,
    addMarker,
    removeMarker,
    snapTimeToMarker,
    setVideoExportFormat,
    setVideoCanvas,
    videoWidth,
    videoHeight,
    setTimelineMinSec,
    trimClipEdge,
  } = store;

  const dur = duration();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<HTMLDivElement>(null);
  const audioPlayers = useRef<Map<string, HTMLAudioElement>>(new Map());
  const lastAudioSeek = useRef<Map<string, number>>(new Map());
  const activeAudioId = useRef<string | null>(null);
  const [viewportW, setViewportW] = useState(800);
  const [ctx, setCtx] = useState<CtxMenu>(null);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const [customW, setCustomW] = useState(videoWidth);
  const [customH, setCustomH] = useState(videoHeight);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const dragClip = useRef<{ id: string; originX: number; originStart: number } | null>(null);
  const scrubbing = useRef(false);
  const activeClipId = useRef<string | null>(null);
  const panDrag = useRef<{ ox: number; oy: number; px: number; py: number } | null>(null);
  const layoutDrag = useRef<{
    id: string;
    mode: 'move' | 'resize';
    ox: number;
    oy: number;
    start: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const textDrag = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number } | null>(null);
  const edgeDrag = useRef<{ id: string; edge: 'start' | 'end'; originX: number; maxSrc?: number } | null>(
    null,
  );
  const pxPerSec = timelinePxPerSec;

  const contentW = Math.max(dur * pxPerSec, viewportW);
  const timelineWidth = contentW;
  const canPreview = Boolean(videoAsset) || clips.length > 0;

  const libraryById = useMemo(() => new Map(library.map((a) => [a.id, a])), [library]);

  const visualOverlays = useMemo(() => {
    return clips.filter((c) => {
      const track = tracks.find((t) => t.id === c.track);
      if (track?.kind !== 'images' && track?.kind !== 'video') return false;
      if (track.kind === 'video' && c.linkedTo) return false;
      return currentTime >= c.startSec && currentTime < c.startSec + c.durationSec;
    });
  }, [clips, tracks, currentTime]);

  const textClips = clips.filter(
    (c) => c.text && currentTime >= c.startSec && currentTime <= c.startSec + c.durationSec,
  );
  const selectedText = clips.find((c) => c.id === selectedClipId && c.text);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewportW(Math.max(320, el.clientWidth - SIDE_W));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!ctx) {
      setCtxPos(null);
      return;
    }
    const el = ctxRef.current;
    setCtxPos(placeCtxMenu(ctx.x, ctx.y, el?.offsetWidth ?? 200, el?.offsetHeight ?? 220));
  }, [ctx]);

  // Keep playhead visible while playing
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const headX = SIDE_W + currentTime * pxPerSec;
    const left = scroll.scrollLeft;
    const right = left + scroll.clientWidth;
    const margin = 80;
    if (headX > right - margin) {
      scroll.scrollLeft = headX - scroll.clientWidth + margin + 40;
    } else if (headX < left + SIDE_W + margin) {
      scroll.scrollLeft = Math.max(0, headX - SIDE_W - margin);
    }
  }, [currentTime, pxPerSec, playing]);

  const stopAllAudio = () => {
    for (const a of audioPlayers.current.values()) {
      a.pause();
    }
    activeAudioId.current = null;
  };

  const syncAudioClips = (t: number, shouldPlay: boolean, forceSeek = false) => {
    const state = useProjectStore.getState();
    const audioClips = state.clips.filter((c) => {
      const track = state.tracks.find((tr) => tr.id === c.track);
      return track?.kind === 'audio' && !c.muted;
    });

    const activeIds = new Set<string>();
    for (const clip of audioClips) {
      const end = clip.startSec + clip.durationSec;
      if (t < clip.startSec || t >= end) continue;
      if (!clip.assetId) continue;
      const asset = libraryById.get(clip.assetId);
      if (!asset?.objectUrl) continue;
      activeIds.add(clip.id);

      let a = audioPlayers.current.get(clip.id);
      if (!a || a.src !== asset.objectUrl) {
        a?.pause();
        a = new Audio(asset.objectUrl);
        a.preload = 'auto';
        audioPlayers.current.set(clip.id, a);
        lastAudioSeek.current.set(clip.id, -999);
      }

      const srcOff = clip.sourceOffsetSec ?? 0;
      const want = srcOff + (t - clip.startSec);
      const last = lastAudioSeek.current.get(clip.id) ?? -999;
      const drift = Math.abs(a.currentTime - want);
      // Ne seek que si dérive importante ou scrub — évite coupe/relance
      if (forceSeek || drift > 0.4 || activeAudioId.current !== clip.id) {
        if (Math.abs(last - want) > 0.05 || forceSeek) {
          try {
            a.currentTime = want;
          } catch {
            /* ignore */
          }
          lastAudioSeek.current.set(clip.id, want);
        }
        activeAudioId.current = clip.id;
      }

      if (shouldPlay) {
        if (a.paused) void a.play().catch(() => undefined);
      } else if (!a.paused) {
        a.pause();
      }
    }

    for (const [id, a] of audioPlayers.current) {
      if (!activeIds.has(id) && !a.paused) a.pause();
    }
  };

  const seekPreviewToTimeline = (t: number, forceAudio = true) => {
    const v = videoRef.current;
    if (v && videoAsset) {
      const mapped = mapTimelineToVideoSource(useProjectStore.getState().clips, t, 'video');
      if (!mapped) v.pause();
      else {
        if (Math.abs(v.currentTime - mapped.sourceSec) > 0.04) v.currentTime = mapped.sourceSec;
        activeClipId.current = mapped.clip.id;
        v.muted = useProjectStore.getState().mutedSource;
      }
    }
    syncAudioClips(t, false, forceAudio);
  };

  useEffect(() => () => {
    stopAllAudio();
    audioPlayers.current.clear();
  }, []);

  useEffect(() => {
    if (!playing) {
      videoRef.current?.pause();
      stopAllAudio();
      return;
    }

    let raf = 0;
    let last = performance.now();
    const v = videoRef.current;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const state = useProjectStore.getState();
      let t = state.currentTime + dt;
      const max = state.duration();
      if (t >= max) {
        // Étendre légèrement la timeline vide pour continuer
        if (max <= state.timelineMinSec + 0.5) {
          state.setTimelineMinSec(state.timelineMinSec + 30);
        }
        setCurrentTime(Math.min(t, state.duration()));
        setPlaying(false);
        v?.pause();
        stopAllAudio();
        return;
      }

      if (v && state.videoAsset) {
        const mapped = mapTimelineToVideoSource(state.clips, t, 'video');
        if (!mapped) {
          v.pause();
          activeClipId.current = null;
        } else {
          if (activeClipId.current !== mapped.clip.id) {
            activeClipId.current = mapped.clip.id;
            v.currentTime = mapped.sourceSec;
            void v.play().catch(() => undefined);
          } else if (v.paused) {
            void v.play().catch(() => undefined);
          }
          t = mapped.clip.startSec + (v.currentTime - (mapped.clip.sourceOffsetSec ?? 0));
        }
      }

      setCurrentTime(Math.min(max, t));
      syncAudioClips(t, true, false);
      raf = requestAnimationFrame(tick);
    };

    seekPreviewToTimeline(currentTime, true);
    if (v && videoAsset) {
      v.muted = mutedSource;
      void v.play().catch(() => undefined);
    }
    syncAudioClips(currentTime, true, true);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, videoAsset?.id, mutedSource]);

  useEffect(() => {
    if (playing || scrubbing.current) return;
    seekPreviewToTimeline(currentTime, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, videoAsset?.id]);

  const onWheel: WheelEventHandler = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const timeFromClientX = (clientX: number) => {
    const scroll = scrollRef.current;
    if (!scroll) return 0;
    const rect = scroll.getBoundingClientRect();
    const x = clientX - rect.left + scroll.scrollLeft - SIDE_W;
    let t = x / pxPerSec;
    t = Math.max(0, Math.min(dur, t));
    // Aimant marqueurs
    const snapPx = MAGNET_PX / pxPerSec;
    t = snapTimeToMarker(t, snapPx);
    return t;
  };

  const startScrub = (clientX: number) => {
    scrubbing.current = true;
    setPlaying(false);
    const apply = (x: number) => {
      const t = timeFromClientX(x);
      setCurrentTime(t);
      seekPreviewToTimeline(t, true);
    };
    apply(clientX);
    const move = (ev: PointerEvent) => apply(ev.clientX);
    const up = () => {
      scrubbing.current = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onTool = (id: VideoTool) => {
    if (id === 'import') return onImport();
    if (id === 'mute') {
      toggleMuteSource();
      setActiveTool('mute');
      return;
    }
    if (id === 'addText') return addTextOverlay();
    if (id === 'addAudio') {
      onImportAudio();
      setActiveTool('addAudio');
      return;
    }
    if (id === 'addImage') {
      onImportImage();
      setActiveTool('addImage');
      return;
    }
    if (id === 'cut') {
      cutAtPlayhead();
      seekPreviewToTimeline(useProjectStore.getState().currentTime, true);
      return;
    }
    if (id === 'crop') {
      setActiveTool('crop');
      setInspector({ type: 'crop' });
      return;
    }
    setActiveTool(id);
  };

  const placeFromLibrary = (assetId: string) => {
    const asset = library.find((a) => a.id === assetId);
    if (!asset) return;
    if (asset.kind === 'video') useProjectStore.getState().setVideoAsset(asset);
    else if (asset.kind === 'audio') {
      addClip({
        track: tracks.find((t) => t.kind === 'audio')?.id ?? 'audio1',
        label: asset.name,
        startSec: currentTime,
        durationSec: asset.durationSec,
        sourceOffsetSec: 0,
        assetId: asset.id,
        color: 'var(--or)',
      });
    } else {
      addClip({
        track: tracks.find((t) => t.kind === 'images')?.id ?? 'images',
        label: asset.name,
        startSec: currentTime,
        durationSec: 5,
        assetId: asset.id,
        color: 'var(--bronze)',
        layout: { x: 55, y: 8, w: 35, h: 35 },
      });
    }
  };

  const startLayoutDrag = (
    e: ReactMouseEvent,
    clip: TimelineClip,
    mode: 'move' | 'resize',
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const stage = (e.currentTarget as HTMLElement).closest('.video-preview__stage') as HTMLElement;
    if (!stage) return;
    const layout = clip.layout ?? { x: 0, y: 0, w: 100, h: 100 };
    setSelectedClipId(clip.id);
    layoutDrag.current = { id: clip.id, mode, ox: e.clientX, oy: e.clientY, start: { ...layout } };
    const move = (ev: PointerEvent) => {
      const d = layoutDrag.current;
      if (!d) return;
      const rect = stage.getBoundingClientRect();
      const dx = ((ev.clientX - d.ox) / rect.width) * 100;
      const dy = ((ev.clientY - d.oy) / rect.height) * 100;
      if (d.mode === 'move') {
        updateClipLayout(d.id, {
          x: Math.max(0, Math.min(100 - d.start.w, d.start.x + dx)),
          y: Math.max(0, Math.min(100 - d.start.h, d.start.y + dy)),
        });
      } else {
        updateClipLayout(d.id, {
          w: Math.max(8, Math.min(100 - d.start.x, d.start.w + dx)),
          h: Math.max(8, Math.min(100 - d.start.y, d.start.h + dy)),
        });
      }
    };
    const up = () => {
      layoutDrag.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const openCtx = (e: ReactMouseEvent) => {
    e.preventDefault();
    const trackEl = (e.target as HTMLElement).closest('[data-track]') as HTMLElement | null;
    const clipEl = (e.target as HTMLElement).closest('[data-clip]') as HTMLElement | null;
    setCtx({
      x: e.clientX,
      y: e.clientY,
      trackId: trackEl?.dataset.track,
      clipId: clipEl?.dataset.clip,
    });
  };

  // Ruler ticks every 2s for long timelines
  const rulerStep = Math.max(1, Math.min(5, Math.round(dur / Math.max(8, Math.floor(timelineWidth / 70)))));
  const menuLeft = ctxPos?.x ?? ctx?.x ?? 0;
  const menuTop = ctxPos?.y ?? ctx?.y ?? 0;

  return (
    <div className="video-screen" onClick={() => setCtx(null)}>
      <div className="video-screen__left">
        <Panel title="OUTILS" className="video-screen__tools">
          {TOOLS.map((t) => (
            <Button
              key={t.id}
              variant="tool"
              selected={activeTool === t.id || (t.id === 'mute' && mutedSource)}
              icon={t.icon}
              onClick={() => onTool(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </Panel>

        <Panel title="FORMAT EXPORT" className="video-screen__format">
          <label className="video-format-roller">
            <span className="video-empty-hint">Preset</span>
            <select
              className="video-format-select"
              value={
                EXPORT_PRESETS.find((p) => p.w === videoWidth && p.h === videoHeight)?.id ?? 'custom'
              }
              onChange={(e) => {
                const p = EXPORT_PRESETS.find((x) => x.id === e.target.value);
                if (!p) return;
                setVideoExportFormat(p.format);
                setVideoCanvas(p.w, p.h);
                setCustomW(p.w);
                setCustomH(p.h);
              }}
            >
              {EXPORT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.w}x{p.h}
                </option>
              ))}
              <option value="custom">Personnalise — {customW}x{customH}</option>
            </select>
          </label>
          <div className="video-res-custom">
            <span className="video-empty-hint">Resolution manuelle</span>
            <div className="video-res-row">
              <input
                className="video-res-input mono-font"
                type="number"
                value={customW}
                onChange={(e) => setCustomW(Math.max(16, Number(e.target.value) || 16))}
              />
              <span>x</span>
              <input
                className="video-res-input mono-font"
                type="number"
                value={customH}
                onChange={(e) => setCustomH(Math.max(16, Number(e.target.value) || 16))}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setVideoCanvas(customW, customH);
                  setVideoExportFormat(`MP4 ${customW}x${customH}`);
                }}
              >
                Appliquer
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="BIBLIOTHEQUE" className="video-screen__lib">
          {library.length === 0 ? (
            <p className="video-empty-hint">Aucun media. Importer ou deposer un fichier.</p>
          ) : (
            <ul className="media-lib">
              {library.map((item) => (
                <li key={item.id}>
                  <button type="button" className="media-lib__item" onClick={() => placeFromLibrary(item.id)}>
                    <span className={`media-lib__thumb media-lib__thumb--${item.kind}`}>
                      {item.kind === 'image' && item.objectUrl ? <img src={item.objectUrl} alt="" draggable={false} /> : null}
                    </span>
                    <span className="media-lib__meta">
                      <span className="media-lib__name">{item.name}</span>
                      <span className="media-lib__kind">{item.kind}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="video-screen__right">
        <div className="video-screen__work">
          <Panel title="PREVIEW" className="video-screen__preview">
            <div
              className="video-preview preview-zoom-zone"
              onWheel={onWheel}
              onPointerDown={(e) => {
                if (e.button !== 1) return;
                e.preventDefault();
                panDrag.current = { ox: e.clientX, oy: e.clientY, px: previewPan.x, py: previewPan.y };
                const move = (ev: PointerEvent) => {
                  if (!panDrag.current) return;
                  setPreviewPan({
                    x: panDrag.current.px + (ev.clientX - panDrag.current.ox),
                    y: panDrag.current.py + (ev.clientY - panDrag.current.oy),
                  });
                };
                const up = () => {
                  panDrag.current = null;
                  window.removeEventListener('pointermove', move);
                  window.removeEventListener('pointerup', up);
                };
                window.addEventListener('pointermove', move);
                window.addEventListener('pointerup', up);
              }}
              onAuxClick={(e) => e.preventDefault()}
            >
              <div
                className="video-preview__stage"
                style={{
                  aspectRatio: `${videoWidth} / ${videoHeight}`,
                }}
              >
                <div
                  className="video-preview__canvas-frame"
                  style={{ transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${zoom / 100})` }}
                >
                  {videoAsset ? (
                    <video
                      ref={videoRef}
                      className="video-preview__media"
                      src={videoAsset.objectUrl}
                      playsInline
                      preload="auto"
                      draggable={false}
                    />
                  ) : null}

                  {visualOverlays.map((c) => {
                    const asset = c.assetId ? libraryById.get(c.assetId) : null;
                    if (!asset?.objectUrl) return null;
                    const layout = c.layout ?? { x: 0, y: 0, w: 100, h: 100 };
                    const selected = selectedClipId === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`video-preview__layer ${selected ? 'is-selected' : ''}`}
                        style={{
                          left: `${layout.x}%`,
                          top: `${layout.y}%`,
                          width: `${layout.w}%`,
                          height: `${layout.h}%`,
                        }}
                        onPointerDown={(e) => {
                          if (e.button === 1) return;
                          startLayoutDrag(e, c, 'move');
                        }}
                      >
                        <img src={asset.objectUrl} alt="" draggable={false} />
                        {selected ? (
                          <i
                            className="video-preview__resize"
                            onPointerDown={(e) => startLayoutDrag(e, c, 'resize')}
                          />
                        ) : null}
                      </div>
                    );
                  })}

                  {textClips.map((c) =>
                    c.text ? (
                      editingTextId === c.id ? (
                        <textarea
                          key={c.id}
                          className="video-text-edit"
                          style={{
                            left: `${c.text.x}%`,
                            top: `${c.text.y}%`,
                            color: c.text.color,
                            fontSize: c.text.fontSize,
                          }}
                          autoFocus
                          value={c.text.content}
                          onChange={(e) => updateTextClip(c.id, { content: e.target.value })}
                          onBlur={() => setEditingTextId(null)}
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          key={c.id}
                          className={`video-text ${selectedClipId === c.id ? 'is-selected' : ''}`}
                          style={{
                            left: `${c.text.x}%`,
                            top: `${c.text.y}%`,
                            transform: 'translate(-50%, -50%)',
                            color: c.text.color,
                            fontSize: c.text.fontSize,
                            textAlign: c.text.align,
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingTextId(c.id);
                            setSelectedClipId(c.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(c.id);
                            setInspector({ type: 'text', clipId: c.id });
                            setEditingTextId(c.id);
                          }}
                          onPointerDown={(e) => {
                            if (e.button !== 0 || e.detail > 1) return;
                            e.stopPropagation();
                            setSelectedClipId(c.id);
                            const start = { x: c.text!.x, y: c.text!.y };
                            textDrag.current = {
                              id: c.id,
                              ox: e.clientX,
                              oy: e.clientY,
                              sx: start.x,
                              sy: start.y,
                            };
                            const stage = (e.currentTarget as HTMLElement).closest(
                              '.video-preview__canvas-frame',
                            ) as HTMLElement;
                            const move = (ev: PointerEvent) => {
                              const d = textDrag.current;
                              if (!d || !stage) return;
                              const rect = stage.getBoundingClientRect();
                              const dx = ((ev.clientX - d.ox) / rect.width) * 100;
                              const dy = ((ev.clientY - d.oy) / rect.height) * 100;
                              updateTextClip(d.id, {
                                x: Math.max(0, Math.min(100, d.sx + dx)),
                                y: Math.max(0, Math.min(100, d.sy + dy)),
                              });
                            };
                            const up = () => {
                              textDrag.current = null;
                              window.removeEventListener('pointermove', move);
                              window.removeEventListener('pointerup', up);
                            };
                            window.addEventListener('pointermove', move);
                            window.addEventListener('pointerup', up);
                          }}
                        >
                          {c.text.content}
                        </div>
                      )
                    ) : null,
                  )}

                  {activeTool === 'crop' && videoAsset ? (
                    <div
                      className="video-preview__crop"
                      style={{
                        left: `${crop.x * 100}%`,
                        top: `${crop.y * 100}%`,
                        width: `${crop.w * 100}%`,
                        height: `${crop.h * 100}%`,
                      }}
                    >
                      <i className="h tl" />
                      <i className="h tr" />
                      <i className="h bl" />
                      <i className="h br" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="video-transport">
              <Button
                variant="ghost"
                icon={playing ? <IconPause /> : <IconPlay />}
                onClick={togglePlay}
                disabled={!canPreview && dur <= 0}
                title="Lecture / Pause"
              />
              <span className="mono-font video-transport__tc">
                {formatTc(currentTime)} / {formatTc(dur)}
              </span>
              <div className="video-transport__zoom">
                <Button variant="ghost" icon={<IconZoomOut />} onClick={zoomOut} />
                <span className="mono-font">{zoom}%</span>
                <Button variant="ghost" icon={<IconZoomIn />} onClick={zoomIn} />
                <span className="video-transport__hint">Molette pour zoomer</span>
              </div>
            </div>
          </Panel>

          {inspector ? (
            <Panel title="OPTIONS" className="video-screen__inspector">
              {inspector.type === 'text' && selectedText?.text ? (
                <div className="inspector-form">
                  <TextField
                    label="Texte"
                    value={selectedText.text.content}
                    onChange={(e) => updateTextClip(selectedText.id, { content: e.target.value })}
                  />
                  <label className="inspector-label">
                    Taille
                    <Slider
                      min={12}
                      max={64}
                      step={4}
                      value={selectedText.text.fontSize}
                      onChange={(fontSize) => updateTextClip(selectedText.id, { fontSize })}
                    />
                  </label>
                  <Button variant="danger" onClick={() => removeClip(selectedText.id)}>
                    Supprimer
                  </Button>
                </div>
              ) : inspector.type === 'crop' ? (
                <p className="video-empty-hint">Ajustez le cadre cyan sur la preview.</p>
              ) : inspector.type === 'clip' ? (
                <ClipInspector clipId={inspector.clipId} />
              ) : null}
            </Panel>
          ) : null}
        </div>

        <Panel title="TIMELINE" className="video-screen__timeline">
          <div className="timeline-toolbar">
            <button
              type="button"
              className="timeline-marker-btn"
              title="Ajouter un marqueur"
              onClick={(e) => {
                e.stopPropagation();
                addMarker(currentTime);
              }}
            >
              + Marqueur
            </button>
            <button
              type="button"
              className="timeline-marker-btn"
              title="Allonger la timeline"
              onClick={(e) => {
                e.stopPropagation();
                setTimelineMinSec(dur + 30);
              }}
            >
              +30s
            </button>
            <span className="timeline-toolbar__hint mono-font">Aimant actif sur marqueurs</span>
          </div>
          <div className="timeline" onContextMenu={openCtx}>
            <div className="timeline__scroll" ref={scrollRef}>
              <div className="timeline__inner" style={{ width: timelineWidth + SIDE_W }}>
                <div
                  className="timeline__ruler mono-font"
                  style={{ width: timelineWidth, marginLeft: SIDE_W }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    startScrub(e.clientX);
                  }}
                >
                  {Array.from({ length: Math.ceil(dur / rulerStep) + 1 }).map((_, i) => {
                    const t = i * rulerStep;
                    return (
                      <span key={t} style={{ left: t * pxPerSec }}>
                        {formatTc(t).slice(3)}
                      </span>
                    );
                  })}
                </div>

                {markers.map((m) => (
                  <div
                    key={m.id}
                    className="timeline__marker"
                    style={{ left: SIDE_W + m.timeSec * pxPerSec }}
                    title={`${m.label} — double-clic pour supprimer`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      removeMarker(m.id);
                    }}
                  >
                    <span>{m.label}</span>
                  </div>
                ))}

                <div
                  className="timeline__playhead"
                  style={{ left: SIDE_W + currentTime * pxPerSec }}
                />

                <div
                  className="timeline__lanes"
                  style={{ width: timelineWidth, marginLeft: SIDE_W }}
                  onPointerDown={(e) => {
                    if ((e.target as HTMLElement).closest('.timeline__clip')) return;
                    e.preventDefault();
                    startScrub(e.clientX);
                  }}
                >
                  {tracks.map((track) => (
                    <div key={track.id} className="timeline__row" data-track={track.id}>
                      <div className="timeline__side" style={{ width: SIDE_W, marginLeft: -SIDE_W }}>
                        <button
                          type="button"
                          className="timeline__add"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (track.kind === 'texte') addTextOverlay();
                            else if (track.kind === 'audio') onImportAudio();
                            else if (track.kind === 'images') onImportImage();
                            else onImport();
                          }}
                        >
                          +
                        </button>
                        <span className="timeline__label">{track.label}</span>
                      </div>
                      <div className="timeline__lane" style={{ width: timelineWidth }}>
                        {clips
                          .filter((c) => c.track === track.id)
                          .map((c) => (
                            <div
                              key={c.id}
                              data-clip={c.id}
                              className={`timeline__clip ${c.muted ? 'is-muted' : ''} ${selectedClipId === c.id ? 'is-selected' : ''}`}
                              style={{
                                left: c.startSec * pxPerSec,
                                width: Math.max(8, c.durationSec * pxPerSec),
                                background: c.color,
                              }}
                              title={c.label}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                setSelectedClipId(c.id);
                                if (c.text) setInspector({ type: 'text', clipId: c.id });
                                else setInspector({ type: 'clip', clipId: c.id });
                                dragClip.current = {
                                  id: c.id,
                                  originX: e.clientX,
                                  originStart: c.startSec,
                                };
                                const move = (ev: PointerEvent) => {
                                  if (!dragClip.current) return;
                                  const dx = ev.clientX - dragClip.current.originX;
                                  let start = dragClip.current.originStart + dx / pxPerSec;
                                  start = snapTimeToMarker(Math.max(0, start), MAGNET_PX / pxPerSec);
                                  moveClip(dragClip.current.id, start);
                                };
                                const up = () => {
                                  dragClip.current = null;
                                  window.removeEventListener('pointermove', move);
                                  window.removeEventListener('pointerup', up);
                                };
                                window.addEventListener('pointermove', move);
                                window.addEventListener('pointerup', up);
                              }}
                            >
                              <i
                                className="timeline__edge timeline__edge--start"
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  const asset = c.assetId ? libraryById.get(c.assetId) : null;
                                  const maxSrc =
                                    track.kind === 'images'
                                      ? undefined
                                      : asset?.durationSec ?? videoAsset?.durationSec;
                                  edgeDrag.current = {
                                    id: c.id,
                                    edge: 'start',
                                    originX: e.clientX,
                                    maxSrc,
                                  };
                                  const move = (ev: PointerEvent) => {
                                    const d = edgeDrag.current;
                                    if (!d) return;
                                    const delta = (ev.clientX - d.originX) / pxPerSec;
                                    d.originX = ev.clientX;
                                    trimClipEdge(d.id, 'start', delta, d.maxSrc);
                                  };
                                  const up = () => {
                                    edgeDrag.current = null;
                                    window.removeEventListener('pointermove', move);
                                    window.removeEventListener('pointerup', up);
                                  };
                                  window.addEventListener('pointermove', move);
                                  window.addEventListener('pointerup', up);
                                }}
                              />
                              {c.label}
                              {track.kind === 'audio' ? (
                                <button
                                  type="button"
                                  className="timeline__mute"
                                  title="Muet"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (c.linkedTo) toggleMuteSource();
                                    else toggleClipMute(c.id);
                                  }}
                                >
                                  M
                                </button>
                              ) : null}
                              <i
                                className="timeline__edge timeline__edge--end"
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  const asset = c.assetId ? libraryById.get(c.assetId) : null;
                                  const maxSrc =
                                    track.kind === 'images'
                                      ? undefined
                                      : asset?.durationSec ?? videoAsset?.durationSec;
                                  edgeDrag.current = {
                                    id: c.id,
                                    edge: 'end',
                                    originX: e.clientX,
                                    maxSrc,
                                  };
                                  const move = (ev: PointerEvent) => {
                                    const d = edgeDrag.current;
                                    if (!d) return;
                                    const delta = (ev.clientX - d.originX) / pxPerSec;
                                    d.originX = ev.clientX;
                                    trimClipEdge(d.id, 'end', delta, d.maxSrc);
                                  };
                                  const up = () => {
                                    edgeDrag.current = null;
                                    window.removeEventListener('pointermove', move);
                                    window.removeEventListener('pointerup', up);
                                  };
                                  window.addEventListener('pointermove', move);
                                  window.addEventListener('pointerup', up);
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {ctx ? (
        <div
          ref={ctxRef}
          className="ctx-menu"
          style={{ left: menuLeft, top: menuTop, visibility: ctxPos ? 'visible' : 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          {ctx.clipId ? (
            <>
              <button
                type="button"
                onClick={() => {
                  const c = clips.find((x) => x.id === ctx.clipId);
                  if (c?.text) setInspector({ type: 'text', clipId: ctx.clipId! });
                  else setInspector({ type: 'clip', clipId: ctx.clipId! });
                  setCtx(null);
                }}
              >
                Options
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleClipMute(ctx.clipId!);
                  setCtx(null);
                }}
              >
                Muet / Son
              </button>
              <button
                type="button"
                onClick={() => {
                  removeClip(ctx.clipId!);
                  setCtx(null);
                }}
              >
                Supprimer le clip
              </button>
            </>
          ) : null}
          <button type="button" onClick={() => { addTrack('audio'); setCtx(null); }}>
            Ajouter audio
          </button>
          <button type="button" onClick={() => { addTrack('texte'); setCtx(null); }}>
            Ajouter piste texte
          </button>
          <button type="button" onClick={() => { addTrack('images'); setCtx(null); }}>
            Ajouter piste images
          </button>
          <button
            type="button"
            onClick={() => {
              addMarker(timeFromClientX(ctx.x));
              setCtx(null);
            }}
          >
            Marqueur ici
          </button>
          {ctx.trackId ? (
            <button type="button" onClick={() => { removeTrack(ctx.trackId!); setCtx(null); }}>
              Supprimer cette piste
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ClipInspector({ clipId }: { clipId: string }) {
  const clip = useProjectStore((s) => s.clips.find((c) => c.id === clipId));
  const updateClip = useProjectStore((s) => s.updateClip);
  const updateClipLayout = useProjectStore((s) => s.updateClipLayout);
  const removeClip = useProjectStore((s) => s.removeClip);
  const toggleClipMute = useProjectStore((s) => s.toggleClipMute);
  if (!clip) return null;
  const layout = clip.layout ?? { x: 0, y: 0, w: 100, h: 100 };
  return (
    <div className="inspector-form">
      <div className="inspector-label">Clip : {clip.label}</div>
      <TextField label="Nom" value={clip.label} onChange={(e) => updateClip(clip.id, { label: e.target.value })} />
      <div className="inspector-label">Position preview (%)</div>
      <label className="inspector-label">
        X
        <Slider min={0} max={100} step={1} value={layout.x} onChange={(x) => updateClipLayout(clip.id, { x })} />
      </label>
      <label className="inspector-label">
        Y
        <Slider min={0} max={100} step={1} value={layout.y} onChange={(y) => updateClipLayout(clip.id, { y })} />
      </label>
      <label className="inspector-label">
        Largeur
        <Slider min={8} max={100} step={1} value={layout.w} onChange={(w) => updateClipLayout(clip.id, { w })} />
      </label>
      <label className="inspector-label">
        Hauteur
        <Slider min={8} max={100} step={1} value={layout.h} onChange={(h) => updateClipLayout(clip.id, { h })} />
      </label>
      <Button variant="secondary" onClick={() => toggleClipMute(clip.id)}>
        {clip.muted ? 'Activer le son' : 'Couper le son'}
      </Button>
      <Button variant="danger" onClick={() => removeClip(clip.id)}>
        Supprimer
      </Button>
    </div>
  );
}
