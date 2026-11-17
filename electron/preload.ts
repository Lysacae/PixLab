import { contextBridge, ipcRenderer } from 'electron';

export type UpdatePayload = {
  version: string;
  releaseNotes: string;
};

export type PixlabApi = {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  forceClose: () => Promise<void>;
  setScale: (scale: number) => Promise<number>;
  openPath: (targetPath: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCloseRequested: (cb: () => void) => () => void;
  ensureDir: (dirPath: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  writeFile: (
    filePath: string,
    base64: string,
  ) => Promise<{ ok: true; path: string } | { ok: false; error: string }>;
  pickDirectory: (defaultPath?: string) => Promise<string | null>;
  pickSaveFile: (opts: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<string | null>;
  pathJoin: (...parts: string[]) => Promise<string>;
  getDefaultExportDir: () => Promise<string>;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  quitAndInstall: () => Promise<void>;
  onUpdateAvailable: (cb: (info: UpdatePayload) => void) => () => void;
  onUpdateProgress: (cb: (pct: number) => void) => () => void;
  onUpdateDownloaded: (cb: () => void) => () => void;
};

const api: PixlabApi = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  forceClose: () => ipcRenderer.invoke('window:force-close'),
  setScale: (scale: number) => ipcRenderer.invoke('window:setScale', scale),
  openPath: (targetPath: string) => ipcRenderer.invoke('shell:openPath', targetPath),
  onCloseRequested: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('app:close-requested', handler);
    return () => ipcRenderer.removeListener('app:close-requested', handler);
  },
  ensureDir: (dirPath: string) => ipcRenderer.invoke('fs:ensureDir', dirPath),
  writeFile: (filePath: string, base64: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, base64),
  pickDirectory: (defaultPath?: string) => ipcRenderer.invoke('dialog:pickDirectory', defaultPath),
  pickSaveFile: (opts) => ipcRenderer.invoke('dialog:pickSaveFile', opts),
  pathJoin: (...parts: string[]) => ipcRenderer.invoke('path:join', parts),
  getDefaultExportDir: () => ipcRenderer.invoke('fs:defaultExportDir'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  quitAndInstall: () => ipcRenderer.invoke('updater:quitAndInstall'),
  onUpdateAvailable: (cb) => {
    const handler = (_: unknown, info: UpdatePayload) => cb(info);
    ipcRenderer.on('updater:available', handler);
    return () => ipcRenderer.removeListener('updater:available', handler);
  },
  onUpdateProgress: (cb) => {
    const handler = (_: unknown, pct: number) => cb(pct);
    ipcRenderer.on('updater:progress', handler);
    return () => ipcRenderer.removeListener('updater:progress', handler);
  },
  onUpdateDownloaded: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('updater:downloaded', handler);
    return () => ipcRenderer.removeListener('updater:downloaded', handler);
  },
};

contextBridge.exposeInMainWorld('pixlab', api);
