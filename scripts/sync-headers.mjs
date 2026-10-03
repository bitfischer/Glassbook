/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

/**
 * Keeps the licence header on every source file in sync with package.json.
 *
 * Adds the header where it is missing and rewrites the @version line where it
 * has drifted, so bumping the version in package.json is the only edit a
 * release needs.
 *
 * Usage:
 *   node scripts/sync-headers.mjs           update files in place
 *   node scripts/sync-headers.mjs --check   report drift, change nothing
 */

import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const YEAR = '2026';
const AUTHOR = 'bitfischer.de';

// src/app.html is excluded on purpose: a comment there is served with every page.
const PATTERNS = [
  'src/**/*.{ts,svelte,css}',
  'scripts/*.mjs',
  'tests/**/*.ts',
  '{drizzle,vite}.config.ts',
  '{eslint,svelte}.config.js'
];

const lines = [
  'Glassbook',
  `Copyright ${YEAR} ${AUTHOR}`,
  '',
  `@author  ${AUTHOR}`,
  `@version ${version}`,
  '@license MIT'
];

const render = (open, prefix, close) =>
  `${open}\n${lines.map((l) => (l ? `${prefix}${l}` : prefix.trimEnd())).join('\n')}\n${close}\n`;

const headerFor = (file) =>
  file.endsWith('.svelte') ? render('<!--', '  ', '-->') : render('/**', ' * ', ' */');

const check = process.argv.includes('--check');
const files = PATTERNS.flatMap((pattern) => globSync(pattern, { cwd: root })).sort();

const added = [];
const updated = [];

for (const file of files) {
  const path = resolve(root, file);
  const source = readFileSync(path, 'utf8');

  if (!source.includes('@license MIT')) {
    added.push(file);
    if (!check) writeFileSync(path, `${headerFor(file)}\n${source}`);
    continue;
  }

  const synced = source.replace(/@version\s+\S+/, `@version ${version}`);
  if (synced !== source) {
    updated.push(file);
    if (!check) writeFileSync(path, synced);
  }
}

const drifted = [...added, ...updated];

if (check) {
  if (drifted.length) {
    console.error(`Licence headers are out of sync with package.json (${version}):`);
    for (const file of added) console.error(`  missing header  ${file}`);
    for (const file of updated) console.error(`  stale @version  ${file}`);
    console.error('\nRun `npm run headers:sync` to fix.');
    process.exit(1);
  }
  console.log(`${files.length} source files carry an up-to-date header (${version}).`);
} else {
  console.log(
    `${files.length} source files checked: ${added.length} header(s) added, ${updated.length} @version line(s) updated.`
  );
}
