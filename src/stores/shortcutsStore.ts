import { create } from 'zustand';
import type { ShortcutAction, ShortcutBinding } from './types';

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { action: 'import', group: 'global', label: 'Importer', combo: 'Ctrl+I' },
  { action: 'render', group: 'global', label: 'Rendre', combo: 'Ctrl+R' },
  { action: 'undo', group: 'global', label: 'Annuler', combo: 'Ctrl+Z' },
  { action: 'redo', group: 'global', label: 'Retablir', combo: 'Ctrl+Y' },
  { action: 'save', group: 'global', label: 'Enregistrer le projet', combo: 'Ctrl+S' },
  { action: 'settings', group: 'global', label: 'Ouvrir Parametres', combo: 'Ctrl+,' },
  { action: 'playPause', group: 'video', label: 'Lecture / Pause', combo: 'Espace' },
  { action: 'cut', group: 'video', label: 'Couper', combo: 'C' },
  { action: 'crop', group: 'video', label: 'Recadrer', combo: 'R' },
  { action: 'mute', group: 'video', label: 'Retirer le son / Muet', combo: 'M' },
  { action: 'zoomIn', group: 'video', label: 'Zoom avant', combo: '+' },
  { action: 'zoomOut', group: 'video', label: 'Zoom arriere', combo: '-' },
  { action: 'addText', group: 'video', label: 'Ajouter texte', combo: 'T' },
  { action: 'addImage', group: 'video', label: 'Ajouter image', combo: 'I' },
  { action: 'addAudio', group: 'video', label: 'Ajouter audio', combo: 'A' },
  { action: 'upscale', group: 'image', label: 'Upscale', combo: 'U' },
  { action: 'autoCrop', group: 'image', label: 'Auto crop', combo: 'X' },
  { action: 'sendToVideo', group: 'image', label: 'Envoyer vers Video', combo: 'Ctrl+E' },
  { action: 'rename', group: 'image', label: 'Renommer', combo: 'F2' },
  { action: 'musicCut', group: 'music', label: 'Couper audio', combo: 'C' },
  { action: 'playPause', group: 'music', label: 'Lecture / Pause', combo: 'Espace' },
  { action: 'reverb', group: 'music', label: 'Reverb', combo: 'V' },
  { action: 'pitch', group: 'music', label: 'Pitch', combo: 'P' },
];

type Draft = Record<string, string>;

function keyOf(b: ShortcutBinding) {
  return `${b.group}:${b.action}`;
}

function loadBindings(): ShortcutBinding[] {
  try {
    const raw = localStorage.getItem('pixlab.shortcuts');
    if (!raw) return DEFAULT_SHORTCUTS.map((b) => ({ ...b }));
    const draft = JSON.parse(raw) as Draft;
    return DEFAULT_SHORTCUTS.map((b) => ({
      ...b,
      combo: draft[keyOf(b)] ?? b.combo,
    }));
  } catch {
    return DEFAULT_SHORTCUTS.map((b) => ({ ...b }));
  }
}

type State = {
  bindings: ShortcutBinding[];
  draft: ShortcutBinding[];
  editingKey: string | null;
  setEditingKey: (key: string | null) => void;
  updateDraftCombo: (key: string, combo: string) => void;
  resetDraft: () => void;
  save: () => void;
  findConflict: (combo: string, exceptKey: string) => ShortcutBinding | undefined;
  getCombo: (action: ShortcutAction, group?: ShortcutBinding['group']) => string | undefined;
};

export const useShortcutsStore = create<State>((set, get) => {
  const bindings = loadBindings();
  return {
    bindings,
    draft: bindings.map((b) => ({ ...b })),
    editingKey: null,
    setEditingKey: (editingKey) => set({ editingKey }),
    updateDraftCombo: (key, combo) =>
      set((s) => ({
        draft: s.draft.map((b) => (keyOf(b) === key ? { ...b, combo } : b)),
      })),
    resetDraft: () =>
      set({
        draft: DEFAULT_SHORTCUTS.map((b) => ({ ...b })),
        editingKey: null,
      }),
    save: () => {
      const draft = get().draft.map((b) => ({ ...b }));
      const payload: Draft = {};
      draft.forEach((b) => {
        payload[keyOf(b)] = b.combo;
      });
      localStorage.setItem('pixlab.shortcuts', JSON.stringify(payload));
      set({ bindings: draft, editingKey: null });
    },
    findConflict: (combo, exceptKey) =>
      get().draft.find((b) => keyOf(b) !== exceptKey && b.combo.toLowerCase() === combo.toLowerCase()),
    getCombo: (action, group) => {
      const hit = get().bindings.find((b) => b.action === action && (!group || b.group === group));
      return hit?.combo;
    },
  };
});

export function formatKeyEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey && e.key.length > 1) parts.push('Shift');
  let key = e.key;
  if (key === ' ') key = 'Espace';
  else if (key === 'Escape') key = 'Echap';
  else if (key === 'Equal' || key === '=') key = '+';
  else if (key.length === 1) key = key.toUpperCase();
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) parts.push(key);
  return parts.join('+');
}

export function eventMatchesCombo(e: KeyboardEvent, combo: string): boolean {
  return formatKeyEvent(e).toLowerCase() === combo.toLowerCase();
}
