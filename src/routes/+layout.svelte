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
  import NavIcon from '$lib/components/NavIcon.svelte';
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

  const pathname = $derived(page.url.pathname);
  const isFormRoute = $derived(
    pathname === '/lenses/new' || /^\/lenses\/\d+\/edit$/.test(pathname)
  );
  const backLink = $derived.by(() => {
    const edit = pathname.match(/^\/lenses\/(\d+)\/edit$/);
    if (edit) return { href: `/lenses/${edit[1]}`, label: 'Back to lens' };
    if (pathname === '/lenses/new' || /^\/lenses\/\d+$/.test(pathname)) {
      return { href: '/lenses', label: 'Back to collection' };
    }
    return undefined;
  });

  function inHorizontalScroller(target: Element) {
    for (let el: Element | null = target; el && el.tagName !== 'MAIN'; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 1) {
        const overflowX = getComputedStyle(el).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') return true;
      }
    }
    return false;
  }

  function startsOnInteractiveElement(target: EventTarget | null) {
    return (
      target instanceof Element &&
      (Boolean(
        target.closest(
          'button, input, select, textarea, label, summary, [data-swipe-navigation-exempt]'
        )
      ) ||
        inHorizontalScroller(target))
    );
  }

  function startSwipe(event: TouchEvent) {
    const touch = event.touches[0];
    if (!touch || !primaryPages.includes(page.url.pathname)) return;
    if (startsOnInteractiveElement(event.target)) return;
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
      <div class="topbar-left">
        {#if backLink}
          <a
            class="button ghost small theme-toggle topbar-back"
            href={backLink.href}
            aria-label={backLink.label}><NavIcon name="back" /></a
          >
        {/if}
        <a class="brand" href="/" aria-label="Glassbook home">
          <BrandLogo variant="lockup" class="brand-logo" />
          <BrandLogo variant="mark" class="brand-logo-compact" />
        </a>
      </div>
      {#if summary}
        <div class="topbar-center">
          <section class="topbar-chips" aria-label="Collection summary">
            <div class="topbar-chip"><strong>{summary.total}</strong><span>Lenses</span></div>
            {#if summary.owned !== summary.total}
              <div class="topbar-chip"><strong>{summary.owned}</strong><span>Owned</span></div>
            {/if}
            <div class="topbar-chip">
              <strong>{summary.manufacturers}</strong><span>Makers</span>
            </div>
          </section>
        </div>
      {/if}
      <div class="topbar-navigation">
        <a href="/lenses/new" class="button ghost small topbar-add-lens">Add lens</a>
        <a
          class="button ghost small theme-toggle topbar-settings"
          href="/settings"
          aria-label="Settings"
          aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
          ><NavIcon name="settings" /></a
        >
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
    <nav class="main-nav" class:form-route={isFormRoute} aria-label="Main navigation">
      <a
        href="/"
        class:active={pathname === '/'}
        aria-current={pathname === '/' ? 'page' : undefined}
        ><NavIcon name="home" /><span>Home</span></a
      >
      <a
        href="/lenses"
        class:active={pathname.startsWith('/lenses')}
        aria-current={pathname.startsWith('/lenses') ? 'page' : undefined}
        ><NavIcon name="collection" /><span>Collection</span></a
      >
      <a class="nav-add" href="/lenses/new" aria-label="Add lens"
        ><span class="nav-add-disc"><NavIcon name="add" /></span><span>Add</span></a
      >
      <a
        href="/challenge"
        class:active={pathname.startsWith('/challenge')}
        aria-current={pathname.startsWith('/challenge') ? 'page' : undefined}
        ><NavIcon name="challenge" /><span>Challenge</span></a
      >
      <a
        class="nav-settings"
        href="/settings"
        class:active={pathname.startsWith('/settings')}
        aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
        ><NavIcon name="settings" /><span>Settings</span></a
      >
    </nav>
    <main
      class:form-main={isFormRoute}
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
{:else}
  <main class="auth-main">{@render children()}</main>
{/if}
