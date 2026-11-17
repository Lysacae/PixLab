export type AudioFxState = {
  speed: number;
  reverb: number;
  pitchSemitones: number;
  inSec: number;
  outSec: number;
  loop: boolean;
};

export const DEFAULT_AUDIO_FX: AudioFxState = {
  speed: 1,
  reverb: 0,
  pitchSemitones: 0,
  inSec: 0,
  outSec: 0,
  loop: false,
};

export function emptyWaveform(count = 96): number[] {
  return Array.from({ length: count }, () => 0.06);
}
