<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  import BrandLogo from '$lib/components/BrandLogo.svelte';

  let { form } = $props();
</script>

<svelte:head><title>Set up Glassbook</title></svelte:head>

<section class="auth-card card">
  <BrandLogo variant="lockup" class="auth-logo" />
  <p class="eyebrow">First run</p>
  <h1>Create your account</h1>
  <p class="muted">This installation supports one private collection and one account.</p>
  {#if form?.message}<p class="error-banner" role="alert">{form.message}</p>{/if}
  <form method="POST" class="stack">
    <label>
      Username
      <input
        name="username"
        autocomplete="username"
        required
        value={form?.values?.username ?? ''}
      />
      {#if form?.errors?.username}<span class="field-error">{form.errors.username[0]}</span>{/if}
    </label>
    <label>
      Password
      <input name="password" type="password" autocomplete="new-password" minlength="5" required />
      {#if form?.errors?.password}<span class="field-error">{form.errors.password[0]}</span>{/if}
    </label>
    <label>
      Confirm password
      <input
        name="confirmPassword"
        type="password"
        autocomplete="new-password"
        minlength="5"
        required
      />
      {#if form?.errors?.confirmPassword}
        <span class="field-error">{form.errors.confirmPassword[0]}</span>
      {/if}
    </label>
    <button type="submit">Create account</button>
  </form>
</section>
