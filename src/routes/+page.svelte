<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  import { onMount } from 'svelte';

  let { data } = $props();
  let active = $state(0);
  let manualPaused = $state(false);
  let timer: ReturnType<typeof setTimeout>;
  let progressKey = $state(0);
  const lens = $derived(data.lensOfTheDay);
  const carouselCount = $derived(lens ? Math.max(lens.photoIds.length, 1) : 0);
  const animationPaused = $derived(manualPaused);

  function focal(lens: NonNullable<typeof data.lensOfTheDay>) {
    if (!lens.focalMinMm) return null;
    return lens.focalMaxMm && lens.focalMaxMm !== lens.focalMinMm
      ? lens.focalMinMm + '–' + lens.focalMaxMm + ' mm'
      : lens.focalMinMm + ' mm';
  }

  function scheduleNext() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!animationPaused && carouselCount > 1) {
        active = (active + 1) % carouselCount;
        progressKey += 1;
      }
      scheduleNext();
    }, 10000);
  }

  function goTo(index: number) {
    active = (index + carouselCount) % carouselCount;
    progressKey += 1;
    manualPaused = true;
    scheduleNext();
  }

  function togglePause() {
    manualPaused = !manualPaused;
    if (!manualPaused) progressKey += 1;
    scheduleNext();
  }

  onMount(() => {
    scheduleNext();
    return () => clearTimeout(timer);
  });
</script>

<svelte:head><title>Home · Glassbook</title></svelte:head>

<section class="home-hero">
  <div>
    <p class="eyebrow">Your lens archive</p>
    <h1>Keep the glass<br class="home-hero-break" /> close at hand.</h1>
    <p class="home-intro">A quiet, private place for the lenses you own, use, and remember.</p>
  </div>
  <div class="home-hero-mark aperture-mark" aria-hidden="true"></div>
</section>

<section class="home-section" aria-labelledby="lenses-of-the-day">
  <div class="home-section-heading">
    <div>
      <p class="eyebrow">A fresh view, every visit</p>
      <h2 id="lenses-of-the-day">Lens of the day</h2>
    </div>
  </div>

  {#if lens}
    <div
      class="home-carousel"
      role="region"
      aria-label="Lens of the day photos"
      class:is-paused={animationPaused}
    >
      <div class="home-carousel-track">
        {#each lens.photoIds.length ? lens.photoIds : [null] as photoId, index}
          <a
            class="home-lens-card card"
            class:active={index === active}
            href={'/lenses/' + lens.id}
          >
            <div class="home-lens-cover">
              {#if photoId}
                <img
                  class="home-carousel-image"
                  src={'/images/' + photoId + '/gallery'}
                  alt={lens.manufacturer + ' ' + lens.model}
                  loading="lazy"
                />
              {:else}
                <span class="lens-placeholder aperture-mark" aria-hidden="true"></span>
              {/if}
            </div>
            <div class="home-lens-content">
              <span class="eyebrow">{lens.manufacturer}</span>
              <h3>{lens.model}</h3>
              <div class="meta">
                {#if focal(lens)}<span>{focal(lens)}</span>{/if}
                {#if lens.apertureMin}<span>ƒ/{lens.apertureMin}</span>{/if}
                {#if lens.mount}<span>{lens.mount}</span>{/if}
              </div>
            </div>
          </a>
        {/each}
      </div>
      {#if carouselCount > 1}
        <div class="home-carousel-progress" aria-hidden="true">
          {#key progressKey}<span class:is-paused={animationPaused}></span>{/key}
        </div>
        <button
          class="home-carousel-pause"
          type="button"
          aria-pressed={manualPaused}
          aria-label={manualPaused ? 'Resume carousel animation' : 'Pause carousel animation'}
          onclick={togglePause}>{manualPaused ? 'Resume' : 'Pause'}</button
        >
        <button
          class="home-carousel-control previous"
          type="button"
          onclick={() => goTo(active - 1)}
          aria-label="Previous photo">‹</button
        >
        <button
          class="home-carousel-control next"
          type="button"
          onclick={() => goTo(active + 1)}
          aria-label="Next photo">›</button
        >
        <div class="home-carousel-dots" aria-label="Choose photo">
          {#each lens.photoIds.length ? lens.photoIds : [null], index}
            <button
              class:active={index === active}
              type="button"
              aria-label={'Show photo ' + (index + 1)}
              aria-current={index === active ? 'true' : undefined}
              onclick={() => goTo(index)}
            ></button>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty card">
      <h3>Your archive is waiting.</h3>
      <p class="muted">Add your first lens to start the collection.</p>
      <a class="button" href="/lenses/new">Add a lens</a>
    </div>
  {/if}
</section>
