<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  type IconName = 'home' | 'collection' | 'add' | 'challenge' | 'settings' | 'back';

  let { name }: { name: IconName } = $props();
</script>

<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
  {#if name === 'home'}
    <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
  {:else if name === 'collection'}
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" />
  {:else if name === 'add'}
    <path d="M12 5v14M5 12h14" />
  {:else if name === 'challenge'}
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 4v5.8M12 14.2V20M4 12h5.8M14.2 12H20" />
  {:else if name === 'settings'}
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  {:else if name === 'back'}
    <path d="m14 6-6 6 6 6" />
  {/if}
</svg>
