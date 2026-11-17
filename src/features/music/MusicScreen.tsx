import { useEffect, useMemo, useRef } from 'react';
import {
  Button,
  IconFolder,
  IconLoop,
  IconPause,
  IconPlay,
  IconStop,
  Knob,
  Panel,
  Slider,
} from '@/design-system';
import { MusicPreviewEngine } from '@/lib/audioEngine';
import { useLibraryStore } from '@/stores/libraryStore';
import { useProjectStore } from '@/stores/projectStore';
import './MusicScreen.css';

function formatTc(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

type Props = { onImport: () => void };

export function MusicScreen({ onImport }: Props) {
  const items = useLibraryStore((s) => s.items);
  const library = useMemo(() => items.filter((i) => i.kind === 'audio'), [items]);
  const musicAsset = useProjectStore((s) => s.musicAsset);
  const audioFx = useProjectStore((s) => s.audioFx);
  const setAudioFx = useProjectStore((s) => s.setAudioFx);
  const waveform = useProjectStore((s) => s.waveform);
  const musicPlaying = useProjectStore((s) => s.musicPlaying);
  const setMusicPlaying = useProjectStore((s) => s.setMusicPlaying);
  const musicTime = useProjectStore((s) => s.musicTime);
  const setMusicTime = useProjectStore((s) => s.setMusicTime);
  const musicFocus = useProjectStore((s) => s.musicFocus);
  const setMusicAsset = useProjectStore((s) => s.setMusicAsset);
  const toggleMusicPlay = useProjectStore((s) => s.toggleMusicPlay);

  const engineRef = useRef<MusicPreviewEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrubbing = useRef(false);
  const duration = musicAsset?.durationSec || Math.max(audioFx.outSec || 0, 1);

  useEffect(() => {
    const engine = new MusicPreviewEngine();
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !musicAsset) return;
    let cancelled = false;
    void (async () => {
      try {
        await engine.load(musicAsset.objectUrl);
        if (cancelled) return;
        engine.setParams({
          speed: audioFx.speed,
          pitchSemitones: audioFx.pitchSemitones,
          reverb: audioFx.reverb,
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
      engine.stop(true);
      setMusicPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicAsset?.id, musicAsset?.objectUrl]);

  useEffect(() => {
    engineRef.current?.setParams({
      speed: audioFx.speed,
      pitchSemitones: audioFx.pitchSemitones,
      reverb: audioFx.reverb,
    });
  }, [audioFx.speed, audioFx.pitchSemitones, audioFx.reverb]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !musicAsset) return;
    if (scrubbing.current) return;

    if (musicPlaying) {
      const from =
        musicTime < audioFx.inSec || musicTime >= audioFx.outSec - 0.05
          ? audioFx.inSec
          : musicTime;
      void engine.play(from, () => {
        if (audioFx.loop) {
          setMusicTime(audioFx.inSec);
          void engine.play(audioFx.inSec);
        } else {
          setMusicPlaying(false);
          setMusicTime(audioFx.outSec);
        }
      });
    } else {
      engine.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicPlaying]);

  useEffect(() => {
    if (!musicPlaying || scrubbing.current) return;
    const id = window.setInterval(() => {
      const engine = engineRef.current;
      if (!engine || scrubbing.current) return;
      const t = engine.getCurrentTime();
      if (!Number.isFinite(t)) return;
      setMusicTime(Math.min(t, duration));
      if (t >= audioFx.outSec - 0.02) {
        if (audioFx.loop) {
          engine.seek(audioFx.inSec);
          setMusicTime(audioFx.inSec);
        } else {
          engine.pause();
          setMusicPlaying(false);
          setMusicTime(audioFx.outSec);
        }
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [musicPlaying, audioFx, duration, setMusicPlaying, setMusicTime]);

  // Canvas waveform — mirrored, loud = tall
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0812';
    ctx.fillRect(0, 0, w, h);

    const mid = h / 2;
    const bars = waveform.length || 64;
    const gap = 1;
    const barW = Math.max(2, (w - gap * bars) / bars);
    const inX = (audioFx.inSec / duration) * w;
    const outX = (audioFx.outSec / duration) * w;
    const playX = (Math.min(musicTime, duration) / duration) * w;

    for (let i = 0; i < bars; i++) {
      const amp = waveform[i] ?? 0.05;
      // Fort → haut (amp↑), faible → bas (amp↓)
      const half = Math.max(2, amp * (h * 0.42));
      const x = i * (barW + gap);
      const pct = (i / Math.max(1, bars - 1)) * 100;
      const inPct = (audioFx.inSec / duration) * 100;
      const outPct = (audioFx.outSec / duration) * 100;
      const active = pct >= inPct && pct <= outPct;
      ctx.fillStyle = active ? '#5EC8FF' : '#FFC857';
      if (!active) ctx.globalAlpha = 0.35;
      else ctx.globalAlpha = 1;
      ctx.fillRect(x, mid - half, barW, half * 2);
    }
    ctx.globalAlpha = 1;

    // IN / OUT
    ctx.fillStyle = '#FFC857';
    ctx.fillRect(inX - 2, 8, 4, h - 16);
    ctx.fillRect(outX - 2, 8, 4, h - 16);

    // Playhead
    ctx.fillStyle = '#5EC8FF';
    ctx.fillRect(playX - 1, 4, 2, h - 8);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#5EC8FF';
    const label = formatTc(musicTime);
    ctx.fillText(label, Math.min(w - 56, Math.max(4, playX + 4)), 14);
  }, [waveform, musicTime, audioFx.inSec, audioFx.outSec, duration]);

  const timeFromClientX = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1);
    return x * duration;
  };

  const beginSeek = (clientX: number, el: HTMLElement) => {
    scrubbing.current = true;
    // Stop playback while scrubbing (bug: music kept playing)
    if (musicPlaying) {
      engineRef.current?.pause();
      setMusicPlaying(false);
    }
    const apply = (cx: number) => {
      let t = timeFromClientX(cx, el);
      t = Math.min(Math.max(t, 0), duration);
      setMusicTime(t);
      engineRef.current?.setOffset(t);
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

  const inPct = (audioFx.inSec / duration) * 100;
  const outPct = (Math.max(audioFx.outSec, audioFx.inSec + 0.1) / duration) * 100;
  const playPct = (Math.min(musicTime, duration) / duration) * 100;

  return (
    <div className="music-screen">
      <div className="music-screen__side">
        <Button variant="tool" icon={<IconFolder />} onClick={onImport}>
          Importer
        </Button>
        <Panel title="BIBLIOTHEQUE" className="music-lib-panel">
          {library.length === 0 ? (
            <p className="music-empty">Aucun audio importe.</p>
          ) : (
            <ul className="music-lib">
              {library.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={musicAsset?.id === item.id ? 'is-on' : ''}
                    onClick={() => void setMusicAsset(item)}
                  >
                    <span className="music-lib__thumb" />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="FORME D'ONDE" className="music-screen__wave">
        {!musicAsset ? (
          <div className="music-empty-wave">
            <span>Aucun media</span>
            <span>Importez un fichier audio</span>
          </div>
        ) : (
          <>
            <div className="wave-well" onPointerDown={(e) => beginSeek(e.clientX, e.currentTarget)}>
              <canvas ref={canvasRef} className="wave-canvas" />
              <div
                className="wave-handle in"
                style={{ left: `${inPct}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const el = e.currentTarget.parentElement!;
                  const move = (ev: PointerEvent) => {
                    const rect = el.getBoundingClientRect();
                    const x = Math.min(Math.max(0, (ev.clientX - rect.left) / rect.width), 1);
                    setAudioFx({ inSec: Math.min(x * duration, audioFx.outSec - 0.2) });
                  };
                  const up = () => {
                    window.removeEventListener('pointermove', move);
                    window.removeEventListener('pointerup', up);
                  };
                  window.addEventListener('pointermove', move);
                  window.addEventListener('pointerup', up);
                }}
              >
                <span>IN</span>
              </div>
              <div
                className="wave-handle out"
                style={{ left: `${outPct}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const el = e.currentTarget.parentElement!;
                  const move = (ev: PointerEvent) => {
                    const rect = el.getBoundingClientRect();
                    const x = Math.min(Math.max(0, (ev.clientX - rect.left) / rect.width), 1);
                    setAudioFx({ outSec: Math.max(x * duration, audioFx.inSec + 0.2) });
                  };
                  const up = () => {
                    window.removeEventListener('pointermove', move);
                    window.removeEventListener('pointerup', up);
                  };
                  window.addEventListener('pointermove', move);
                  window.addEventListener('pointerup', up);
                }}
              >
                <span>OUT</span>
              </div>
            </div>

            <div className="wave-seek" onPointerDown={(e) => beginSeek(e.clientX, e.currentTarget)}>
              <div className="wave-seek__track">
                <div className="wave-seek__range" style={{ left: `${inPct}%`, width: `${outPct - inPct}%` }} />
                <div className="wave-seek__head" style={{ left: `${playPct}%` }} />
              </div>
              <div className="wave-seek__labels mono-font">
                <span>00:00</span>
                <span style={{ color: 'var(--cyan)' }}>{formatTc(musicTime).slice(3)}</span>
                <span>{formatTc(duration).slice(3)}</span>
              </div>
            </div>

            <div className="music-transport">
              <Button
                variant="ghost"
                icon={musicPlaying ? <IconPause /> : <IconPlay />}
                onClick={() => {
                  if (!musicPlaying && (musicTime < audioFx.inSec || musicTime >= audioFx.outSec)) {
                    setMusicTime(audioFx.inSec);
                    engineRef.current?.setOffset(audioFx.inSec);
                  }
                  toggleMusicPlay();
                }}
              />
              <Button
                variant="ghost"
                icon={<IconStop />}
                onClick={() => {
                  setMusicPlaying(false);
                  setMusicTime(audioFx.inSec);
                  engineRef.current?.seek(audioFx.inSec);
                  engineRef.current?.pause();
                }}
              />
              <Button
                variant="ghost"
                icon={<IconLoop />}
                selected={audioFx.loop}
                onClick={() => setAudioFx({ loop: !audioFx.loop })}
              />
              <span className="mono-font">
                {formatTc(musicTime)} / {formatTc(duration)}
              </span>
              <span className="music-transport__hint">Apercu lecture</span>
            </div>
          </>
        )}
      </Panel>

      <Panel title="EFFETS" className="music-screen__fx">
        <div className="fx-block">
          <div className="fx-label">Vitesse</div>
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            value={audioFx.speed}
            accent="var(--or)"
            labels={['0.5x', '1.0x', '1.5x', '2.0x']}
            onChange={(speed) => setAudioFx({ speed })}
            disabled={!musicAsset}
          />
          <div className="fx-caption">Sans deformation du pitch</div>
        </div>

        <div className={musicFocus === 'reverb' ? 'is-focused' : ''}>
          <Knob
            label="REVERB"
            value={audioFx.reverb}
            min={0}
            max={100}
            display={`${audioFx.reverb}%`}
            onChange={(reverb) => setAudioFx({ reverb })}
          />
        </div>

        <div className={musicFocus === 'pitch' ? 'is-focused' : ''}>
          <div className="pitch-row">
            <Knob
              label="PITCH"
              value={audioFx.pitchSemitones}
              min={-12}
              max={12}
              step={1}
              display={`${audioFx.pitchSemitones} st`}
              onChange={(pitchSemitones) => setAudioFx({ pitchSemitones })}
            />
            <div className="pitch-btns">
              <Button
                variant="secondary"
                onClick={() => setAudioFx({ pitchSemitones: Math.max(-12, audioFx.pitchSemitones - 1) })}
              >
                -
              </Button>
              <Button
                variant="secondary"
                onClick={() => setAudioFx({ pitchSemitones: Math.min(12, audioFx.pitchSemitones + 1) })}
              >
                +
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
