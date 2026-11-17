/** Extrait des pics d’amplitude (0–1) : fort = haut, faible = bas. */
export async function extractWaveformFromUrl(url: string, bars = 180): Promise<number[]> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const ctx = new AudioContext();
  try {
    const audio = await ctx.decodeAudioData(buf.slice(0));
    const channel = audio.getChannelData(0);
    const block = Math.max(1, Math.floor(channel.length / bars));
    const raw: number[] = [];
    let maxPeak = 0.0001;

    for (let i = 0; i < bars; i++) {
      const start = i * block;
      const end = Math.min(channel.length, start + block);
      let peak = 0;
      let sumSq = 0;
      const n = Math.max(1, end - start);
      for (let j = start; j < end; j++) {
        const v = Math.abs(channel[j]);
        if (v > peak) peak = v;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / n);
      // Combine peak + RMS for readable music waveform
      const amp = peak * 0.65 + rms * 0.35;
      raw.push(amp);
      if (amp > maxPeak) maxPeak = amp;
    }

    // Normalize so loudest ≈ 1, quiet ≈ near 0 (never invert)
    return raw.map((v) => {
      const n = v / maxPeak;
      // Gentle curve keeps quiet parts visible but lower
      return Math.max(0.02, Math.min(1, Math.pow(n, 0.85)));
    });
  } finally {
    await ctx.close();
  }
}
