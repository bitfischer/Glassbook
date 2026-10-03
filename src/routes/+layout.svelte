<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { tick } from 'svelte';
  import '../app.css';
  import BrandLogo from '$lib/components/BrandLogo.svelte';
  import { applyTheme, readThemePreference, type Theme } from '$lib/theme';

  let { data, children } = $props();

  let theme = $state<Theme>('light');
  let themeSynced = $state(false);
  let swipeStart = $state<{ x: number; y: number } | undefined>();
  let pageTransition = $state<'idle' | 'leaving' | 'entering'>('idle');
  let slideDirection = $state<'forward' | 'back'>('forward');
  const primaryPages = ['/', '/lenses', '/challenge', '/settings'];

  $effect(() => {
    if (themeSynced) {
      return;
    }

    themeSynced = true;
    theme = readThemePreference();
    applyTheme(theme);
  });

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
  }

  function primaryPageIndex(pathname: string) {
    if (pathname.startsWith('/lenses')) return 1;
    if (pathname.startsWith('/challenge')) return 2;
    if (pathname.startsWith('/settings')) return 3;
    return 0;
  }

  function startsOnInteractiveElement(target: EventTarget | null) {
    return (
      target instanceof Element &&
      Boolean(
        target.closest(
          'button, input, select, textarea, label, summary, [data-swipe-navigation-exempt]'
        )
      )
    );
  }

  function startSwipe(event: TouchEvent) {
    const touch = event.touches[0];
    if (!touch || startsOnInteractiveElement(event.target)) return;
    swipeStart = { x: touch.clientX, y: touch.clientY };
  }

  async function navigateBySwipe(destination: string, direction: 'forward' | 'back') {
    if (pageTransition !== 'idle') return;

    slideDirection = direction;
    pageTransition = 'leaving';
    await new Promise((resolve) => setTimeout(resolve, 140));
    await goto(destination);
    pageTransition = 'entering';
    await tick();
    setTimeout(() => {
      pageTransition = 'idle';
    }, 240);
  }

  function finishSwipe(event: TouchEvent) {
    const touch = event.changedTouches[0];
    if (!swipeStart || !touch) return;

    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;
    swipeStart = undefined;

    if (Math.abs(deltaX) < 72 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) return;

    const currentIndex = primaryPageIndex(page.url.pathname);
    const nextIndex = currentIndex + (deltaX < 0 ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= primaryPages.length) return;

    void navigateBySwipe(primaryPages[nextIndex], deltaX < 0 ? 'forward' : 'back');
  }

  const summary = $derived(
    'summary' in page.data
      ? (page.data.summary as {
          total: number;
          owned: number;
          manufacturers: number;
        })
      : undefined
  );
</script>

<svelte:head>
  <title>Glassbook</title>
  <meta
    name="description"
    content="A private, self-hosted catalogue for your camera lens collection."
  />
</svelte:head>

{#if data.user}
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="/" aria-label="Glassbook home">
        <BrandLogo variant="lockup" class="brand-logo" />
        <BrandLogo variant="mark" class="brand-logo-compact" />
      </a>
      {#if page.url.pathname === '/' || summary}
        <div class="topbar-center">
          {#if page.url.pathname === '/'}
            <div class="topbar-context">
              <strong>Private collection</strong>
              <span>A working record of the glass you own, use, and remember.</span>
            </div>
          {/if}
          {#if summary}
            <section class="topbar-chips" aria-label="Collection summary">
              <div class="topbar-chip"><strong>{summary.total}</strong><span>Lenses</span></div>
              <div class="topbar-chip"><strong>{summary.owned}</strong><span>Owned</span></div>
              <div class="topbar-chip">
                <strong>{summary.manufacturers}</strong><span>Makers</span>
              </div>
            </section>
          {/if}
        </div>
      {/if}
      <div class="topbar-navigation">
        {#if page.url.pathname !== '/'}
          <a href="/lenses/new" class="button small topbar-add-lens">Add lens</a>
        {/if}
        <button
          class="ghost small theme-toggle"
          type="button"
          onclick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
    <main
      class:collection-main={page.url.pathname === '/' || page.url.pathname.startsWith('/lenses')}
      class:page-leaving={pageTransition === 'leaving'}
      class:page-entering={pageTransition === 'entering'}
      class:page-forward={slideDirection === 'forward'}
      class:page-back={slideDirection === 'back'}
      ontouchstart={startSwipe}
      ontouchend={finishSwipe}
      ontouchcancel={() => (swipeStart = undefined)}
    >
      {@render children()}
    </main>
  </div>
  <nav class="main-nav" aria-label="Main navigation">
    <a
      href="/"
      class:active={page.url.pathname === '/'}
      aria-current={page.url.pathname === '/' ? 'page' : undefined}>Home</a
    >
    <a
      href="/lenses"
      class:active={page.url.pathname.startsWith('/lenses')}
      aria-current={page.url.pathname.startsWith('/lenses') ? 'page' : undefined}>Collection</a
    >
    <a
      href="/challenge"
      class:active={page.url.pathname.startsWith('/challenge')}
      aria-current={page.url.pathname.startsWith('/challenge') ? 'page' : undefined}>Challenge</a
    >
    <a
      href="/settings"
      class:active={page.url.pathname.startsWith('/settings')}
      aria-current={page.url.pathname.startsWith('/settings') ? 'page' : undefined}>Settings</a
    >
  </nav>
{:else}
  <main class="auth-main">{@render children()}</main>
{/if}
