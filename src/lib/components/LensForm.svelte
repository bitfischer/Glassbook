<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  import { conditions, focalTypes, ownerships, priceFromMinor } from '$lib/domain';

  let {
    value = {},
    form,
    manufacturers = [],
    mounts = [],
    submitLabel = 'Save lens'
  }: {
    value?: Record<string, unknown>;
    form?: {
      values?: Record<string, unknown>;
      errors?: Record<string, string[] | undefined>;
      message?: string;
    } | null;
    manufacturers?: { name: string }[];
    mounts?: { name: string }[];
    submitLabel?: string;
  } = $props();

  const field = (name: string, fallback: unknown = '') =>
    form?.values?.[name] ?? value[name] ?? fallback;
  const error = (name: string) => form?.errors?.[name]?.[0];
  const inferredFocalType = () =>
    value.focalMaxMm !== undefined &&
    value.focalMaxMm !== null &&
    value.focalMaxMm !== value.focalMinMm
      ? 'zoom'
      : 'prime';
  let focalType = $state(String(field('focalType', inferredFocalType())));
</script>

{#if form?.message}<p class="error-banner" role="alert">{form.message}</p>{/if}
<form method="POST" class="lens-form card">
  <section class="form-section">
    <h2>Identity</h2>
    <label>
      Manufacturer *
      <input name="manufacturer" list="manufacturers" required value={field('manufacturer')} />
      <datalist id="manufacturers">
        {#each manufacturers as item}<option value={item.name}></option>{/each}
      </datalist>
      {#if error('manufacturer')}<span class="field-error">{error('manufacturer')}</span>{/if}
    </label>
    <label>
      Model *
      <input name="model" required value={field('model')} />
      {#if error('model')}<span class="field-error">{error('model')}</span>{/if}
    </label>
    <label>
      Mount
      <input name="mount" list="mounts" value={field('mount')} />
      <datalist id="mounts">
        {#each mounts as item}<option value={item.name}></option>{/each}
      </datalist>
    </label>
    <label>
      Serial number
      <input name="serialNumber" value={field('serialNumber')} />
    </label>
    <label>
      Release year
      <input name="releaseYear" type="number" min="1800" max="2200" value={field('releaseYear')} />
      {#if error('releaseYear')}<span class="field-error">{error('releaseYear')}</span>{/if}
    </label>
  </section>

  <section class="form-section">
    <h2>Optics</h2>
    <label>
      Lens type *
      <select name="focalType" bind:value={focalType}>
        {#each focalTypes as option}
          <option value={option}>
            {option === 'prime'
              ? 'Prime lens — fixed focal length'
              : 'Zoom lens — variable focal length'}
          </option>
        {/each}
      </select>
    </label>
    {#if focalType === 'prime'}
      <label>
        Focal length (mm) *
        <input
          name="focalMinMm"
          type="number"
          min="0.1"
          step="0.1"
          required
          value={field('focalMinMm')}
        />
        {#if error('focalMinMm')}<span class="field-error">{error('focalMinMm')}</span>{/if}
      </label>
    {:else}
      <label>
        Minimum focal length (mm) *
        <input
          name="focalMinMm"
          type="number"
          min="0.1"
          step="0.1"
          required
          value={field('focalMinMm')}
        />
        {#if error('focalMinMm')}<span class="field-error">{error('focalMinMm')}</span>{/if}
      </label>
      <label>
        Maximum focal length (mm) *
        <input
          name="focalMaxMm"
          type="number"
          min="0.1"
          step="0.1"
          required
          value={field('focalMaxMm')}
        />
        {#if error('focalMaxMm')}<span class="field-error">{error('focalMaxMm')}</span>{/if}
      </label>
    {/if}
    <label>
      Maximum aperture
      <input name="apertureMin" placeholder="1.4" value={field('apertureMin')} />
    </label>
    <label>
      Minimum aperture
      <input name="apertureMax" placeholder="16" value={field('apertureMax')} />
    </label>
    <label>
      Elements
      <input name="elements" type="number" min="0" value={field('elements')} />
    </label>
    <label>
      Groups
      <input name="groups" type="number" min="0" value={field('groups')} />
    </label>
  </section>

  <section class="form-section">
    <h2>Physical details</h2>
    <label>
      Weight (g)
      <input name="weightGrams" type="number" min="0" value={field('weightGrams')} />
    </label>
    <label>
      Length (mm)
      <input name="lengthMm" type="number" min="0" value={field('lengthMm')} />
    </label>
    <label>
      Diameter (mm)
      <input name="diameterMm" type="number" min="0" value={field('diameterMm')} />
    </label>
    <label>
      Filter thread (mm)
      <input name="filterThreadMm" type="number" min="0" value={field('filterThreadMm')} />
    </label>
  </section>

  <section class="form-section">
    <h2>Ownership</h2>
    <label>
      Status
      <select name="ownership">
        {#each ownerships as option}
          <option value={option} selected={field('ownership', 'owned') === option}>{option}</option>
        {/each}
      </select>
    </label>
    <label>
      Condition
      <select name="condition">
        {#each conditions as option}
          <option value={option} selected={field('condition', 'good') === option}>{option}</option>
        {/each}
      </select>
    </label>
    <label>
      Purchase date
      <input name="purchaseDate" type="date" value={field('purchaseDate')} />
    </label>
    <label>
      Purchase price
      <input
        name="purchasePrice"
        type="number"
        min="0"
        step="0.01"
        value={form?.values?.purchasePrice ??
          priceFromMinor((value.purchasePriceMinor as number | null) ?? null)}
      />
    </label>
    <label>
      Currency
      <input name="currency" maxlength="3" required value={field('currency', 'EUR')} />
      {#if error('currency')}<span class="field-error">{error('currency')}</span>{/if}
    </label>
  </section>

  <div class="form-actions">
    <button type="submit">{submitLabel}</button>
    <a class="button ghost" href={value.id ? `/lenses/${value.id}` : '/'}>Cancel</a>
  </div>
</form>
