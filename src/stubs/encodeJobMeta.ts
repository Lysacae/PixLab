import type { MediaAsset, TimelineClip, TimelineTrack } from '@/stores/types';

export type VideoEncodeMeta = {
  width: number;
  height: number;
  durationSec: number;
  fps: number;
  videoAsset: MediaAsset | null;
  clips: TimelineClip[];
  tracks: TimelineTrack[];
  library: MediaAsset[];
  mutedSource: boolean;
};
