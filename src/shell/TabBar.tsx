import { Button, IconGear } from '@/design-system';
import { useUiStore } from '@/stores/uiStore';
import { useRenderQueueStore } from '@/stores/renderQueueStore';
import type { AppTab } from '@/stores/types';
import './TabBar.css';

const TABS: { id: AppTab; label: string; accent: string; gear?: boolean }[] = [
  { id: 'video', label: 'Video', accent: 'var(--accent-video)' },
  { id: 'image', label: 'Image', accent: 'var(--accent-image)' },
  { id: 'music', label: 'Musique', accent: 'var(--accent-musique)' },
  { id: 'render', label: 'Rendu', accent: 'var(--accent-rendu)' },
  { id: 'settings', label: 'Parametres', accent: 'var(--accent-parametres)', gear: true },
];

type Props = {
  onRender: () => void;
};

export function TabBar({ onRender }: Props) {
  const tab = useUiStore((s) => s.tab);
  const setTab = useUiStore((s) => s.setTab);
  const activeCount = useRenderQueueStore((s) => s.activeCount());
  const showRender = tab === 'video' || tab === 'image' || tab === 'music';

  return (
    <nav className="tabbar">
      <div className="tabbar__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={['tabbar__tab', tab === t.id ? 'is-active' : ''].filter(Boolean).join(' ')}
            style={tab === t.id ? { ['--tab-accent' as string]: t.accent } : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.gear ? <IconGear /> : null}
            <span>{t.label}</span>
            {t.id === 'render' && activeCount > 0 ? (
              <span className="tabbar__badge">{activeCount}</span>
            ) : null}
          </button>
        ))}
      </div>
      {showRender ? (
        <Button variant="primary" className="tabbar__render" onClick={onRender}>
          RENDRE
        </Button>
      ) : (
        <div className="tabbar__render-spacer" />
      )}
    </nav>
  );
}
