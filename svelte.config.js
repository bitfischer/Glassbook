/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ out: 'build' }),
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'img-src': ['self', 'data:'],
        'style-src': ['self', 'unsafe-inline'],
        'script-src': ['self'],
        'font-src': ['self'],
        'frame-ancestors': ['none']
      }
    }
  }
};
