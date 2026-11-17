/** Web Audio preview engine: speed, pitch (detune) and simple reverb. */

function makeImpulse(ctx: AudioContext, seconds = 1.8, decay = 2.2): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

export type AudioEngineParams = {
  speed: number;
  pitchSemitones: number;
  reverb: number; // 0–100
};

export class MusicPreviewEngine {
  private ctx: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private startedAt = 0;
  private offsetSec = 0;
  private playing = false;
  private params: AudioEngineParams = { speed: 1, pitchSemitones: 0, reverb: 0 };
  private url: string | null = null;
  private onEnded: (() => void) | null = null;

  async load(url: string) {
    if (this.url === url && this.buffer) return;
    this.stop(false);
    this.url = url;
    const ctx = this.ensureCtx();
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    this.buffer = await ctx.decodeAudioData(arr.slice(0));
  }

  private ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  getDuration() {
    return this.buffer?.duration ?? 0;
  }

  isPlaying() {
    return this.playing;
  }

  getCurrentTime() {
    if (!this.playing || !this.ctx) return this.offsetSec;
    const speed = Math.max(0.25, this.params.speed);
    return this.offsetSec + (this.ctx.currentTime - this.startedAt) * speed;
  }

  private applyRateAndPitch() {
    if (!this.source) return;
    const speed = Math.max(0.25, Math.min(4, this.params.speed));
    this.source.playbackRate.value = speed;
    // Compense le pitch de playbackRate + applique le knob pitch
    const compensate = -1200 * Math.log2(speed);
    this.source.detune.value = compensate + this.params.pitchSemitones * 100;
  }

  setParams(params: Partial<AudioEngineParams>) {
    this.params = { ...this.params, ...params };
    this.applyRateAndPitch();
    this.applyReverbMix();
  }

  private applyReverbMix() {
    if (!this.dryGain || !this.wetGain) return;
    const wet = Math.max(0, Math.min(1, this.params.reverb / 100));
    this.wetGain.gain.value = wet * 0.85;
    this.dryGain.gain.value = 1 - wet * 0.35;
  }

  async play(fromSec: number, onEnded?: () => void) {
    if (!this.buffer) return;
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    this.stop(false);
    this.onEnded = onEnded ?? null;

    const source = ctx.createBufferSource();
    source.buffer = this.buffer;
    this.source = source;
    this.applyRateAndPitch();

    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx);

    source.connect(dry);
    source.connect(conv);
    conv.connect(wet);
    dry.connect(ctx.destination);
    wet.connect(ctx.destination);

    this.dryGain = dry;
    this.wetGain = wet;
    this.convolver = conv;
    this.applyReverbMix();

    const start = Math.max(0, Math.min(fromSec, this.buffer.duration - 0.01));
    this.offsetSec = start;
    this.startedAt = ctx.currentTime;
    this.playing = true;

    source.onended = () => {
      if (!this.playing) return;
      this.playing = false;
      this.offsetSec = this.getCurrentTime();
      this.source = null;
      this.onEnded?.();
    };

    source.start(0, start);
  }

  pause() {
    if (!this.playing) return;
    const t = this.getCurrentTime();
    this.stop(false);
    this.offsetSec = t;
  }

  setOffset(sec: number) {
    this.offsetSec = Math.max(0, sec);
  }

  seek(sec: number) {
    const was = this.playing;
    const ended = this.onEnded;
    this.offsetSec = Math.max(0, sec);
    if (was) void this.play(this.offsetSec, ended ?? undefined);
  }

  stop(resetOffset = true) {
    this.playing = false;
    try {
      this.source?.stop();
    } catch {
      /* already stopped */
    }
    this.source?.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
    this.convolver?.disconnect();
    this.source = null;
    this.dryGain = null;
    this.wetGain = null;
    this.convolver = null;
    if (resetOffset) this.offsetSec = 0;
  }

  dispose() {
    this.stop(true);
    void this.ctx?.close();
    this.ctx = null;
    this.buffer = null;
    this.url = null;
  }
}
