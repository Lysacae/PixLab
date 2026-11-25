import { useEffect, useRef, useState } from 'react';
import './MenuBar.css';

export type MenuAction =
  | 'new'
  | 'open'
  | 'importVideo'
  | 'importImage'
  | 'importAudio'
  | 'save'
  | 'render'
  | 'quit'
  | 'settings'
  | 'about'
  | 'help';

type Props = {
  onAction: (action: MenuAction) => void;
};

const MENUS: {
  id: string;
  label: string;
  items: { id: MenuAction | 'sep'; label?: string; shortcut?: string }[];
}[] = [
  {
    id: 'fichier',
    label: 'Fichier',
    items: [
      { id: 'new', label: 'Nouveau projet', shortcut: 'Ctrl+N' },
      { id: 'open', label: 'Ouvrir projet…', shortcut: 'Ctrl+O' },
      { id: 'sep' },
      { id: 'importVideo', label: 'Importer video…', shortcut: 'Ctrl+I' },
      { id: 'importImage', label: 'Importer image…' },
      { id: 'importAudio', label: 'Importer audio…' },
      { id: 'sep' },
      { id: 'save', label: 'Enregistrer (.pxl)', shortcut: 'Ctrl+S' },
      { id: 'render', label: 'Rendre', shortcut: 'Ctrl+R' },
      { id: 'sep' },
      { id: 'quit', label: 'Quitter', shortcut: 'Alt+F4' },
    ],
  },
  {
    id: 'outils',
    label: 'Outils',
    items: [
      { id: 'settings', label: 'Parametres', shortcut: 'Ctrl+,' },
      { id: 'render', label: 'Ouvrir file de rendu' },
    ],
  },
  {
    id: 'aide',
    label: 'Aide',
    items: [
      { id: 'help', label: 'Aide & contact' },
      { id: 'about', label: 'A propos / Mises a jour' },
    ],
  },
];

export function MenuBar({ onAction }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="menubar" ref={ref}>
      {MENUS.map((menu) => (
        <div key={menu.id} className="menubar__item">
          <button
            type="button"
            className={open === menu.id ? 'is-open' : ''}
            onClick={() => setOpen(open === menu.id ? null : menu.id)}
            onMouseEnter={() => {
              if (open) setOpen(menu.id);
            }}
          >
            {menu.label}
          </button>
          {open === menu.id ? (
            <div className="menubar__dropdown">
              {menu.items.map((item, i) =>
                item.id === 'sep' ? (
                  <div key={`sep-${i}`} className="menubar__sep" />
                ) : (
                  <button
                    key={item.id + String(i)}
                    type="button"
                    onClick={() => {
                      onAction(item.id as MenuAction);
                      setOpen(null);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut ? <span className="menubar__sc">{item.shortcut}</span> : null}
                  </button>
                ),
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
