<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  import LensForm from '$lib/components/LensForm.svelte';
  let { data, form } = $props();
</script>

<svelte:head><title>Add a lens · Glassbook</title></svelte:head>
<div class="page-header">
  <div>
    <p class="eyebrow">Collection</p>
    <h1>Add a lens</h1>
  </div>
</div>
<LensForm
  value={{ currency: data.defaultCurrency }}
  {form}
  manufacturers={data.manufacturers}
  mounts={data.mounts}
  submitLabel="Add lens"
/>
