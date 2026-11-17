import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/cursors');
fs.mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const o = y * (width * 4 + 1) + 1 + x * 4;
      raw[o] = rgba[i];
      raw[o + 1] = rgba[i + 1];
      raw[o + 2] = rgba[i + 2];
      raw[o + 3] = rgba[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function make(size, plot) {
  const rgba = Buffer.alloc(size * size * 4);
  const set = (x, y, hex, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    rgba[i] = parseInt(hex.slice(1, 3), 16);
    rgba[i + 1] = parseInt(hex.slice(3, 5), 16);
    rgba[i + 2] = parseInt(hex.slice(5, 7), 16);
    rgba[i + 3] = a;
  };
  plot(set);
  return png(size, size, rgba);
}

const ink = '#05040A';
const parchment = '#F5EFE0';
const ivory = '#E8DCC8';

const arrow = make(16, (set) => {
  const pts = [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10],
    [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9],
    [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7],
    [3, 3], [3, 4], [3, 5], [3, 6], [3, 10],
    [4, 4], [4, 5], [4, 9], [4, 10],
    [5, 5], [5, 8], [5, 9],
    [6, 6], [6, 7], [6, 8],
    [7, 7], [7, 8],
  ];
  for (const [x, y] of pts) set(x, y, ink);
  const fill = [
    [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8],
    [2, 3], [2, 4], [2, 5], [2, 6],
    [3, 4], [3, 5],
    [4, 5],
  ];
  for (const [x, y] of fill) set(x, y, parchment);
});

const ibeam = make(16, (set) => {
  for (let x = 4; x <= 10; x++) {
    set(x, 1, ink);
    set(x, 13, ink);
  }
  for (let y = 1; y <= 13; y++) set(7, y, ink);
  for (let y = 2; y <= 12; y++) set(7, y, parchment);
});

const loupe = make(16, (set) => {
  for (let y = 2; y <= 9; y++) {
    for (let x = 2; x <= 9; x++) {
      const dx = x - 5.5;
      const dy = y - 5.5;
      const d = dx * dx + dy * dy;
      if (d >= 9 && d <= 16) set(x, y, ink);
      if (d < 9) set(x, y, ivory);
    }
  }
  for (let i = 0; i < 5; i++) {
    set(10 + i, 10 + i, ink);
    set(11 + i, 10 + i, parchment);
  }
});

fs.writeFileSync(path.join(outDir, 'arrow.png'), arrow);
fs.writeFileSync(path.join(outDir, 'ibeam.png'), ibeam);
fs.writeFileSync(path.join(outDir, 'loupe.png'), loupe);
console.log('cursors written');
