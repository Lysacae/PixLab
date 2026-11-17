import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const sources = [
  'C:\\Users\\lysac\\.cursor\\projects\\c-Users-lysac-Documents-Project-Netto\\assets\\icon-ffaf41e0-0dc4-4e60-9908-78ffcc187813.png',
  path.join(root, 'public', 'icon.png'),
  path.join(root, 'build', 'icon.png'),
];

const src = sources.find((p) => fs.existsSync(p));
if (!src) {
  console.error('No source icon found');
  process.exit(1);
}

const size = 512;
const { data, info } = await sharp(src)
  .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const out = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Fond noir pur / quasi noir → transparent (garde la cartouche)
  const nearBlack = lum < 18 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8;
  out[i] = r;
  out[i + 1] = g;
  out[i + 2] = b;
  out[i + 3] = nearBlack ? 0 : a || 255;
}

const png = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toBuffer();

const targets = [
  path.join(root, 'build', 'icon.png'),
  path.join(root, 'public', 'icon.png'),
];
for (const t of targets) {
  fs.mkdirSync(path.dirname(t), { recursive: true });
  fs.writeFileSync(t, png);
  console.log('wrote', t, `(from ${src})`);
}

console.log('done');
