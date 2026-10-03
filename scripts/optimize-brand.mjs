/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import fs from 'node:fs/promises';
import sharp from 'sharp';

await fs.mkdir('static/brand', { recursive: true });
const source = sharp('Glassbook_Logo.png').trim({ background: '#ffffff', threshold: 12 });
await source
  .clone()
  .resize({ width: 720, withoutEnlargement: true })
  .webp({ quality: 90 })
  .toFile('static/brand/glassbook-logo.webp');
// Crop the symbol from the source so it remains legible at UI sizes.
await sharp('Glassbook_Logo.png')
  .extract({ left: 64, top: 299, width: 423, height: 422 })
  .resize({ width: 160, height: 160, fit: 'contain' })
  .webp({ quality: 90 })
  .toFile('static/brand/glassbook-mark.webp');

await fs.mkdir('static/icons', { recursive: true });

const iconSource = sharp('Glassbook_Logo.png').extract({
  left: 64,
  top: 299,
  width: 423,
  height: 422
});

async function writeAppIcon(filename, size, inset) {
  const markSize = Math.round(size * (1 - inset * 2));
  const mark = await iconSource
    .clone()
    .resize({ width: markSize, height: markSize, fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#080d16'
    }
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(`static/icons/${filename}`);
}

await writeAppIcon('icon-192.png', 192, 0.12);
await writeAppIcon('icon-512.png', 512, 0.12);
await writeAppIcon('icon-maskable-512.png', 512, 0.2);
await writeAppIcon('apple-touch-icon.png', 180, 0.12);
