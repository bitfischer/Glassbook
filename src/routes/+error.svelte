<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  import { page } from '$app/state';
  import { connection } from '$lib/offline/connection.svelte';
</script>

<section class="card stack">
  {#if connection.offline && page.status !== 404}
    <p class="eyebrow">Offline</p>
    <h1>This page needs the server</h1>
    <p>
      Browsing the collection works offline. Editing, settings and exports are available again when
      Glassbook can reach the server.
    </p>
    <p><a class="button" href="/lenses">Back to the collection</a></p>
  {:else}
    <p class="eyebrow">{page.status}</p>
    <h1>{page.status === 404 ? 'Not found' : 'Something went wrong'}</h1>
    <p>{page.error?.message}</p>
    <p><a class="button" href="/">Back home</a></p>
  {/if}
</section>
