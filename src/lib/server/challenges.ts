/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { randomBytes } from 'node:crypto';
import {
  challengeCatalogue,
  composeChallenge,
  type MatchingLens,
  type PhotographyChallenge
} from '$lib/challenges';
import { sqlite } from '$lib/server/db';
export function localChallengeDay(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
export function ownedChallengeLenses(): MatchingLens[] {
  return sqlite
    .prepare(
      `SELECT l.id, m.name || ' ' || l.model AS name, l.focal_min_mm AS focalMinMm, COALESCE(l.focal_max_mm, l.focal_min_mm) AS focalMaxMm FROM lenses l JOIN manufacturers m ON m.id = l.manufacturer_id WHERE l.ownership = 'owned' AND l.focal_min_mm IS NOT NULL ORDER BY m.name COLLATE NOCASE, l.model COLLATE NOCASE`
    )
    .all() as MatchingLens[];
}
export function getDailyChallenge(day = localChallengeDay()): PhotographyChallenge {
  return sqlite.transaction(() => {
    const row = sqlite
      .prepare('SELECT challenge_json AS challengeJson FROM daily_challenges WHERE day = ?')
      .get(day) as { challengeJson: string } | undefined;
    if (row) return JSON.parse(row.challengeJson) as PhotographyChallenge;
    const challenge = composeChallenge(
      `${day}:${randomBytes(12).toString('hex')}`,
      ownedChallengeLenses()
    );
    sqlite
      .prepare('INSERT INTO daily_challenges (day, challenge_json, created_at) VALUES (?, ?, ?)')
      .run(day, JSON.stringify(challenge), Date.now());
    return challenge;
  })();
}
export function challengePageData() {
  return {
    dailyChallenge: getDailyChallenge(),
    catalogue: challengeCatalogue,
    lenses: ownedChallengeLenses()
  };
}
