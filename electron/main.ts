import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_W = 1280;
const BASE_H = 720;

let mainWindow: BrowserWindow | null = null;
let uiScale = 1;
let allowClose = false;

function resolvePreload() {
  const candidates = [
    path.join(__dirname, 'preload.cjs'),
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, 'preload.mjs'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

function resolveIcon() {
  const candidates = [
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../public/icon.png'),
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../public/icon.jpg'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: BASE_W * uiScale,
    height: BASE_H * uiScale,
    minWidth: BASE_W,
    minHeight: BASE_H,
    frame: false,
    backgroundColor: '#0E0C16',
    icon: resolveIcon(),
    webPreferences: {
      preload: resolvePreload(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (e) => {
    if (allowClose) return;
    e.preventDefault();
    mainWindow?.webContents.send('app:close-requested');
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.handle('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

ipcMain.handle('window:close', (event) => {
  // Demande de fermeture via bouton UI → même flux (confirmation renderer)
  allowClose = false;
  BrowserWindow.fromWebContents(event.sender)?.webContents.send('app:close-requested');
});

ipcMain.handle('window:force-close', (event) => {
  allowClose = true;
  BrowserWindow.fromWebContents(event.sender)?.close();
  // reset for next window
  setTimeout(() => {
    allowClose = false;
  }, 500);
});

ipcMain.handle('window:setScale', (_event, scale: number) => {
  const s = Math.max(1, Math.min(4, Math.round(scale)));
  uiScale = s;
  if (!mainWindow) return s;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  mainWindow.setSize(BASE_W * s, BASE_H * s);
  mainWindow.center();
  return s;
});

ipcMain.handle('shell:openPath', async (_event, targetPath: string) => {
  if (!targetPath) return { ok: false as const, error: 'empty' };
  const err = await shell.openPath(targetPath);
  return err ? { ok: false as const, error: err } : { ok: true as const };
});

function defaultExportDir() {
  return path.join('C:\\Users\\Public\\PIXLAB\\exports');
}

ipcMain.handle('fs:defaultExportDir', () => defaultExportDir());

ipcMain.handle('fs:ensureDir', async (_event, dirPath: string) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath: string, base64: string) => {
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const buf = Buffer.from(base64, 'base64');
    await fs.promises.writeFile(filePath, buf);
    return { ok: true as const, path: filePath };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
});

ipcMain.handle('dialog:pickDirectory', async (_event, defaultPath?: string) => {
  const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
  const result = await dialog.showOpenDialog(win ?? undefined!, {
    title: 'Choisir le dossier de destination',
    defaultPath: defaultPath || defaultExportDir(),
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle(
  'dialog:pickSaveFile',
  async (
    _event,
    opts: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] },
  ) => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const result = await dialog.showSaveDialog(win ?? undefined!, {
      title: 'Enregistrer le rendu',
      defaultPath: opts?.defaultPath,
      filters: opts?.filters ?? [{ name: 'Tous les fichiers', extensions: ['*'] }],
    });
    if (result.canceled || !result.filePath) return null;
    return result.filePath;
  },
);

ipcMain.handle('path:join', (_event, parts: string[]) => path.join(...parts));

ipcMain.handle(
  'dialog:pickOpenFile',
  async (_event, opts: { filters?: { name: string; extensions: string[] }[] }) => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const result = await dialog.showOpenDialog(win ?? undefined!, {
      title: 'Ouvrir un projet PIXLAB',
      properties: ['openFile'],
      filters: opts?.filters ?? [{ name: 'Projet PIXLAB', extensions: ['pxl'] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  },
);

ipcMain.handle('fs:readTextFile', async (_event, filePath: string) => {
  try {
    const text = await fs.promises.readFile(filePath, 'utf8');
    return { ok: true as const, text };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
});

ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  try {
    if (!/^https?:\/\//i.test(url)) {
      return { ok: false as const, error: 'URL invalide' };
    }
    await shell.openExternal(url);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
});

// --- Auto-update (GitHub Releases) — meme logique UX que CodeFlow ---
type UpdateCheckResult =
  | { status: 'available'; version: string; releaseNotes: string }
  | { status: 'uptodate'; version: string }
  | { status: 'dev' }
  | { status: 'error'; error: string };

let updaterReady = false;

function releaseNotesOf(info: { releaseNotes?: unknown }) {
  const notes = info.releaseNotes;
  if (typeof notes === 'string') return notes;
  if (Array.isArray(notes)) {
    return notes
      .map((n) => (typeof n === 'string' ? n : n && typeof n === 'object' && 'note' in n ? String((n as { note: unknown }).note ?? '') : ''))
      .filter(Boolean)
      .join('\n');
  }
  return 'Corrections et ameliorations.';
}

async function setupUpdater() {
  if (process.env.VITE_DEV_SERVER_URL) return;
  try {
    const { autoUpdater } = await import('electron-updater');
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('updater:available', {
        version: info.version,
        releaseNotes: releaseNotesOf(info),
      });
    });

    autoUpdater.on('download-progress', (p) => {
      mainWindow?.webContents.send('updater:progress', p.percent);
    });

    autoUpdater.on('update-downloaded', () => {
      mainWindow?.webContents.send('updater:downloaded');
    });

    updaterReady = true;
  } catch (e) {
    console.warn('[PIXLAB] updater unavailable', e);
  }
}

ipcMain.handle('updater:check', async (): Promise<UpdateCheckResult> => {
  if (process.env.VITE_DEV_SERVER_URL) return { status: 'dev' };
  if (!updaterReady) await setupUpdater();
  if (!updaterReady) return { status: 'error', error: 'Updater indisponible' };

  try {
    const { autoUpdater } = await import('electron-updater');
    return await new Promise<UpdateCheckResult>((resolve) => {
      const done = (result: UpdateCheckResult) => {
        autoUpdater.removeListener('update-available', onAvail);
        autoUpdater.removeListener('update-not-available', onNot);
        autoUpdater.removeListener('error', onErr);
        resolve(result);
      };
      const onAvail = (info: { version: string; releaseNotes?: unknown }) => {
        done({
          status: 'available',
          version: info.version,
          releaseNotes: releaseNotesOf(info),
        });
      };
      const onNot = (info: { version: string }) => {
        done({ status: 'uptodate', version: info.version });
      };
      const onErr = (err: Error) => {
        done({ status: 'error', error: err.message || String(err) });
      };
      autoUpdater.once('update-available', onAvail);
      autoUpdater.once('update-not-available', onNot);
      autoUpdater.once('error', onErr);
      void autoUpdater.checkForUpdates().catch((e: unknown) => {
        onErr(e instanceof Error ? e : new Error(String(e)));
      });
    });
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : String(e) };
  }
});

ipcMain.handle('updater:download', async () => {
  try {
    const { autoUpdater } = await import('electron-updater');
    await autoUpdater.downloadUpdate();
  } catch (e) {
    console.warn('[PIXLAB] downloadUpdate', e);
  }
});

ipcMain.handle('updater:quitAndInstall', async () => {
  allowClose = true;
  try {
    const { autoUpdater } = await import('electron-updater');
    autoUpdater.quitAndInstall(false, true);
  } catch {
    app.quit();
  }
});

void setupUpdater();
