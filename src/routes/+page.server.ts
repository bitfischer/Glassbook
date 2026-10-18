/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { sqlite } from '$lib/server/db';
import { getLensOfTheDay } from '$lib/server/lenses';

const STORY_LENGTH = 280;

function clip(text: string) {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > STORY_LENGTH
    ? trimmed.slice(0, STORY_LENGTH).replace(/\s+\S*$/, '') + '…'
    : trimmed;
}

// The latest dated memory, or else the lens's own notes: the reason to open its page.
function storyFor(lens: NonNullable<ReturnType<typeof getLensOfTheDay>>) {
  const memory = sqlite
    .prepare(
      "SELECT body, event_date AS eventDate FROM lens_entries WHERE lens_id = ? AND type = 'memory' ORDER BY COALESCE(event_date, '') DESC, created_at DESC LIMIT 1"
    )
    .get(lens.id) as { body: string; eventDate: string | null } | undefined;
  if (memory?.body.trim()) return { text: clip(memory.body), date: memory.eventDate };
  if (lens.notes?.trim()) return { text: clip(lens.notes), date: null };
  return null;
}

export const load = () => {
  const summary = sqlite
    .prepare(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN ownership = 'owned' THEN 1 ELSE 0 END) AS owned, COUNT(DISTINCT manufacturer_id) AS manufacturers, COALESCE(SUM(CASE WHEN ownership = 'owned' THEN purchase_price_minor ELSE 0 END), 0) AS valueMinor FROM lenses"
    )
    .get() as { total: number; owned: number; manufacturers: number; valueMinor: number };

  const lensOfTheDay = getLensOfTheDay() ?? null;
  return { lensOfTheDay, story: lensOfTheDay ? storyFor(lensOfTheDay) : null, summary };
};
