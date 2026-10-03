/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureImageDerivatives, originalExtension } from '../../src/lib/server/image-derivatives';

const temporaryDirectories: string[] = [];

async function temporaryDirectory() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'glassbook-images-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true }))
  );
});

describe('image derivative recovery', () => {
  it.each([
    ['jpeg', 'image/jpeg', 'jpg'],
    ['png', 'image/png', 'png'],
    ['webp', 'image/webp', 'webp']
  ] as const)('rebuilds missing %s derivatives', async (format, mime, extension) => {
    const directory = await temporaryDirectory();
    const sourcePipeline = sharp({
      create: { width: 1200, height: 800, channels: 3, background: '#c06040' }
    });
    const source = await sourcePipeline[format]().toBuffer();
    const destinations = {
      gallery: path.join(directory, 'gallery', 'photo.webp'),
      thumbnail: path.join(directory, 'thumbnails', 'photo.webp')
    };

    expect(originalExtension(mime)).toBe(extension);
    await expect(ensureImageDerivatives(source, destinations)).resolves.toBe(2);

    const [gallery, thumbnail] = await Promise.all([
      sharp(destinations.gallery).metadata(),
      sharp(destinations.thumbnail).metadata()
    ]);
    expect(gallery).toMatchObject({ format: 'webp', width: 1200, height: 800 });
    expect(thumbnail).toMatchObject({ format: 'webp', width: 640, height: 480 });
    await expect(ensureImageDerivatives(source, destinations)).resolves.toBe(0);
  });

  it('repairs only the missing variant', async () => {
    const directory = await temporaryDirectory();
    const source = await sharp({
      create: { width: 100, height: 100, channels: 3, background: '#204060' }
    })
      .png()
      .toBuffer();
    const destinations = {
      gallery: path.join(directory, 'gallery.webp'),
      thumbnail: path.join(directory, 'thumbnail.webp')
    };

    await ensureImageDerivatives(source, destinations);
    await fs.rm(destinations.thumbnail);
    await expect(ensureImageDerivatives(source, destinations)).resolves.toBe(1);
    await expect(fs.stat(destinations.gallery)).resolves.toBeDefined();
    await expect(fs.stat(destinations.thumbnail)).resolves.toBeDefined();
  });

  it('rejects corrupt originals and unsupported stored MIME types', async () => {
    const directory = await temporaryDirectory();
    await expect(
      ensureImageDerivatives(Buffer.from('not an image'), {
        gallery: path.join(directory, 'gallery.webp'),
        thumbnail: path.join(directory, 'thumbnail.webp')
      })
    ).rejects.toThrow();
    expect(() => originalExtension('image/gif')).toThrow('Unsupported stored image type');
  });
});
