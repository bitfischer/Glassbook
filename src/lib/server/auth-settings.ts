/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { config } from '$lib/server/config';
import { sqlite } from '$lib/server/db';

const AUTH_ENABLED_KEY = 'auth_enabled';

export function isAuthenticationEnabled(): boolean {
  const setting = sqlite
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(AUTH_ENABLED_KEY) as { value: string } | undefined;
  return setting ? setting.value === 'true' : config.authEnabledByDefault;
}

export function setAuthenticationEnabled(enabled: boolean): void {
  sqlite
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(AUTH_ENABLED_KEY, String(enabled));
}
