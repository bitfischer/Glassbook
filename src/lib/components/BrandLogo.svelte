<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  // Glassbook identity. The mark is a precise 6-blade iris aperture, echoing the
  // aperture-blade motif used throughout the app; the wordmark is set in the same
  // display serif as the headings. Everything is drawn with currentColor and the
  // --accent token, so the logo adapts to the light and dark themes automatically.
  let {
    variant = 'lockup',
    class: className = ''
  }: {
    variant?: 'lockup' | 'mark';
    class?: string;
  } = $props();
</script>

<span class={`gb-logo gb-logo-${variant} ${className}`}>
  <svg
    class="gb-mark"
    viewBox="0 0 48 48"
    fill="none"
    role={variant === 'mark' ? 'img' : undefined}
    aria-label={variant === 'mark' ? 'Glassbook' : undefined}
    aria-hidden={variant === 'lockup' ? 'true' : undefined}
  >
    <!-- barrel ring -->
    <circle cx="24" cy="24" r="21" class="gb-ring" />
    <!-- iris opening -->
    <path class="gb-iris" d="M30.93 28 L24 32 L17.07 28 L17.07 20 L24 16 L30.93 20 Z" />
    <!-- aperture blades -->
    <g class="gb-blades">
      <path d="M45 24 L30.93 28" />
      <path d="M34.5 42.19 L24 32" />
      <path d="M13.5 42.19 L17.07 28" />
      <path d="M3 24 L17.07 20" />
      <path d="M13.5 5.81 L24 16" />
      <path d="M34.5 5.81 L30.93 20" />
    </g>
  </svg>
  {#if variant === 'lockup'}
    <span class="gb-word">Glassbook</span>
  {/if}
</span>
