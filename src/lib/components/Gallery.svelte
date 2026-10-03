<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  type Photo = { id: number; originalName: string };
  let { photos, alt }: { photos: Photo[]; alt: string } = $props();

  let active = $state(0);
  let lightboxOpen = $state(false);
  let stageButton = $state<HTMLButtonElement | null>(null);
  let closeButton = $state<HTMLButtonElement | null>(null);

  const count = $derived(photos.length);
  const current = $derived(photos[Math.min(active, Math.max(count - 1, 0))]);

  function go(delta: number) {
    if (count === 0) return;
    active = (active + delta + count) % count;
  }
  function select(index: number) {
    active = index;
  }
  function openLightbox() {
    if (count === 0) return;
    lightboxOpen = true;
  }
  function closeLightbox() {
    lightboxOpen = false;
    stageButton?.focus();
  }
  function onKeydown(event: KeyboardEvent) {
    if (!lightboxOpen) return;
    if (event.key === 'Escape') closeLightbox();
    else if (event.key === 'ArrowRight') go(1);
    else if (event.key === 'ArrowLeft') go(-1);
  }

  // Touch swipe in the lightbox
  let touchX = 0;
  function onTouchStart(event: TouchEvent) {
    touchX = event.changedTouches[0].clientX;
  }
  function onTouchEnd(event: TouchEvent) {
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  }

  // Move focus into the dialog and lock body scroll while it is open.
  $effect(() => {
    if (lightboxOpen) {
      closeButton?.focus();
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
  });

  // Preload the neighbouring gallery images for smoother paging.
  $effect(() => {
    if (count < 2) return;
    for (const delta of [1, -1]) {
      const neighbour = photos[(active + delta + count) % count];
      if (neighbour) new Image().src = `/images/${neighbour.id}/gallery`;
    }
  });
</script>

<svelte:window onkeydown={onKeydown} />

{#if count === 0}
  <div class="gallery-empty card">
    <span class="lens-placeholder aperture-mark" aria-hidden="true"></span>
    <p class="muted">No photos yet. Add the first photo of this lens below.</p>
  </div>
{:else}
  <div class="gallery">
    <div class="gallery-stage card">
      <button
        bind:this={stageButton}
        type="button"
        class="gallery-stage-button"
        onclick={openLightbox}
        aria-label="Open photo full screen"
      >
        <img src={`/images/${current.id}/gallery`} {alt} />
      </button>
      {#if count > 1}
        <button
          class="gallery-nav prev"
          type="button"
          onclick={() => go(-1)}
          aria-label="Previous photo">‹</button
        >
        <button class="gallery-nav next" type="button" onclick={() => go(1)} aria-label="Next photo"
          >›</button
        >
        <div class="gallery-counter" aria-live="polite">{active + 1} / {count}</div>
      {/if}
    </div>

    {#if count > 1}
      <div class="gallery-strip" aria-label="Photo thumbnails">
        {#each photos as photo, index}
          <button
            type="button"
            class="gallery-thumb"
            class:active={index === active}
            aria-current={index === active ? 'true' : undefined}
            aria-label={`Show photo ${index + 1}`}
            onclick={() => select(index)}
          >
            <img src={`/images/${photo.id}/thumbnail`} alt="" loading="lazy" />
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if lightboxOpen}
    <div
      class="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      tabindex="-1"
      ontouchstart={onTouchStart}
      ontouchend={onTouchEnd}
    >
      <button
        bind:this={closeButton}
        class="lightbox-close"
        type="button"
        onclick={closeLightbox}
        aria-label="Close viewer">✕</button
      >
      {#if count > 1}
        <button
          class="lightbox-nav prev"
          type="button"
          onclick={() => go(-1)}
          aria-label="Previous photo">‹</button
        >
        <button
          class="lightbox-nav next"
          type="button"
          onclick={() => go(1)}
          aria-label="Next photo">›</button
        >
      {/if}
      <img class="lightbox-image" src={`/images/${current.id}/gallery`} {alt} />
      <div class="lightbox-footer">
        <span class="lightbox-counter" aria-live="polite">{active + 1} / {count}</span>
        <a
          class="lightbox-original"
          href={`/images/${current.id}/original`}
          target="_blank"
          rel="noreferrer">View original</a
        >
      </div>
    </div>
  {/if}
{/if}
