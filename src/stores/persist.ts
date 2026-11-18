import { useLibraryStore } from './libraryStore';
import { useProjectStore } from './projectStore';

const KEY = 'pixlab.project.v1';

export type SavedProject = {
  version: 2;
  kind: 'pixlab-project';
  savedAt: string;
  projectName: string;
  videoWidth: number;
  videoHeight: number;
  videoFps: number;
  videoExportFormat: string;
  tracks: ReturnType<typeof useProjectStore.getState>['tracks'];
  clips: ReturnType<typeof useProjectStore.getState>['clips'];
  markers: ReturnType<typeof useProjectStore.getState>['markers'];
  crop: ReturnType<typeof useProjectStore.getState>['crop'];
  mutedSource: boolean;
  imageScale: 2 | 4;
  imageRatio: ReturnType<typeof useProjectStore.getState>['imageRatio'];
  outputName: string;
  audioFx: ReturnType<typeof useProjectStore.getState>['audioFx'];
  timelineMinSec: number;
  library: {
    id: string;
    kind: 'video' | 'image' | 'audio';
    name: string;
    durationSec: number;
    width?: number;
    height?: number;
    sampleRate?: number;
    channels?: number;
    /** data URL base64 — inclus dans .pxl pour relancer le projet */
    dataUrl?: string | null;
  }[];
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function serializeProject(includeMedia = true): Promise<SavedProject> {
  const p = useProjectStore.getState();
  const lib = useLibraryStore.getState().items;
  const library: SavedProject['library'] = [];
  for (const item of lib) {
    let dataUrl: string | null = null;
    if (includeMedia && item.objectUrl) {
      try {
        const res = await fetch(item.objectUrl);
        dataUrl = await blobToDataUrl(await res.blob());
      } catch {
        dataUrl = null;
      }
    }
    library.push({
      id: item.id,
      kind: item.kind,
      name: item.name,
      durationSec: item.durationSec,
      width: item.width,
      height: item.height,
      sampleRate: item.sampleRate,
      channels: item.channels,
      dataUrl,
    });
  }
  return {
    version: 2,
    kind: 'pixlab-project',
    savedAt: new Date().toISOString(),
    projectName: p.projectName,
    videoWidth: p.videoWidth,
    videoHeight: p.videoHeight,
    videoFps: p.videoFps,
    videoExportFormat: p.videoExportFormat,
    tracks: p.tracks,
    clips: p.clips,
    markers: p.markers,
    crop: p.crop,
    mutedSource: p.mutedSource,
    imageScale: p.imageScale,
    imageRatio: p.imageRatio,
    outputName: p.outputName,
    audioFx: p.audioFx,
    timelineMinSec: p.timelineMinSec,
    library,
  };
}

export function saveProjectLocal(): void {
  void serializeProject(false).then((data) => {
    localStorage.setItem(KEY, JSON.stringify({ ...data, library: data.library.map(({ dataUrl: _d, ...rest }) => rest) }));
    useProjectStore.getState().markClean();
  });
}

export function loadProjectLocal(): boolean {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as SavedProject;
    applySavedProject(data, false);
    return true;
  } catch {
    return false;
  }
}

function applySavedProject(data: SavedProject, restoreMedia: boolean) {
  useProjectStore.setState({
    projectName: data.projectName || 'Sans_titre',
    tracks: data.tracks?.length ? data.tracks : useProjectStore.getState().tracks,
    clips: data.clips ?? [],
    markers: data.markers ?? [],
    crop: data.crop ?? useProjectStore.getState().crop,
    mutedSource: !!data.mutedSource,
    imageScale: data.imageScale ?? 2,
    imageRatio: data.imageRatio ?? '16:9',
    outputName: data.outputName ?? 'sortie_x2.png',
    audioFx: data.audioFx ?? useProjectStore.getState().audioFx,
    videoWidth: data.videoWidth ?? 1920,
    videoHeight: data.videoHeight ?? 1080,
    videoFps: data.videoFps ?? 30,
    videoExportFormat: data.videoExportFormat ?? 'MP4 1080p',
    timelineMinSec: data.timelineMinSec ?? 60,
    dirty: false,
    playing: false,
    currentTime: 0,
    videoAsset: null,
    imageAsset: null,
    musicAsset: null,
  });

  if (restoreMedia && data.library?.length) {
    const items = data.library.map((l) => ({
      id: l.id,
      kind: l.kind,
      name: l.name,
      objectUrl: l.dataUrl || '',
      durationSec: l.durationSec,
      width: l.width,
      height: l.height,
      sampleRate: l.sampleRate,
      channels: l.channels,
    }));
    useLibraryStore.setState({ items: items.filter((i) => i.objectUrl) });
    const p = useProjectStore.getState();
    const vid = items.find((i) => i.kind === 'video' && i.objectUrl);
    const img = items.find((i) => i.kind === 'image' && i.objectUrl);
    const aud = items.find((i) => i.kind === 'audio' && i.objectUrl);
    if (vid) p.setVideoAsset(vid);
    if (img) p.setImageAsset(img);
    if (aud) void p.setMusicAsset(aud);
  }
}

/** Sauvegarde un vrai fichier .pxl (JSON + medias embeds). */
export async function saveProjectToPxlFile(): Promise<string | null> {
  const data = await serializeProject(true);
  const json = JSON.stringify(data);
  const api = window.pixlab;
  const defaultName = `${data.projectName || 'projet'}.pxl`;
  if (api?.pickSaveFile && api.writeFile) {
    const path = await api.pickSaveFile({
      defaultPath: defaultName,
      filters: [{ name: 'Projet PIXLAB', extensions: ['pxl'] }],
    });
    if (!path) return null;
    const finalPath = path.toLowerCase().endsWith('.pxl') ? path : `${path}.pxl`;
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const written = await api.writeFile(finalPath, b64);
    if (!written.ok) throw new Error(written.error);
    useProjectStore.getState().markClean();
    return finalPath;
  }
  // Fallback navigateur
  const blob = new Blob([json], { type: 'application/x-pixlab-project' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
  useProjectStore.getState().markClean();
  return defaultName;
}

export async function openProjectFromPxlFile(): Promise<boolean> {
  const api = window.pixlab;
  if (api?.pickOpenFile) {
    const path = await api.pickOpenFile({
      filters: [{ name: 'Projet PIXLAB', extensions: ['pxl'] }],
    });
    if (!path) return false;
    const raw = await api.readTextFile?.(path);
    if (!raw?.ok) return false;
    const data = JSON.parse(raw.text) as SavedProject;
    if (data.kind !== 'pixlab-project' && data.version < 1) return false;
    applySavedProject(data, true);
    return true;
  }
  // Fallback input file
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pxl,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(false);
        return;
      }
      try {
        const text = await file.text();
        const data = JSON.parse(text) as SavedProject;
        applySavedProject(data, true);
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    input.click();
  });
}

/** @deprecated use saveProjectToPxlFile */
export function downloadProjectFile(): void {
  void saveProjectToPxlFile();
}
