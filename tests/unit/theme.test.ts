/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import { describe, expect, it } from 'vitest';
import { isTheme, readThemeCookie } from '../../src/lib/theme';

describe('theme helpers', () => {
  it('accepts only the supported theme values', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('sepia')).toBe(false);
  });

  it('reads the theme from a cookie header', () => {
    expect(readThemeCookie('theme=dark; other=value')).toBe('dark');
    expect(readThemeCookie('other=value; theme=light')).toBe('light');
    expect(readThemeCookie('other=value')).toBeUndefined();
  });
});
