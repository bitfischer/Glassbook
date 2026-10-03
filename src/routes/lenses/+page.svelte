<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import LensCardPhotos from '$lib/components/LensCardPhotos.svelte';
  import { onDestroy, tick } from 'svelte';

  let { data } = $props();

  let filtersOpen = $state(false);
  let searchOpen = $state(false);
  let quickSearch = $state('');
  let quickSearchInput = $state<HTMLInputElement>();
  let searchTimer: ReturnType<typeof setTimeout>;
  const currentView = $derived(data.query.view === 'list' ? 'list' : 'grid');
  const dateSortActive = $derived(!data.query.sort || data.query.sort === 'added');
  const dateOrder = $derived(data.query.order === 'asc' ? 'asc' : 'desc');
  const activeFilterCount = $derived(
    [
      data.query.q,
      data.query.manufacturer,
      data.query.ownership,
      data.query.focalType,
      data.query.focal,
      data.query.era
    ].filter(Boolean).length
  );
  const queryHref = (updates: Record<string, string>) => {
    // Local, non-reactive throwaway used only to serialise the query string.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams(
      Object.entries(data.query).flatMap(([key, value]) => (value ? [[key, value]] : []))
    );
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    return `?${params.toString()}`;
  };
  const viewHref = (view: 'grid' | 'list') => queryHref({ view });
  const dateSortHref = () =>
    queryHref({
      sort: 'added',
      order: dateSortActive && dateOrder === 'desc' ? 'asc' : 'desc'
    });

  async function toggleSearch() {
    if (searchOpen) {
      closeSearch();
      return;
    }

    quickSearch = data.query.q ?? '';
    searchOpen = true;
    await tick();
    quickSearchInput?.focus();
  }

  function closeSearch() {
    searchOpen = false;
    quickSearchInput = undefined;
  }

  function commitSearch() {
    clearTimeout(searchTimer);
    void goto(queryHref({ q: quickSearch.trim() }), {
      keepFocus: true,
      noScroll: true,
      replaceState: true
    });
  }

  function scheduleSearch(event: Event) {
    quickSearch = (event.currentTarget as HTMLInputElement).value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      commitSearch();
    }, 250);
  }

  onDestroy(() => clearTimeout(searchTimer));

  function focal(lens: (typeof data.lenses)[number]) {
    if (!lens.focalMinMm) return null;
    return lens.focalMaxMm && lens.focalMaxMm !== lens.focalMinMm
      ? `${lens.focalMinMm}–${lens.focalMaxMm} mm`
      : `${lens.focalMinMm} mm`;
  }

  function era(lens: (typeof data.lenses)[number]) {
    if (lens.releaseYear === null) return null;
    return lens.releaseYear < 2000 ? 'Vintage' : 'Modern';
  }
</script>

<svelte:head><title>Collection · Glassbook</title></svelte:head>

<div class="filter-panel">
  <div class="collection-actions">
    <a href="/lenses/new" class="button">Add lens</a>
    <button
      class="search-toggle ghost"
      type="button"
      aria-expanded={searchOpen}
      aria-controls="quick-search"
      onclick={toggleSearch}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </svg>
      <span class="search-label">Search</span>
    </button>
    {#if searchOpen}
      <input
        id="quick-search"
        class="quick-search"
        type="search"
        aria-label="Search by manufacturer or model"
        placeholder="Manufacturer or model"
        value={quickSearch}
        bind:this={quickSearchInput}
        oninput={scheduleSearch}
        onkeydown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitSearch();
          }
        }}
      />
    {/if}
    <button
      class="filter-toggle ghost"
      type="button"
      aria-expanded={filtersOpen}
      aria-controls="collection-filters"
      onclick={() => (filtersOpen = !filtersOpen)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16M7 12h10M10 18h4" />
      </svg>
      <span class="filter-label">Filters</span>
      {#if activeFilterCount}<span class="filter-count">{activeFilterCount}</span>{/if}
      <span class="filter-chevron" aria-hidden="true">⌄</span>
    </button>
    <div class="view-toggle" role="group" aria-label="Collection view">
      <a class:active={currentView === 'grid'} href={viewHref('grid')}>Grid</a>
      <a class:active={currentView === 'list'} href={viewHref('list')}>List</a>
    </div>
    <a
      class="sort-toggle button ghost"
      href={dateSortHref()}
      aria-label={dateSortActive
        ? `Date added: ${dateOrder === 'desc' ? 'newest first; show oldest first' : 'oldest first; show newest first'}`
        : 'Sort by date added, newest first'}
      title={dateSortActive
        ? `Date added: ${dateOrder === 'desc' ? 'newest first' : 'oldest first'}`
        : 'Sort by date added'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {#if !dateSortActive || dateOrder === 'desc'}
          <path d="M8 5v14m0 0-3-3m3 3 3-3M14 7h5m-5 5h4m-4 5h3" />
        {:else}
          <path d="M8 19V5m0 0L5 8m3-3 3 3M14 7h3m-3 5h4m-4 5h5" />
        {/if}
      </svg>
      <span class="sort-label">
        {dateSortActive ? (dateOrder === 'desc' ? 'Newest' : 'Oldest') : 'Date added'}
      </span>
    </a>
  </div>
  {#if filtersOpen}
    <form id="collection-filters" class="filters card" method="GET" aria-label="Collection filters">
      <input type="hidden" name="view" value={currentView} />
      <input type="hidden" name="order" value={dateOrder} />
      <input type="hidden" name="q" value={data.query.q ?? ''} />
      <label>
        <span class="muted">Manufacturer</span>
        <select name="manufacturer">
          <option value="">All</option>
          {#each data.facets.manufacturers as item}
            <option value={item.name} selected={data.query.manufacturer === item.name}
              >{item.name}</option
            >
          {/each}
        </select>
      </label>
      <label>
        <span class="muted">Ownership</span>
        <select name="ownership">
          <option value="">All</option>
          {#each ['owned', 'sold', 'wishlist', 'borrowed'] as value}
            <option {value} selected={data.query.ownership === value}>{value}</option>
          {/each}
        </select>
      </label>
      <label>
        <span class="muted">Lens type</span>
        <select name="focalType">
          <option value="">All</option>
          <option value="prime" selected={data.query.focalType === 'prime'}>Prime</option>
          <option value="zoom" selected={data.query.focalType === 'zoom'}>Zoom</option>
        </select>
      </label>
      <label>
        <span class="muted">Era</span>
        <select name="era">
          <option value="">All</option>
          <option value="vintage" selected={data.query.era === 'vintage'}>Vintage</option>
          <option value="modern" selected={data.query.era === 'modern'}>Modern</option>
        </select>
      </label>
      <label>
        <span class="muted">Focal length</span>
        <input
          name="focal"
          type="number"
          min="0.1"
          step="0.1"
          placeholder="50"
          value={data.query.focal ?? ''}
        />
      </label>
      <label>
        <span class="muted">Sort</span>
        <select name="sort">
          <option value="added" selected={data.query.sort === 'added'}>Recently added</option>
          <option value="name" selected={data.query.sort === 'name'}>Name</option>
          <option value="era" selected={data.query.sort === 'era'}>Vintage vs Modern</option>
          <option value="year" selected={data.query.sort === 'year'}>Release year</option>
          <option value="weight" selected={data.query.sort === 'weight'}>Weight</option>
          <option value="price" selected={data.query.sort === 'price'}>Purchase price</option>
        </select>
      </label>
      <button type="submit">Apply</button>
    </form>
  {/if}
</div>

{#if data.lenses.length}
  <div class="results-bar">
    <span
      ><strong>{data.lenses.length}</strong>
      {data.lenses.length === 1 ? 'lens' : 'lenses'} shown</span
    >
    <span>{data.summary.total} in archive</span>
  </div>
  {#if currentView === 'grid'}
    <section class="lens-grid" aria-label="Lenses">
      {#each data.lenses as lens}
        <a class="lens-card card" href={`/lenses/${lens.id}`}>
          <div class="lens-cover">
            {#if lens.photoIds.length}
              <LensCardPhotos photoIds={lens.photoIds} />
            {:else}
              <span class="lens-placeholder aperture-mark" aria-hidden="true"></span>
            {/if}
          </div>
          <div class="lens-content">
            <span class="eyebrow">{lens.manufacturer}</span>
            <h2>{lens.model}</h2>
            <div class="lens-chips">
              <span class="badge">{lens.focalType === 'prime' ? 'Prime' : 'Zoom'}</span>
              {#if era(lens)}<span class="badge">{era(lens)}</span>{/if}
            </div>
            <div class="meta">
              {#if focal(lens)}<span>{focal(lens)}</span>{/if}
              {#if lens.apertureMin}<span>ƒ/{lens.apertureMin}</span>{/if}
              {#if lens.mount}<span>{lens.mount}</span>{/if}
            </div>
          </div>
        </a>
      {/each}
    </section>
  {:else}
    <section class="lens-list" aria-label="Lenses">
      {#each data.lenses as lens}
        <a class="lens-row card" href={`/lenses/${lens.id}`}>
          <div class="lens-row-cover">
            {#if lens.coverId}
              <img src={`/images/${lens.coverId}/thumbnail`} alt="" loading="lazy" />
            {:else}
              <span class="lens-placeholder lens-placeholder-small" aria-hidden="true">◉</span>
            {/if}
          </div>
          <div class="lens-row-main">
            <span class="eyebrow">{lens.manufacturer}</span>
            <h2>{lens.model}</h2>
            <div class="lens-chips lens-row-chips">
              <span class="badge">{lens.focalType === 'prime' ? 'Prime' : 'Zoom'}</span>
              {#if era(lens)}<span class="badge">{era(lens)}</span>{/if}
            </div>
            <div class="meta lens-row-meta">
              {#if focal(lens)}<span>{focal(lens)}</span>{/if}
              {#if lens.apertureMin}<span>ƒ/{lens.apertureMin}</span>{/if}
              {#if lens.mount}<span>{lens.mount}</span>{/if}
            </div>
          </div>
          <div class="lens-row-side">
            <span>{lens.releaseYear ?? '—'}</span>
          </div>
        </a>
      {/each}
    </section>
  {/if}
{:else}
  <section class="empty card">
    <h2>No lenses found</h2>
    <p class="muted">
      {data.summary.total ? 'Try changing the filters.' : 'Start by recording your first lens.'}
    </p>
  </section>
{/if}
