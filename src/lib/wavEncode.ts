import type { AudioFxState } from '@/stubs/audioFx';

function makeImpulse(ctx: OfflineAudioContext, seconds = 1.6, decay = 2.4): AudioBuffer {
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

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

/** Encode AudioBuffer → WAV PCM 16-bit stereo/mono. */
export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const headerSize = 44;
  const ab = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(ab);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i] ?? 0));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return ab;
}

export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Applique IN/OUT + vitesse + pitch + reverb et rend un WAV. */
export async function renderMusicToWav(
  sourceUrl: string,
  fx: AudioFxState,
): Promise<{ base64: string; durationSec: number }> {
  const res = await fetch(sourceUrl);
  const arr = await res.arrayBuffer();
  const probe = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await probe.decodeAudioData(arr.slice(0));
  } finally {
    await probe.close();
  }

  const inSec = Math.max(0, Math.min(fx.inSec, decoded.duration - 0.01));
  const outSec = Math.max(inSec + 0.05, Math.min(fx.outSec, decoded.duration));
  const sliceDur = outSec - inSec;
  const speed = Math.max(0.25, Math.min(4, fx.speed || 1));
  const outDur = sliceDur / speed;
  const sampleRate = decoded.sampleRate;
  const channels = Math.min(2, decoded.numberOfChannels);
  const frames = Math.max(1, Math.ceil(outDur * sampleRate));
  const offline = new OfflineAudioContext(channels, frames, sampleRate);

  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.playbackRate.value = speed;
  // Compense pitch vitesse + knob
  source.detune.value = -1200 * Math.log2(speed) + (fx.pitchSemitones || 0) * 100;

  const dry = offline.createGain();
  const wet = offline.createGain();
  const conv = offline.createConvolver();
  conv.buffer = makeImpulse(offline);
  const wetAmt = Math.max(0, Math.min(1, (fx.reverb || 0) / 100));
  wet.gain.value = wetAmt * 0.85;
  dry.gain.value = 1 - wetAmt * 0.35;

  source.connect(dry);
  source.connect(conv);
  conv.connect(wet);
  dry.connect(offline.destination);
  wet.connect(offline.destination);

  source.start(0, inSec, sliceDur);
  const rendered = await offline.startRendering();
  const wav = audioBufferToWav(rendered);
  return { base64: arrayBufferToBase64(wav), durationSec: rendered.duration };
}
