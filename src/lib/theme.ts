/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

export function readThemePreference(): Theme {
  if (!browser) {
    return 'light';
  }

  const domTheme = document.documentElement.dataset.theme;
  if (isTheme(domTheme)) {
    return domTheme;
  }

  const storedTheme = readStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  if (!browser) {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures (private mode); the theme still applies for this session.
  }

  document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
}

function readStoredTheme(): Theme | undefined {
  const cookieTheme = readThemeCookie(document.cookie);
  if (cookieTheme) {
    return cookieTheme;
  }

  try {
    const localTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(localTheme) ? localTheme : undefined;
  } catch {
    return undefined;
  }
}

export function readThemeCookie(cookieHeader: string): Theme | undefined {
  const match = cookieHeader.match(/(?:^|;\s*)theme=(light|dark)(?:;|$)/);
  return match && isTheme(match[1]) ? match[1] : undefined;
}
