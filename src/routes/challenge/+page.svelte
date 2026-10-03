<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import {
    composeChallenge,
    challengeDimensions,
    type ChallengeDimension,
    type PhotographyChallenge
  } from '$lib/challenges';
  let { data } = $props();
  function initialChallenge() {
    return data.dailyChallenge as PhotographyChallenge;
  }
  let challenge = $state<PhotographyChallenge>(initialChallenge());
  let daily = $state(true);
  let spinning = $state(false);
  let turns = $state(0);
  let locked = new SvelteSet<ChallengeDimension>();
  let announcement = $state('');
  const labels: Record<ChallengeDimension, string> = {
    subject: 'Subject',
    technique: 'Technique',
    style: 'Style',
    focalLength: 'Focal length',
    lighting: 'Light',
    constraint: 'Constraint'
  };
  function toggleLock(dimension: ChallengeDimension) {
    if (locked.has(dimension)) locked.delete(dimension);
    else locked.add(dimension);
  }
  function spin() {
    if (spinning) return;
    spinning = true;
    turns += 1;
    const fixed = Object.fromEntries(
      challengeDimensions.filter((key) => locked.has(key)).map((key) => [key, challenge[key]])
    );
    const seed = `${Date.now()}:${crypto.getRandomValues(new Uint32Array(1))[0]}`;
    const result = composeChallenge(seed, data.lenses, fixed);
    window.setTimeout(
      () => {
        challenge = result;
        daily = false;
        spinning = false;
        announcement = `New challenge: photograph ${result.subject.label} in a ${result.style.label} style.`;
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1150
    );
  }
  function showDaily() {
    challenge = data.dailyChallenge;
    daily = true;
    announcement = 'Showing the challenge of the day.';
  }
</script>

<svelte:head
  ><title>Photography Challenge · Glassbook</title><meta
    name="description"
    content="Spin for a creative photography idea tailored to your lens collection."
  /></svelte:head
>
<div class="challenge-page">
  <header class="challenge-header">
    <div>
      <p class="eyebrow">A reason to go out and look</p>
      <h1>
        <span class="challenge-title-full">Photography challenge</span>
        <span class="challenge-title-compact">Challenge</span>
      </h1>
      <p>Let chance choose the subject. You bring the point of view.</p>
    </div>
    {#if !daily}<button class="ghost" type="button" onclick={showDaily}
        >Return to today’s challenge</button
      >{/if}
  </header>
  <div class="challenge-layout">
    <section class="wheel-panel card" aria-labelledby="wheel-title">
      <p class="eyebrow">{daily ? 'Challenge of the day' : 'Free spin'}</p>
      <h2 id="wheel-title">Spin the idea wheel</h2>
      <div class="wheel-wrap">
        <span class="wheel-pointer" aria-hidden="true"></span>
        <div class="challenge-wheel" class:spinning style={`--turns:${turns}`} aria-hidden="true">
          <div class="wheel-center">GB</div>
        </div>
      </div>
      <button class="button spin-button" type="button" onclick={spin} disabled={spinning}
        >{spinning ? 'Spinning…' : 'Spin a new challenge'}</button
      >
      <p class="muted wheel-note">
        Locked ingredients stay in place. Free spins never replace today’s challenge.
      </p>
    </section>
    <section class="challenge-result card" aria-labelledby="result-title" aria-busy={spinning}>
      <p class="eyebrow">{daily ? 'Today’s brief' : 'Your new brief'}</p>
      <h2 id="result-title">Photograph {challenge.subject.label.toLowerCase()}.</h2>
      <p class="challenge-intro">
        Use <strong>{challenge.technique.label.toLowerCase()}</strong> with a
        <strong>{challenge.style.label.toLowerCase()}</strong>
        feeling. Work at <strong>{challenge.focalLength.label}</strong> in
        <strong>{challenge.lighting.label.toLowerCase()}</strong>.
      </p>
      <div class="challenge-ingredients">
        {#each challengeDimensions as dimension}
          <article>
            <div><span>{labels[dimension]}</span><strong>{challenge[dimension].label}</strong></div>
            <button
              class="lock-button"
              class:locked={locked.has(dimension)}
              type="button"
              aria-pressed={locked.has(dimension)}
              aria-label={`${locked.has(dimension) ? 'Unlock' : 'Lock'} ${labels[dimension]}`}
              onclick={() => toggleLock(dimension)}
              >{locked.has(dimension) ? 'Locked' : 'Lock'}</button
            >
          </article>
        {/each}
      </div>
      <aside class="challenge-rule">
        <span>Creative rule</span><strong>{challenge.constraint.label}</strong>
        <p>{challenge.constraint.hint}</p>
      </aside>
      <div class="lens-match">
        <span>Glass to reach for</span>{#if challenge.matchingLenses.length}<p>
            {challenge.matchingLenses.map((lens) => lens.name).join(' · ')}
          </p>{:else}<p>
            No owned lens covers {challenge.focalLength.label}; treat it as an invitation to
            improvise.
          </p>{/if}
      </div>
    </section>
  </div>
  <p class="sr-only" aria-live="polite">{announcement}</p>
</div>
