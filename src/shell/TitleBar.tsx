import { useState } from 'react';
import { iconUrl } from '@/assets/brand';
import { LogoMark } from '@/design-system';
import { useProjectStore } from '@/stores/projectStore';
import './TitleBar.css';

type Props = {
  onRequestClose?: () => void;
};

export function TitleBar({ onRequestClose }: Props) {
  const projectName = useProjectStore((s) => s.projectName);
  const dirty = useProjectStore((s) => s.dirty);
  const [iconFailed, setIconFailed] = useState(false);

  const call = async (fn: 'minimize' | 'maximize' | 'close') => {
    const api = window.pixlab;
    if (!api) {
      console.warn('[PIXLAB] API fenetre indisponible — lancez via Electron (npm run dev)');
      return;
    }
    if (fn === 'close') {
      if (onRequestClose) onRequestClose();
      else await api.close();
      return;
    }
    await api[fn]();
  };

  return (
    <header className="titlebar">
      <div className="titlebar__drag">
        <span className="titlebar__logo" title="PIXLAB">
          {!iconFailed ? (
            <img
              src={iconUrl}
              alt=""
              width={20}
              height={20}
              className="titlebar__icon-img"
              onError={() => setIconFailed(true)}
            />
          ) : (
            <LogoMark />
          )}
        </span>
        <span className="titlebar__brand display-font">PIXLAB</span>
        <span className="titlebar__project">
          {projectName}
          {dirty ? ' *' : ''}
        </span>
      </div>
      <div className="titlebar__controls">
        <button
          type="button"
          className="titlebar__btn titlebar__btn--min"
          aria-label="Reduire"
          title="Reduire"
          onClick={(e) => {
            e.stopPropagation();
            void call('minimize');
          }}
        >
          <span className="titlebar__glyph titlebar__glyph--min" />
        </button>
        <button
          type="button"
          className="titlebar__btn titlebar__btn--max"
          aria-label="Agrandir"
          title="Agrandir"
          onClick={(e) => {
            e.stopPropagation();
            void call('maximize');
          }}
        >
          <span className="titlebar__glyph titlebar__glyph--max" />
        </button>
        <button
          type="button"
          className="titlebar__btn titlebar__btn--close"
          aria-label="Fermer"
          title="Fermer"
          onClick={(e) => {
            e.stopPropagation();
            void call('close');
          }}
        >
          <span className="titlebar__glyph titlebar__glyph--close" />
        </button>
      </div>
    </header>
  );
}
