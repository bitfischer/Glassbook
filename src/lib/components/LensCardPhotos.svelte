<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  let { photoIds }: { photoIds: number[] } = $props();

  let active = $state(0);
  function updateActive(event: Event) {
    const viewport = event.currentTarget as HTMLDivElement;
    if (viewport.clientWidth) active = Math.round(viewport.scrollLeft / viewport.clientWidth);
  }

  function forwardVerticalWheel(event: WheelEvent) {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    window.scrollBy({ top: event.deltaY, behavior: 'instant' });
  }
</script>

<div
  class="lens-card-gallery"
  role="group"
  aria-label={`${photoIds.length} lens photos`}
  onscroll={updateActive}
  onwheel={forwardVerticalWheel}
>
  {#each photoIds as photoId}
    <img src={`/images/${photoId}/thumbnail`} alt="" loading="lazy" draggable="false" />
  {/each}
</div>

{#if photoIds.length > 1}
  <div class="lens-card-gallery-position" aria-hidden="true">
    {#each photoIds as photoId}
      <span class:active={photoId === photoIds[active]}></span>
    {/each}
  </div>
  <span class="sr-only" aria-live="polite">Photo {active + 1} of {photoIds.length}</span>
{/if}
