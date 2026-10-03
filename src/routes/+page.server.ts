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

export const load = () => {
  const summary = sqlite
    .prepare(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN ownership = 'owned' THEN 1 ELSE 0 END) AS owned, COUNT(DISTINCT manufacturer_id) AS manufacturers, COALESCE(SUM(CASE WHEN ownership = 'owned' THEN purchase_price_minor ELSE 0 END), 0) AS valueMinor FROM lenses"
    )
    .get() as { total: number; owned: number; manufacturers: number; valueMinor: number };

  return { lensOfTheDay: getLensOfTheDay() ?? null, summary };
};
