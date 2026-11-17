import { create } from 'zustand';
import type { AppTab } from './types';

export type ExportPathMode = 'ask' | 'fixed';

type UiState = {
  tab: AppTab;
  uiScale: 1 | 2 | 3 | 4;
  statusText: string;
  autoSave: boolean;
  autoSaveIntervalSec: number;
  exportPathMode: ExportPathMode;
  exportDir: string;
  setTab: (tab: AppTab) => void;
  setUiScale: (scale: 1 | 2 | 3 | 4) => void;
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

export const useUiStore = create<UiState>((set) => ({
  tab: 'video',
  uiScale: [1, 2, 3, 4].includes(savedScale) ? savedScale : 1,
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
