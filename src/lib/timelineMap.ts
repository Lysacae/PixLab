import type { TimelineClip } from '@/stores/types';

/** Clip vidéo actif à un temps timeline, avec temps source correspondant. */
export function mapTimelineToVideoSource(
  clips: TimelineClip[],
  timelineSec: number,
  videoTrackId = 'video',
): { clip: TimelineClip; sourceSec: number } | null {
  const videoClips = clips
    .filter((c) => c.track === videoTrackId)
    .sort((a, b) => a.startSec - b.startSec);

  for (const clip of videoClips) {
    const end = clip.startSec + clip.durationSec;
    if (timelineSec >= clip.startSec && timelineSec < end - 0.0001) {
      const sourceSec = (clip.sourceOffsetSec ?? 0) + (timelineSec - clip.startSec);
      return { clip, sourceSec };
    }
  }
  return null;
}

/** Découpe un clip (et ses liés audio) au playhead. */
export function splitClipAt(
  clips: TimelineClip[],
  clipId: string,
  atTimelineSec: number,
  newId: () => string,
): TimelineClip[] | null {
  const clip = clips.find((c) => c.id === clipId);
  if (!clip) return null;
  if (atTimelineSec <= clip.startSec + 0.05 || atTimelineSec >= clip.startSec + clip.durationSec - 0.05) {
    return null;
  }

  const leftDur = atTimelineSec - clip.startSec;
  const rightDur = clip.durationSec - leftDur;
  const src = clip.sourceOffsetSec ?? 0;

  const left: TimelineClip = { ...clip, durationSec: leftDur };
  const rightId = newId();
  const right: TimelineClip = {
    ...clip,
    id: rightId,
    startSec: atTimelineSec,
    durationSec: rightDur,
    sourceOffsetSec: src + leftDur,
  };

  let next = clips.map((c) => (c.id === clipId ? left : c));
  next = [...next, right];

  // Split linked audio clips similarly
  const linked = clips.filter((c) => c.linkedTo === clipId);
  for (const audio of linked) {
    const aLeftDur = leftDur;
    const aRight: TimelineClip = {
      ...audio,
      id: newId(),
      startSec: atTimelineSec,
      durationSec: rightDur,
      sourceOffsetSec: (audio.sourceOffsetSec ?? 0) + aLeftDur,
      linkedTo: rightId,
    };
    next = next.map((c) =>
      c.id === audio.id ? { ...c, durationSec: aLeftDur } : c,
    );
    next.push(aRight);
  }

  return next;
}
