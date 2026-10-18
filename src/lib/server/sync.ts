/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { createHash } from 'node:crypto';
import type { LensPhotoView } from '$lib/catalogue-types';
import { SNAPSHOT_FORMAT, type Snapshot } from '$lib/offline/snapshot';
import { getDailyChallenge, localChallengeDay } from '$lib/server/challenges';
import { sqlite } from '$lib/server/db';
import { listLensEntries } from '$lib/server/lens-entries';
import { getLensOfTheDay, listLenses } from '$lib/server/lenses';

export function buildSnapshot(user: Snapshot['user']): Snapshot {
  const lenses = listLenses(new URLSearchParams());
  // Opening the app online picks today's lens and challenge; syncing does the same so that the
  // offline copy always has them.
  const today = getLensOfTheDay();
  const challengeDay = localChallengeDay();
  const day = sqlite
    .prepare('SELECT day, lens_id AS lensId FROM daily_lenses ORDER BY day DESC LIMIT 1')
    .get() as { day: string; lensId: number } | undefined;

  return {
    format: SNAPSHOT_FORMAT,
    user,
    manufacturers: (
      sqlite.prepare('SELECT name FROM manufacturers ORDER BY name COLLATE NOCASE').all() as {
        name: string;
      }[]
    ).map((row) => row.name),
    mounts: (
      sqlite.prepare('SELECT name FROM mounts ORDER BY name COLLATE NOCASE').all() as {
        name: string;
      }[]
    ).map((row) => row.name),
    lenses,
    photos: sqlite
      .prepare(
        `SELECT id, lens_id AS lensId, original_name AS originalName, width, height, position,
          is_cover AS isCover FROM lens_photos ORDER BY lens_id, position, id`
      )
      .all() as LensPhotoView[],
    entries: lenses.flatMap((lens) => listLensEntries(lens.id)),
    dailyLens: today && day ? { day: day.day, lensId: day.lensId } : null,
    dailyChallenge: { day: challengeDay, challenge: getDailyChallenge(challengeDay) }
  };
}

export function snapshotEtag(body: string): string {
  return `"${createHash('sha1').update(body).digest('hex')}"`;
}
