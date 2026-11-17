import { useLibraryStore } from './libraryStore';
import { useProjectStore } from './projectStore';

const KEY = 'pixlab.project.v1';

export type SavedProject = {
  version: 1;
  savedAt: string;
  projectName: string;
  tracks: ReturnType<typeof useProjectStore.getState>['tracks'];
  clips: ReturnType<typeof useProjectStore.getState>['clips'];
  crop: ReturnType<typeof useProjectStore.getState>['crop'];
  mutedSource: boolean;
  imageScale: 2 | 4;
  imageRatio: ReturnType<typeof useProjectStore.getState>['imageRatio'];
  outputName: string;
  audioFx: ReturnType<typeof useProjectStore.getState>['audioFx'];
  library: {
    id: string;
    kind: 'video' | 'image' | 'audio';
    name: string;
    durationSec: number;
    width?: number;
    height?: number;
    sampleRate?: number;
    channels?: number;
  }[];
  /** objectUrls ne sont pas persistés — l’utilisateur réimporte si besoin */
  note: string;
};

export function serializeProject(): SavedProject {
  const p = useProjectStore.getState();
  const lib = useLibraryStore.getState().items;
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    projectName: p.projectName,
    tracks: p.tracks,
    clips: p.clips,
    crop: p.crop,
    mutedSource: p.mutedSource,
    imageScale: p.imageScale,
    imageRatio: p.imageRatio,
    outputName: p.outputName,
    audioFx: p.audioFx,
    library: lib.map(({ id, kind, name, durationSec, width, height, sampleRate, channels }) => ({
      id,
      kind,
      name,
      durationSec,
      width,
      height,
      sampleRate,
      channels,
    })),
    note: 'Medias binaires non inclus : reimporter les fichiers si necessaire.',
  };
}

export function saveProjectLocal(): void {
  const data = serializeProject();
  localStorage.setItem(KEY, JSON.stringify(data));
  useProjectStore.getState().markClean();
}

export function loadProjectLocal(): boolean {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as SavedProject;
    useProjectStore.setState({
      projectName: data.projectName || 'Sans_titre',
      tracks: data.tracks?.length ? data.tracks : useProjectStore.getState().tracks,
      clips: data.clips ?? [],
      crop: data.crop ?? useProjectStore.getState().crop,
      mutedSource: !!data.mutedSource,
      imageScale: data.imageScale ?? 2,
      imageRatio: data.imageRatio ?? '16:9',
      outputName: data.outputName ?? 'sortie_x2.png',
      audioFx: data.audioFx ?? useProjectStore.getState().audioFx,
      dirty: false,
      playing: false,
      currentTime: 0,
    });
    return true;
  } catch {
    return false;
  }
}

export function downloadProjectFile(): void {
  const data = serializeProject();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.projectName || 'projet'}.pxl.json`;
  a.click();
  URL.revokeObjectURL(url);
  useProjectStore.getState().markClean();
}
