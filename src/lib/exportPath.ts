import { useUiStore } from '@/stores/uiStore';
import type { RenderSource } from '@/stores/types';

function sanitizeName(name: string) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim() || 'export';
}

function extFor(source: RenderSource, format: string) {
  if (source === 'image') return 'png';
  if (source === 'music') return 'wav';
  const f = format.toLowerCase();
  if (f.includes('webm')) return 'webm';
  return 'mp4';
}

/** Resolve destination file path (asks user or uses fixed folder). Returns null if cancelled. */
export async function resolveExportFilePath(opts: {
  projectName: string;
  source: RenderSource;
  format: string;
  /** Nom de fichier souhaité (ex. NOM DE SORTIE image). */
  fileName?: string | null;
}): Promise<string | null> {
  const api = window.pixlab;
  const { exportPathMode, exportDir, setExportDir } = useUiStore.getState();
  const rawName = (opts.fileName || opts.projectName || 'export').replace(/\.[^.]+$/, '');
  const baseName = sanitizeName(rawName);
  const ext = extFor(opts.source, opts.format);
  const defaultDir =
    exportDir || (api ? await api.getDefaultExportDir() : 'C:\\Users\\Public\\PIXLAB\\exports');
  const defaultFile = api
    ? await api.pathJoin(defaultDir, `${baseName}.${ext}`)
    : `${defaultDir}\\${baseName}.${ext}`;

  if (!api) {
    // Navigateur : chemin logique seulement
    return defaultFile;
  }

  if (exportPathMode === 'ask') {
    const picked = await api.pickSaveFile({
      defaultPath: defaultFile,
      filters:
        opts.source === 'image'
          ? [{ name: 'Image PNG', extensions: ['png'] }]
          : opts.source === 'music'
            ? [{ name: 'Audio WAV', extensions: ['wav'] }]
            : [{ name: 'Video', extensions: ['mp4', 'webm'] }],
    });
    if (!picked) return null;
    // Mémorise le dossier parent pour le mode « même chemin »
    const parts = picked.replace(/\//g, '\\').split('\\');
    parts.pop();
    const parent = parts.join('\\');
    if (parent) setExportDir(parent);
    return picked;
  }

  await api.ensureDir(defaultDir);
  return defaultFile;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function writeExportFromUrl(
  filePath: string,
  objectUrl: string | null,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const api = window.pixlab;
  if (!api) return { ok: false, error: 'API Electron indisponible' };
  if (!objectUrl) {
    await api.ensureDir(filePath.includes('\\') ? filePath.split('\\').slice(0, -1).join('\\') : '.');
    return { ok: false, error: 'Aucune source a exporter' };
  }
  try {
    const res = await fetch(objectUrl);
    const blob = await res.blob();
    const base64 = await blobToBase64(blob);
    return api.writeFile(filePath, base64);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
