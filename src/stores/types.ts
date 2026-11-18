export type AppTab = 'video' | 'image' | 'music' | 'render' | 'settings';

export type MediaKind = 'video' | 'image' | 'audio';

export type MediaAsset = {
  id: string;
  kind: MediaKind;
  name: string;
  objectUrl: string;
  durationSec: number;
  width?: number;
  height?: number;
  sampleRate?: number;
  channels?: number;
  thumbUrl?: string | null;
};

export type TimelineTrackId = string;

export type TimelineTrack = {
  id: TimelineTrackId;
  label: string;
  kind: 'video' | 'audio' | 'texte' | 'images';
  locked?: boolean;
};

export type TextStyle = {
  content: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  x: number;
  y: number;
};

/** Position/taille dans la preview (pourcentages 0–100). */
export type ClipLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TimelineMarker = {
  id: string;
  timeSec: number;
  label: string;
};

export type TimelineClip = {
  id: string;
  track: TimelineTrackId;
  label: string;
  startSec: number;
  durationSec: number;
  /** Offset dans le média source (pour cuts réels). */
  sourceOffsetSec?: number;
  assetId?: string;
  muted?: boolean;
  color?: string;
  linkedTo?: string;
  text?: TextStyle;
  /** Transform libre dans la preview (images / video overlays). */
  layout?: ClipLayout;
};

export type VideoTool =
  | 'import'
  | 'crop'
  | 'cut'
  | 'mute'
  | 'addAudio'
  | 'addText'
  | 'addImage';

export type CropRect = { x: number; y: number; w: number; h: number };

export type ImageRatio =
  | '1:1'
  | '4:3'
  | '3:2'
  | '16:9'
  | '9:16'
  | '21:9'
  | '4:5'
  | '2:3'
  | '5:4'
  | 'Libre';

export type RenderSource = 'video' | 'image' | 'music';
export type RenderStatus = 'waiting' | 'running' | 'done' | 'cancelled';

export type RenderJob = {
  id: string;
  projectName: string;
  source: RenderSource;
  status: RenderStatus;
  progress: number;
  format: string;
  durationLabel: string;
  dateLabel: string;
  thumbnailUrl: string | null;
  outputPath: string;
  sourceUrl?: string | null;
  error?: string | null;
  audioFx?: import('@/stubs/audioFx').AudioFxState | null;
  videoMeta?: {
    width: number;
    height: number;
    durationSec: number;
    fps: number;
    videoAsset: MediaAsset | null;
    clips: TimelineClip[];
    tracks: TimelineTrack[];
    library: MediaAsset[];
    mutedSource: boolean;
  } | null;
};

export type VideoExportPreset = {
  id: string;
  label: string;
  format: string;
  width: number;
  height: number;
};

export type ShortcutGroup = 'global' | 'video' | 'image' | 'music';

export type ShortcutAction =
  | 'import'
  | 'render'
  | 'undo'
  | 'redo'
  | 'save'
  | 'settings'
  | 'playPause'
  | 'cut'
  | 'crop'
  | 'mute'
  | 'zoomIn'
  | 'zoomOut'
  | 'addText'
  | 'addImage'
  | 'addAudio'
  | 'upscale'
  | 'autoCrop'
  | 'sendToVideo'
  | 'rename'
  | 'musicCut'
  | 'reverb'
  | 'pitch';

export type ShortcutBinding = {
  action: ShortcutAction;
  group: ShortcutGroup;
  label: string;
  combo: string;
};

export type InspectorTarget =
  | { type: 'text'; clipId: string }
  | { type: 'clip'; clipId: string }
  | { type: 'crop' }
  | null;
