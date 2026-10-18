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

  const sinceLabel = $derived.by(() => {
    if (!lens) return '';
    if (lens.purchaseDate) return `In the collection since ${lens.purchaseDate.slice(0, 4)}`;
    return `Added ${new Date(lens.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
  });

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

<section class="home-feature" aria-labelledby="lens-of-the-day">
  <h1 id="lens-of-the-day">Lens of the day</h1>
  {#if lens}<p class="home-context">{sinceLabel}</p>{/if}

  {#if lens}
    <article class="home-feature-card card">
      <div
        class="home-stage"
        data-swipe-navigation-exempt
        role="region"
        aria-label="Lens of the day photos"
        class:is-paused={animationPaused}
      >
        <div class="home-slides">
          {#each lens.photoIds.length ? lens.photoIds : [null] as photoId, index}
            <a
              class="home-slide"
              class:active={index === active}
              href={'/lenses/' + lens.id}
              aria-label={photoId ? undefined : `${lens.manufacturer} ${lens.model}`}
              tabindex={index === active ? undefined : -1}
              aria-hidden={index === active ? undefined : 'true'}
            >
              {#if photoId}
                <img
                  src={'/images/' + photoId + '/gallery'}
                  alt={lens.manufacturer + ' ' + lens.model}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              {:else}
                <span class="lens-placeholder aperture-mark" aria-hidden="true"></span>
              {/if}
            </a>
          {/each}
        </div>
        {#if carouselCount > 1}
          <div class="home-progress" aria-hidden="true">
            {#key progressKey}<span class:is-paused={animationPaused}></span>{/key}
          </div>
          <button
            class="home-arrow previous"
            type="button"
            onclick={() => goTo(active - 1)}
            aria-label="Previous photo">‹</button
          >
          <button
            class="home-arrow next"
            type="button"
            onclick={() => goTo(active + 1)}
            aria-label="Next photo">›</button
          >
          <div class="home-dots" role="group" aria-label="Choose photo">
            {#each lens.photoIds, index}
              <button
                class:active={index === active}
                type="button"
                aria-label={'Show photo ' + (index + 1)}
                aria-current={index === active ? 'true' : undefined}
                onclick={() => goTo(index)}
              ></button>
            {/each}
            <button
              class="home-pause"
              type="button"
              aria-pressed={manualPaused}
              aria-label={manualPaused ? 'Resume carousel animation' : 'Pause carousel animation'}
              onclick={togglePause}>{manualPaused ? 'Resume' : 'Pause'}</button
            >
          </div>
        {/if}
      </div>
      <div class="home-body">
        <p class="eyebrow">{lens.manufacturer}</p>
        <h2>{lens.model}</h2>
        <div class="meta">
          {#if focal(lens)}<span>{focal(lens)}</span>{/if}
          {#if lens.apertureMin}<span>ƒ/{lens.apertureMin}</span>{/if}
          {#if lens.mount}<span>{lens.mount}</span>{/if}
        </div>
        {#if data.story}
          <figure class="home-story">
            <blockquote>{data.story.text}</blockquote>
            {#if data.story.date}<figcaption>{data.story.date}</figcaption>{/if}
          </figure>
        {:else}
          <p class="home-prompt">
            Nothing written about this lens yet.
            <a href={'/lenses/' + lens.id + '#journal-heading'}>Add a memory</a>
          </p>
        {/if}
        <a class="button quiet-on-phone" href={'/lenses/' + lens.id}>Open lens</a>
      </div>
    </article>
  {:else}
    <div class="empty card">
      <h2>Your archive is waiting.</h2>
      <p class="muted">Add your first lens to start the collection.</p>
      <a class="button" href="/lenses/new">Add a lens</a>
    </div>
  {/if}
</section>
