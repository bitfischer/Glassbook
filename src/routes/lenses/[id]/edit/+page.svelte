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

<svelte:head><title>Edit {data.lens.model} · Glassbook</title></svelte:head>
<div class="page-header">
  <div>
    <p class="eyebrow">{data.lens.manufacturer}</p>
    <h1>Edit {data.lens.model}</h1>
  </div>
</div>
<LensForm
  value={data.lens}
  {form}
  manufacturers={data.manufacturers}
  mounts={data.mounts}
  submitLabel="Save changes"
/>
