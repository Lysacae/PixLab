import { useEffect, useState, type ReactNode } from 'react';
import {
  Button,
  IconBrush,
  IconDoc,
  IconFolder,
  IconKey,
  KeyCap,
  Panel,
} from '@/design-system';
import {
  formatKeyEvent,
  useShortcutsStore,
} from '@/stores/shortcutsStore';
import { iconUrl } from '@/assets/brand';
import { useUiStore, type SettingsCategory } from '@/stores/uiStore';
import type { ShortcutBinding } from '@/stores/types';
import { APP_VERSION } from '@/lib/version';
import './SettingsScreen.css';

const GITHUB_URL = 'https://github.com/Lysacae';
const GITHUB_REPO = 'https://github.com/Lysacae/PixLab';
const DISCORD_USER = 'lysaceae';

const CATS: { id: SettingsCategory; label: string; icon: ReactNode }[] = [
  { id: 'shortcuts', label: 'Raccourcis', icon: <IconFolder /> },
  { id: 'appearance', label: 'Apparence', icon: <IconBrush /> },
  { id: 'general', label: 'General', icon: <IconKey /> },
  { id: 'help', label: 'Aide', icon: <IconDoc /> },
];

const GROUP_LABEL: Record<string, string> = {
  global: 'Global',
  video: 'Video',
  image: 'Image',
  music: 'Musique',
};

function keyOf(b: ShortcutBinding) {
  return `${b.group}:${b.action}`;
}

export function SettingsScreen() {
  const cat = useUiStore((s) => s.settingsCategory);
  const setCat = useUiStore((s) => s.setSettingsCategory);
  const draft = useShortcutsStore((s) => s.draft);
  const editingKey = useShortcutsStore((s) => s.editingKey);
  const setEditingKey = useShortcutsStore((s) => s.setEditingKey);
  const updateDraftCombo = useShortcutsStore((s) => s.updateDraftCombo);
  const resetDraft = useShortcutsStore((s) => s.resetDraft);
  const save = useShortcutsStore((s) => s.save);
  const findConflict = useShortcutsStore((s) => s.findConflict);
  const uiScale = useUiStore((s) => s.uiScale);
  const setUiScale = useUiStore((s) => s.setUiScale);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const autoSave = useUiStore((s) => s.autoSave);
  const setAutoSave = useUiStore((s) => s.setAutoSave);
  const autoSaveIntervalSec = useUiStore((s) => s.autoSaveIntervalSec);
  const setAutoSaveIntervalSec = useUiStore((s) => s.setAutoSaveIntervalSec);
  const exportPathMode = useUiStore((s) => s.exportPathMode);
  const setExportPathMode = useUiStore((s) => s.setExportPathMode);
  const exportDir = useUiStore((s) => s.exportDir);
  const setExportDir = useUiStore((s) => s.setExportDir);
  const [conflict, setConflict] = useState<{
    key: string;
    combo: string;
    other: ShortcutBinding;
  } | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingKey) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setEditingKey(null);
        return;
      }
      const combo = formatKeyEvent(e);
      if (!combo || combo === 'Ctrl' || combo === 'Alt' || combo === 'Shift') return;
      const other = findConflict(combo, editingKey);
      if (other) {
        setConflict({ key: editingKey, combo, other });
        return;
      }
      updateDraftCombo(editingKey, combo);
      setEditingKey(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [editingKey, findConflict, setEditingKey, updateDraftCombo]);

  const groups = (['global', 'video', 'image', 'music'] as const).map((g) => ({
    id: g,
    items: draft.filter((b) => b.group === g),
  }));

  const checkUpdates = async () => {
    setUpdateBusy(true);
    setUpdateMessage(null);
    setUpdateError(null);
    try {
      const result = await window.pixlab?.checkForUpdates();
      if (!result || result.status === 'dev') {
        setUpdateMessage(`PIXLAB ${APP_VERSION} (mode developpement).`);
        return;
      }
      if (result.status === 'available') {
        setUpdateMessage(
          `Une nouvelle version est disponible : ${result.version} (vous avez ${APP_VERSION}).`,
        );
        window.dispatchEvent(
          new CustomEvent('pixlab:update-available', {
            detail: { version: result.version, releaseNotes: result.releaseNotes },
          }),
        );
        return;
      }
      if (result.status === 'uptodate') {
        setUpdateMessage(`PIXLAB ${APP_VERSION} est a jour.`);
        return;
      }
      setUpdateError(result.error || 'Verification impossible.');
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : String(e));
    } finally {
      setUpdateBusy(false);
    }
  };

  return (
    <div className="settings-screen">
      <Panel title="Categories" className="settings-screen__cats">
        {CATS.map((c) => (
          <Button
            key={c.id}
            variant="tool"
            selected={cat === c.id}
            icon={c.icon}
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </Button>
        ))}
      </Panel>

      <Panel
        title={
          cat === 'shortcuts'
            ? 'Raccourcis clavier'
            : cat === 'appearance'
              ? 'Apparence'
              : cat === 'general'
                ? 'General'
                : 'Aide'
        }
        className="settings-screen__main"
      >
        {cat === 'shortcuts' ? (
          <div className="settings-groups">
            {groups.map((g) => (
              <div key={g.id} className="settings-group">
                <h3>{GROUP_LABEL[g.id]}</h3>
                <ul>
                  {g.items.map((b) => {
                    const k = keyOf(b);
                    const editing = editingKey === k;
                    return (
                      <li key={k}>
                        <span>{b.label}</span>
                        <div className="settings-bind">
                          {editing ? (
                            <span className="settings-edit-hint">Appuyez sur une touche…</span>
                          ) : (
                            <KeyCap label={b.combo} />
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => setEditingKey(editing ? null : k)}
                          >
                            {editing ? 'Annuler' : 'Modifier'}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : null}

        {cat === 'appearance' ? (
          <div className="settings-appearance">
            <p className="settings-sub">Echelle UI</p>
            <div className="settings-scale">
              {([1, 2, 3, 4] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={['scale-chip', uiScale === s ? 'is-on' : ''].join(' ')}
                  onClick={() => setUiScale(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
            <p className="settings-sub">Theme</p>
            <div className="settings-scale">
              <button
                type="button"
                className={['scale-chip', theme === 'dark' ? 'is-on' : ''].join(' ')}
                onClick={() => setTheme('dark')}
              >
                Sombre
              </button>
              <button
                type="button"
                className={['scale-chip', theme === 'light' ? 'is-on' : ''].join(' ')}
                onClick={() => setTheme('light')}
              >
                Clair
              </button>
            </div>
          </div>
        ) : null}

        {cat === 'general' ? (
          <div className="settings-appearance">
            <p className="settings-sub">Sauvegarde automatique</p>
            <div className="settings-scale">
              <button
                type="button"
                className={['scale-chip', autoSave ? 'is-on' : ''].join(' ')}
                onClick={() => setAutoSave(true)}
              >
                On
              </button>
              <button
                type="button"
                className={['scale-chip', !autoSave ? 'is-on' : ''].join(' ')}
                onClick={() => setAutoSave(false)}
              >
                Off
              </button>
            </div>
            <p className="settings-sub">Intervalle (secondes)</p>
            <div className="settings-scale">
              {[30, 60, 120, 300].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  className={['scale-chip', autoSaveIntervalSec === sec ? 'is-on' : ''].join(' ')}
                  onClick={() => setAutoSaveIntervalSec(sec)}
                  disabled={!autoSave}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <p className="settings-sub">Destination des rendus</p>
            <div className="settings-scale">
              <button
                type="button"
                className={['scale-chip', exportPathMode === 'ask' ? 'is-on' : ''].join(' ')}
                onClick={() => setExportPathMode('ask')}
              >
                Demander a chaque rendu
              </button>
              <button
                type="button"
                className={['scale-chip', exportPathMode === 'fixed' ? 'is-on' : ''].join(' ')}
                onClick={() => setExportPathMode('fixed')}
              >
                Toujours le meme dossier
              </button>
            </div>
            <p className="settings-sub">Dossier fixe</p>
            <code className="mono-font" style={{ display: 'block', wordBreak: 'break-all' }}>
              {exportDir}
            </code>
            <div className="settings-scale" style={{ marginTop: 8 }}>
              <Button
                variant="secondary"
                onClick={async () => {
                  const dir = await window.pixlab?.pickDirectory(exportDir);
                  if (dir) setExportDir(dir);
                }}
              >
                Choisir un dossier…
              </Button>
            </div>
            <p className="settings-sub" style={{ marginTop: 16 }}>
              Langue : Francais
            </p>
          </div>
        ) : null}

        {cat === 'help' ? (
          <div className="settings-about">
            <div className="settings-about__brand">
              <img src={iconUrl} alt="" width={48} height={48} style={{ imageRendering: 'pixelated' }} />
              <span className="display-font">PIXLAB</span>
            </div>
            <p>Version {APP_VERSION}</p>
            <p className="settings-sub">Auteur : Lysacae</p>

            <p className="settings-sub" style={{ marginTop: 16 }}>
              Contact
            </p>
            <div className="settings-scale" style={{ flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => void window.pixlab?.openExternal(GITHUB_URL)}>
                GitHub — Lysacae
              </Button>
              <Button variant="secondary" onClick={() => void window.pixlab?.openExternal(GITHUB_REPO)}>
                Repo PixLab
              </Button>
            </div>
            <p className="mono-font" style={{ marginTop: 8 }}>
              Discord : {DISCORD_USER}
            </p>

            <p className="settings-sub" style={{ marginTop: 16 }}>
              Mises a jour
            </p>
            <div className="settings-scale">
              <Button variant="primary" onClick={() => void checkUpdates()} disabled={updateBusy}>
                {updateBusy ? 'Verification…' : 'Verifier les mises a jour'}
              </Button>
            </div>
            {updateMessage ? <p className="settings-sub">{updateMessage}</p> : null}
            {updateError ? <p className="settings-update-error">{updateError}</p> : null}
          </div>
        ) : null}

        {cat === 'shortcuts' ? (
          <div className="settings-actions">
            <Button variant="secondary" onClick={resetDraft}>
              Reinitialiser
            </Button>
            <Button variant="primary" onClick={save}>
              ENREGISTRER
            </Button>
          </div>
        ) : null}
      </Panel>

      {conflict ? (
        <div className="settings-modal">
          <div className="settings-modal__card">
            <p>
              Cette touche est deja utilisee par [{conflict.other.label}]. Remplacer ?
            </p>
            <div className="settings-modal__actions">
              <Button
                variant="primary"
                onClick={() => {
                  const otherKey = `${conflict.other.group}:${conflict.other.action}`;
                  updateDraftCombo(otherKey, '—');
                  updateDraftCombo(conflict.key, conflict.combo);
                  setEditingKey(null);
                  setConflict(null);
                }}
              >
                Oui
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setConflict(null);
                  setEditingKey(null);
                }}
              >
                Non
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
