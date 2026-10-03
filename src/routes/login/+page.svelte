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

<svelte:head><title>Log in · Glassbook</title></svelte:head>

<div class="login-screen">
  <div class="login-backdrop" aria-hidden="true">
    <span class="focus-ring ring-one"></span>
    <span class="focus-ring ring-two"></span>
    <span class="focus-ring ring-three"></span>
  </div>

  <section class="auth-card card login-card">
    <BrandLogo variant="lockup" class="login-logo" />
    {#if form?.message}<p class="error-banner" role="alert">{form.message}</p>{/if}
    <form method="POST" class="stack login-form">
      <label>
        <span>Username</span>
        <input name="username" autocomplete="username" required value={form?.username ?? ''} />
      </label>
      <label>
        <span>Password</span>
        <input name="password" type="password" autocomplete="current-password" required />
      </label>
      <button type="submit">Log in</button>
    </form>
  </section>
</div>
