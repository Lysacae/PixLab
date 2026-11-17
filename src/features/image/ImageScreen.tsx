import { useEffect, useRef, useState, type WheelEvent } from 'react';
import { Button, Chip, IconImage, Panel, Progress, TextField } from '@/design-system';
import { useProjectStore } from '@/stores/projectStore';
import { useUiStore } from '@/stores/uiStore';
import type { ImageRatio } from '@/stores/types';
import './ImageScreen.css';

const RATIOS: ImageRatio[] = [
  '1:1',
  '4:3',
  '3:2',
  '16:9',
  '9:16',
  '21:9',
  '4:5',
  '2:3',
  '5:4',
  'Libre',
];

type Props = { onImport: () => void };

function ZoomPane({
  src,
  badge,
  loading,
}: {
  src: string;
  badge?: string;
  loading?: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; long: boolean; t: number } | null>(
    null,
  );

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = Math.max(1, Math.min(8, zoom + (e.deltaY < 0 ? 0.2 : -0.2)));
    setZoom(next);
    if (next <= 1) setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className={`image-frame ${loading ? 'is-loading' : ''}`}
      onWheel={onWheel}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, long: false, t: Date.now() };
        window.setTimeout(() => {
          if (drag.current && Date.now() - drag.current.t >= 160) drag.current.long = true;
        }, 160);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        if (!d.long && Date.now() - d.t < 160) return;
        d.long = true;
        if (zoom <= 1) return;
        setPan({
          x: d.px + (e.clientX - d.x),
          y: d.py + (e.clientY - d.y),
        });
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onDragStart={(e) => e.preventDefault()}
      draggable={false}
      title="Molette = zoom · maintien clic gauche = deplacer"
    >
      <img
        src={src}
        alt=""
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          imageRendering: zoom > 2 ? 'pixelated' : 'auto',
        }}
      />
      {badge ? <span className="image-badge">{badge}</span> : null}
      <span className="image-zoom-hint mono-font">{Math.round(zoom * 100)}%</span>
    </div>
  );
}

export function ImageScreen({ onImport }: Props) {
  const setTab = useUiStore((s) => s.setTab);
  const {
    imageAsset,
    imageScale,
    setImageScale,
    imageRatio,
    setImageRatio,
    outputName,
    setOutputName,
    imagePreviewReady,
    imageOutW,
    imageOutH,
    imageUpscaledUrl,
    imageUpscaleProgress,
    sendImageToVideo,
    renameFocused,
    setRenameFocused,
    refreshImagePreview,
  } = useProjectStore();

  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renameFocused) {
      renameRef.current?.focus();
      renameRef.current?.select();
      setRenameFocused(false);
    }
  }, [renameFocused, setRenameFocused]);

  return (
    <div
      className="image-screen"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) e.preventDefault();
      }}
    >
      <Panel title="OUTILS IMAGE" className="image-screen__tools">
        <div className="image-block">
          <div className="image-block__title">IA UPSCALE · Real-ESRGAN</div>
          <div className="image-block__sub">Modele neuronal (nettete reelle)</div>
          <div className="image-block__row">
            <button
              type="button"
              className={['image-scale', imageScale === 2 ? 'is-on' : ''].join(' ')}
              onClick={() => setImageScale(2)}
            >
              x2 CUGAN
            </button>
            <button
              type="button"
              className={['image-scale', imageScale === 4 ? 'is-on' : ''].join(' ')}
              onClick={() => setImageScale(4)}
            >
              x4 ESRGAN
            </button>
          </div>
          {!imagePreviewReady ? <Progress value={imageUpscaleProgress} tone="orange" /> : null}
          <Button
            variant="secondary"
            disabled={!imageAsset || !imagePreviewReady}
            onClick={() => void refreshImagePreview()}
          >
            Relancer upscale
          </Button>
        </div>

        <div className="image-block">
          <div className="image-block__title">AUTO CROP</div>
          <div className="image-block__sub">Ratio</div>
          <div className="image-ratios">
            {RATIOS.map((r) => (
              <Chip
                key={r}
                label={r}
                selected={imageRatio === r}
                accent="var(--cyan)"
                onClick={() => setImageRatio(r)}
              />
            ))}
          </div>
        </div>

        <div className="image-block">
          <div className="image-block__title">Renommer</div>
          <TextField
            ref={renameRef}
            label="Nom de sortie"
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
          />
        </div>

        <div className="image-tools-actions">
          <Button variant="secondary" onClick={onImport}>
            Importer
          </Button>
          <Button
            variant="secondary"
            className="image-send"
            icon={<IconImage color="var(--violet-magie)" />}
            onClick={() => {
              sendImageToVideo();
              setTab('video');
            }}
          >
            Envoyer vers Video
          </Button>
        </div>
      </Panel>

      <div className="image-screen__preview">
        <div className="image-compare">
          <Panel title="AVANT" className="image-compare__pane" inset>
            {imageAsset ? (
              <ZoomPane src={imageAsset.objectUrl} />
            ) : (
              <div className="image-frame">
                <div className="image-empty">Aucun media</div>
              </div>
            )}
          </Panel>
          <Panel title="APRES" className="image-compare__pane" inset>
            {imageAsset ? (
              <ZoomPane
                src={imageUpscaledUrl || imageAsset.objectUrl}
                badge={`x${imageScale} ESRGAN`}
                loading={!imagePreviewReady}
              />
            ) : (
              <div className="image-frame">
                <div className="image-empty">Aucun media</div>
              </div>
            )}
          </Panel>
        </div>
        <div className="image-meta mono-font">
          Sortie {imageOutW}x{imageOutH}
          {!imagePreviewReady ? ` · upscale ${imageUpscaleProgress}%` : ' · molette zoom / maintien clic = pan'}
        </div>
      </div>
    </div>
  );
}
