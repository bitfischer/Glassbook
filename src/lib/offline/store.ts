/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { SNAPSHOT_FORMAT, type Snapshot } from '$lib/offline/snapshot';

export type StoredMirror = { etag: string; syncedAt: number; snapshot: Snapshot };

const DATABASE = 'glassbook-mirror';
const STORE = 'mirror';
const KEY = 'current';

let memory: StoredMirror | null | undefined;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, act: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = act(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

// The whole mirror is one record, so a sync replaces it atomically and readers never see a mix.
export async function readMirror(): Promise<StoredMirror | null> {
  if (memory !== undefined) return memory;
  try {
    const stored = (await run('readonly', (store) => store.get(KEY))) as StoredMirror | undefined;
    memory = stored?.snapshot?.format === SNAPSHOT_FORMAT ? stored : null;
  } catch {
    memory = null;
  }
  return memory;
}

export async function writeMirror(mirror: StoredMirror): Promise<void> {
  await run('readwrite', (store) => store.put(mirror, KEY));
  memory = mirror;
}

export async function clearMirror(): Promise<void> {
  memory = null;
  try {
    await run('readwrite', (store) => store.clear());
  } catch {
    // Nothing to clear.
  }
}
