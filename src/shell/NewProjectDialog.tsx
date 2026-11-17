import { useState } from 'react';
import { Button, TextField } from '@/design-system';
import './ConfirmDialog.css';

export type NewProjectParams = {
  name: string;
  width: number;
  height: number;
  format: string;
  fps: number;
};

const PRESETS = [
  { id: 'hd', label: 'HD 1080p', w: 1920, h: 1080, format: 'MP4 1080p' },
  { id: '2k', label: '2K QHD', w: 2560, h: 1440, format: 'MP4 2K' },
  { id: '4k', label: '4K UHD', w: 3840, h: 2160, format: 'MP4 4K' },
  { id: 'square', label: 'Carre 1080', w: 1080, h: 1080, format: 'MP4 1:1' },
  { id: 'vertical', label: 'Vertical 1080x1920', w: 1080, h: 1920, format: 'MP4 9:16' },
  { id: '720', label: 'HD 720p', w: 1280, h: 720, format: 'MP4 720p' },
];

type Props = {
  onConfirm: (p: NewProjectParams) => void;
  onCancel: () => void;
};

export function NewProjectDialog({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('Sans_titre');
  const [preset, setPreset] = useState('hd');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [format, setFormat] = useState('MP4 1080p');
  const [fps, setFps] = useState(30);

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPreset(id);
    setWidth(p.w);
    setHeight(p.h);
    setFormat(p.format);
  };

  return (
    <div className="confirm-modal">
      <div className="confirm-modal__card confirm-modal__card--wide" role="dialog" aria-modal>
        <h2 className="display-font">NOUVEAU PROJET</h2>
        <TextField label="Nom du projet" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="np-label">Presets</div>
        <div className="np-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={preset === p.id ? 'is-on' : ''}
              onClick={() => applyPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="np-label">Resolution personnalisee</div>
        <div className="np-row">
          <label>
            Largeur
            <input
              className="np-input mono-font"
              type="number"
              min={16}
              max={7680}
              value={width}
              onChange={(e) => {
                setPreset('custom');
                setWidth(Math.max(16, Number(e.target.value) || 16));
              }}
            />
          </label>
          <span className="np-x">x</span>
          <label>
            Hauteur
            <input
              className="np-input mono-font"
              type="number"
              min={16}
              max={4320}
              value={height}
              onChange={(e) => {
                setPreset('custom');
                setHeight(Math.max(16, Number(e.target.value) || 16));
              }}
            />
          </label>
          <label>
            FPS
            <input
              className="np-input mono-font"
              type="number"
              min={1}
              max={120}
              value={fps}
              onChange={(e) => setFps(Math.max(1, Number(e.target.value) || 30))}
            />
          </label>
        </div>

        <div className="np-label">Format conteneur</div>
        <div className="np-presets">
          {['MP4', 'WebM', 'MOV'].map((f) => (
            <button
              key={f}
              type="button"
              className={format.startsWith(f) ? 'is-on' : ''}
              onClick={() => setFormat(`${f} ${width}x${height}`)}
            >
              {f}
            </button>
          ))}
        </div>

        <p className="np-summary mono-font">
          {name || 'Sans_titre'} · {width}x{height} · {fps} fps · {format}
        </p>

        <div className="confirm-modal__actions">
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              onConfirm({
                name: name.trim() || 'Sans_titre',
                width,
                height,
                format,
                fps,
              })
            }
          >
            Creer
          </Button>
        </div>
      </div>
    </div>
  );
}
