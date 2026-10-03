/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createGzip } from 'node:zlib';
import tar from 'tar-stream';
import { paths } from '$lib/server/config';
import { sqlite } from '$lib/server/db';

export const GET = async () => {
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  const snapshot = path.join(paths.backups, `glassbook-${stamp}.db`);
  await sqlite.backup(snapshot);
  const pack = tar.pack();
  const gzip = createGzip({ level: 6 });
  pack.pipe(gzip);
  pack.on('error', (cause) => gzip.destroy(cause));
  gzip.on('close', () => void fs.rm(snapshot, { force: true }));

  void (async () => {
    try {
      pack.entry(
        { name: 'manifest.json', mode: 0o600 },
        JSON.stringify({
          format: 'glassbook-backup',
          version: 1,
          createdAt: new Date().toISOString()
        })
      );
      pack.entry({ name: 'glassbook.db', mode: 0o600 }, await fs.readFile(snapshot));
      const names = await fs.readdir(paths.originals);
      for (const name of names) {
        const filename = path.join(paths.originals, name);
        const stat = await fs.stat(filename);
        if (stat.isFile()) {
          pack.entry({ name: `originals/${name}`, mode: 0o600 }, await fs.readFile(filename));
        }
      }
      pack.finalize();
    } catch (cause) {
      pack.destroy(cause as Error);
      await fs.rm(snapshot, { force: true });
    }
  })();

  const stream = Readable.toWeb(gzip, {
    strategy: { highWaterMark: 64 * 1024 }
  }) as ReadableStream;
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="glassbook-backup-${stamp}.tar.gz"`,
      'Cache-Control': 'no-store'
    }
  });
};
