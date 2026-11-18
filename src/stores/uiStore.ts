import { create } from 'zustand';
import type { AppTab } from './types';

export type ExportPathMode = 'ask' | 'fixed';
export type ThemeMode = 'dark' | 'light';

type UiState = {
  tab: AppTab;
  uiScale: 1 | 2 | 3 | 4;
  theme: ThemeMode;
  statusText: string;
  autoSave: boolean;
  autoSaveIntervalSec: number;
  exportPathMode: ExportPathMode;
  exportDir: string;
  setTab: (tab: AppTab) => void;
  setUiScale: (scale: 1 | 2 | 3 | 4) => void;
  setTheme: (theme: ThemeMode) => void;
  setStatusText: (text: string) => void;
  setAutoSave: (v: boolean) => void;
  setAutoSaveIntervalSec: (sec: number) => void;
  setExportPathMode: (mode: ExportPathMode) => void;
  setExportDir: (dir: string) => void;
};

const savedScale = Number(localStorage.getItem('pixlab.uiScale') || '1') as 1 | 2 | 3 | 4;
const savedAuto = localStorage.getItem('pixlab.autoSave') !== '0';
const savedInterval = Number(localStorage.getItem('pixlab.autoSaveInterval') || '60');
const savedExportMode = (localStorage.getItem('pixlab.exportPathMode') || 'ask') as ExportPathMode;
const savedExportDir =
  localStorage.getItem('pixlab.exportDir') || 'C:\\Users\\Public\\PIXLAB\\exports';
const savedTheme = (localStorage.getItem('pixlab.theme') || 'dark') as ThemeMode;

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
}

applyTheme(savedTheme === 'light' ? 'light' : 'dark');

export const useUiStore = create<UiState>((set) => ({
  tab: 'video',
  uiScale: [1, 2, 3, 4].includes(savedScale) ? savedScale : 1,
  theme: savedTheme === 'light' ? 'light' : 'dark',
  statusText: 'Sans_titre.pxl',
  autoSave: savedAuto,
  autoSaveIntervalSec: Number.isFinite(savedInterval) ? Math.max(15, savedInterval) : 60,
  exportPathMode: savedExportMode === 'fixed' ? 'fixed' : 'ask',
  exportDir: savedExportDir,
  setTab: (tab) => set({ tab }),
  setUiScale: (uiScale) => {
    localStorage.setItem('pixlab.uiScale', String(uiScale));
    void window.pixlab?.setScale(uiScale);
    set({ uiScale });
  },
  setTheme: (theme) => {
    localStorage.setItem('pixlab.theme', theme);
    applyTheme(theme);
    set({ theme });
  },
  setStatusText: (statusText) => set({ statusText }),
  setAutoSave: (autoSave) => {
    localStorage.setItem('pixlab.autoSave', autoSave ? '1' : '0');
    set({ autoSave });
  },
  setAutoSaveIntervalSec: (autoSaveIntervalSec) => {
    const v = Math.max(15, Math.min(600, Math.round(autoSaveIntervalSec)));
    localStorage.setItem('pixlab.autoSaveInterval', String(v));
    set({ autoSaveIntervalSec: v });
  },
  setExportPathMode: (exportPathMode) => {
    localStorage.setItem('pixlab.exportPathMode', exportPathMode);
    set({ exportPathMode });
  },
  setExportDir: (exportDir) => {
    localStorage.setItem('pixlab.exportDir', exportDir);
    set({ exportDir });
  },
}));
