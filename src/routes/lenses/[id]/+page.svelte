<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  import Gallery from '$lib/components/Gallery.svelte';

  let { data, form } = $props();
  const display = (value: unknown, suffix = '') =>
    value === null || value === '' ? '—' : `${value}${suffix}`;

  const focal = $derived(
    data.lens.focalMinMm
      ? data.lens.focalMaxMm && data.lens.focalMaxMm !== data.lens.focalMinMm
        ? `${data.lens.focalMinMm}–${data.lens.focalMaxMm} mm`
        : `${data.lens.focalMinMm} mm`
      : '—'
  );
  const opticalFormula = $derived(
    data.lens.elements && data.lens.groups
      ? `${data.lens.elements} elements / ${data.lens.groups} groups`
      : '—'
  );
  const purchase = $derived(
    data.lens.purchasePriceMinor === null
      ? '—'
      : (data.lens.purchasePriceMinor / 100).toLocaleString(undefined, {
          style: 'currency',
          currency: data.lens.currency
        })
  );
  const lensNotes = $derived(data.entries.filter((entry) => entry.type === 'note'));
  const memories = $derived(data.entries.filter((entry) => entry.type === 'memory'));
  let newEntryType = $state('note');
  $effect(() => {
    if (form?.entryAction === 'create') newEntryType = String(form.entryValues?.type ?? 'note');
  });
  const entryError = (name: 'type' | 'eventDate' | 'body') => form?.entryErrors?.[name]?.[0];
  const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
</script>

<svelte:head><title>{data.lens.manufacturer} {data.lens.model} · Glassbook</title></svelte:head>

<div class="page-header">
  <div>
    <p class="eyebrow">{data.lens.manufacturer}</p>
    <h1>{data.lens.model}</h1>
    <span class="badge">{data.lens.ownership}</span>
  </div>
  <div class="form-actions">
    <form method="POST" action="?/duplicate">
      <button class="ghost" type="submit">Duplicate</button>
    </form>
    <a class="button" href={`/lenses/${data.lens.id}/edit`}>Edit lens</a>
  </div>
</div>

<div class="detail-grid">
  <section>
    <Gallery photos={data.photos} alt={`${data.lens.manufacturer} ${data.lens.model}`} />

    <details class="manage-photos card" open={!data.photos.length}>
      <summary>Manage photos</summary>

      {#if data.photos.length}
        <ul class="manage-list">
          {#each data.photos as photo (photo.id)}
            <li>
              <img src={`/images/${photo.id}/thumbnail`} alt={photo.originalName} />
              <div class="manage-actions">
                {#if photo.isCover}<span class="badge">cover</span>{/if}
                <form method="POST" action="?/movePhoto">
                  <input type="hidden" name="photoId" value={photo.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    class="ghost small"
                    type="submit"
                    disabled={photo.position === 0}
                    aria-label="Move photo earlier">←</button
                  >
                </form>
                <form method="POST" action="?/movePhoto">
                  <input type="hidden" name="photoId" value={photo.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    class="ghost small"
                    type="submit"
                    disabled={photo.position === data.photos.length - 1}
                    aria-label="Move photo later">→</button
                  >
                </form>
                {#if !photo.isCover}
                  <form method="POST" action="?/cover">
                    <input type="hidden" name="photoId" value={photo.id} />
                    <button class="ghost small" type="submit">Make cover</button>
                  </form>
                {/if}
                <form method="POST" action="?/deletePhoto">
                  <input type="hidden" name="photoId" value={photo.id} />
                  <button class="danger small" type="submit">Remove</button>
                </form>
              </div>
            </li>
          {/each}
        </ul>
      {/if}

      <form method="POST" action="?/upload" enctype="multipart/form-data" class="upload-form stack">
        <label>
          Add photo (JPEG, PNG, or WebP)
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required />
        </label>
        {#if form?.uploadError}<p class="field-error" role="alert">{form.uploadError}</p>{/if}
        <button type="submit">Upload photo</button>
      </form>
    </details>
  </section>

  <section>
    <h2>Specifications</h2>

    <div class="spec-group">
      <p class="spec-group-title">Optical</p>
      <dl class="spec-list">
        <div>
          <dt>Focal length</dt>
          <dd>{focal}</dd>
        </div>
        <div>
          <dt>Aperture</dt>
          <dd>{data.lens.apertureMin ? `ƒ/${data.lens.apertureMin}` : '—'}</dd>
        </div>
        <div>
          <dt>Optical formula</dt>
          <dd>{opticalFormula}</dd>
        </div>
        <div>
          <dt>Mount</dt>
          <dd>{display(data.lens.mount)}</dd>
        </div>
      </dl>
    </div>

    <div class="spec-group">
      <p class="spec-group-title">Physical</p>
      <dl class="spec-list">
        <div>
          <dt>Weight</dt>
          <dd>{display(data.lens.weightGrams, ' g')}</dd>
        </div>
        <div>
          <dt>Length</dt>
          <dd>{display(data.lens.lengthMm, ' mm')}</dd>
        </div>
        <div>
          <dt>Diameter</dt>
          <dd>{display(data.lens.diameterMm, ' mm')}</dd>
        </div>
        <div>
          <dt>Filter thread</dt>
          <dd>{display(data.lens.filterThreadMm, ' mm')}</dd>
        </div>
      </dl>
    </div>

    <div class="spec-group">
      <p class="spec-group-title">Provenance</p>
      <dl class="spec-list">
        <div>
          <dt>Release year</dt>
          <dd>{display(data.lens.releaseYear)}</dd>
        </div>
        <div>
          <dt>Serial number</dt>
          <dd>{display(data.lens.serialNumber)}</dd>
        </div>
        <div>
          <dt>Condition</dt>
          <dd>{data.lens.condition}</dd>
        </div>
        <div>
          <dt>Purchase price</dt>
          <dd>{purchase}</dd>
        </div>
      </dl>
    </div>

    {#if data.lens.notes}<h2>Notes</h2>
      <p>{data.lens.notes}</p>{/if}

    <div class="delete-row">
      <form
        method="POST"
        action="?/delete"
        onsubmit={(event) => {
          if (!confirm('Delete this lens and all its photos?')) event.preventDefault();
        }}
      >
        <button class="danger" type="submit">Delete lens</button>
      </form>
    </div>
  </section>
</div>

<section class="journal-section" aria-labelledby="journal-heading">
  <div class="journal-heading">
    <div>
      <p class="eyebrow">Personal journal</p>
      <h2 id="journal-heading">Memories & lens notes</h2>
    </div>
  </div>

  <form method="POST" action="?/createEntry" enctype="multipart/form-data" class="entry-form card">
    <div class="entry-form-row">
      <label>
        Entry type
        <select name="type" bind:value={newEntryType}>
          <option value="note">Lens note</option>
          <option value="memory">Memory</option>
        </select>
      </label>
      {#if newEntryType === 'memory'}
        <label>
          Date (optional)
          <input
            name="eventDate"
            type="date"
            value={form?.entryAction === 'create' ? (form.entryValues?.eventDate ?? '') : ''}
          />
          {#if entryError('eventDate')}<span class="field-error">{entryError('eventDate')}</span
            >{/if}
        </label>
      {/if}
    </div>
    <label>
      {newEntryType === 'memory' ? 'What happened?' : 'What should you remember about this lens?'}
      <textarea name="body" required
        >{form?.entryAction === 'create' ? (form.entryValues?.body ?? '') : ''}</textarea
      >
      {#if form?.entryAction === 'create' && entryError('body')}<span class="field-error"
          >{entryError('body')}</span
        >{/if}
    </label>
    {#if newEntryType === 'memory'}
      <label>
        Images (optional)
        <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
        <span class="field-hint">Uploaded images are also added to this lens's photo gallery.</span>
      </label>
    {/if}
    <button type="submit">Add {newEntryType === 'memory' ? 'memory' : 'lens note'}</button>
  </form>

  {#if form?.entryMessage}<p class="error-banner" role="alert">{form.entryMessage}</p>{/if}

  <div class="journal-columns">
    <section aria-labelledby="lens-notes-heading">
      <h3 id="lens-notes-heading">Lens notes</h3>
      {#if lensNotes.length}
        <div class="entry-list">
          {#each lensNotes as entry (entry.id)}
            <article class="journal-entry card">
              <p class="entry-body">{entry.body}</p>
              <details open={form?.entryAction === 'update' && form.entryId === entry.id}>
                <summary>Edit</summary>
                <form method="POST" action="?/updateEntry" class="stack entry-edit-form">
                  <input type="hidden" name="entryId" value={entry.id} />
                  <label>
                    Entry type
                    <select name="type">
                      <option
                        value="note"
                        selected={form?.entryAction === 'update' && form.entryId === entry.id
                          ? form.entryValues?.type === 'note'
                          : true}>Lens note</option
                      >
                      <option
                        value="memory"
                        selected={form?.entryAction === 'update' &&
                          form.entryId === entry.id &&
                          form.entryValues?.type === 'memory'}>Memory</option
                      >
                    </select>
                  </label>
                  <label>
                    Date (only for memories)
                    <input
                      name="eventDate"
                      type="date"
                      value={form?.entryAction === 'update' && form.entryId === entry.id
                        ? (form.entryValues?.eventDate ?? '')
                        : ''}
                    />
                  </label>
                  <label>
                    Entry text
                    <textarea name="body" required
                      >{form?.entryAction === 'update' && form.entryId === entry.id
                        ? (form.entryValues?.body ?? entry.body)
                        : entry.body}</textarea
                    >
                    {#if form?.entryAction === 'update' && form.entryId === entry.id && entryError('body')}<span
                        class="field-error">{entryError('body')}</span
                      >{/if}
                  </label>
                  <div class="entry-actions">
                    <button class="small" type="submit">Save</button>
                  </div>
                </form>
              </details>
              <form
                method="POST"
                action="?/deleteEntry"
                class="entry-delete"
                onsubmit={(event) => {
                  if (!confirm('Delete this lens note?')) event.preventDefault();
                }}
              >
                <input type="hidden" name="entryId" value={entry.id} />
                <button class="danger small" type="submit">Delete</button>
              </form>
            </article>
          {/each}
        </div>
      {:else}
        <p class="empty-copy">No lens notes yet.</p>
      {/if}
    </section>

    <section aria-labelledby="memories-heading">
      <h3 id="memories-heading">Memories</h3>
      {#if memories.length}
        <div class="entry-list memory-timeline">
          {#each memories as entry (entry.id)}
            <article class="journal-entry card">
              <p class="entry-date">
                {entry.eventDate ? formatDate(entry.eventDate) : 'Undated memory'}
              </p>
              <p class="entry-body">{entry.body}</p>
              {#if entry.photoIds.length}
                <div class="memory-images" aria-label="Memory images">
                  {#each entry.photoIds as photoId}
                    <figure>
                      <a href={`/images/${photoId}/gallery`} target="_blank">
                        <img src={`/images/${photoId}/thumbnail`} alt="" loading="lazy" />
                      </a>
                      <form method="POST" action="?/detachEntryImage">
                        <input type="hidden" name="entryId" value={entry.id} />
                        <input type="hidden" name="photoId" value={photoId} />
                        <button class="ghost small" type="submit">Detach</button>
                      </form>
                    </figure>
                  {/each}
                </div>
              {/if}
              <details open={form?.entryAction === 'update' && form.entryId === entry.id}>
                <summary>Edit</summary>
                <form method="POST" action="?/updateEntry" class="stack entry-edit-form">
                  <input type="hidden" name="entryId" value={entry.id} />
                  <label>
                    Entry type
                    <select name="type">
                      <option
                        value="note"
                        selected={form?.entryAction === 'update' &&
                          form.entryId === entry.id &&
                          form.entryValues?.type === 'note'}>Lens note</option
                      >
                      <option
                        value="memory"
                        selected={form?.entryAction === 'update' && form.entryId === entry.id
                          ? form.entryValues?.type === 'memory'
                          : true}>Memory</option
                      >
                    </select>
                  </label>
                  <label>
                    Date (only for memories)
                    <input
                      name="eventDate"
                      type="date"
                      value={form?.entryAction === 'update' && form.entryId === entry.id
                        ? (form.entryValues?.eventDate ?? '')
                        : (entry.eventDate ?? '')}
                    />
                    {#if form?.entryAction === 'update' && form.entryId === entry.id && entryError('eventDate')}<span
                        class="field-error">{entryError('eventDate')}</span
                      >{/if}
                  </label>
                  <label>
                    Memory
                    <textarea name="body" required
                      >{form?.entryAction === 'update' && form.entryId === entry.id
                        ? (form.entryValues?.body ?? entry.body)
                        : entry.body}</textarea
                    >
                    {#if form?.entryAction === 'update' && form.entryId === entry.id && entryError('body')}<span
                        class="field-error">{entryError('body')}</span
                      >{/if}
                  </label>
                  <div class="entry-actions">
                    <button class="small" type="submit">Save</button>
                  </div>
                </form>
              </details>
              <details
                class="memory-image-manager"
                open={form?.entryAction === 'images' && form.entryId === entry.id}
              >
                <summary>Add images</summary>
                <form
                  method="POST"
                  action="?/attachEntryImages"
                  enctype="multipart/form-data"
                  class="stack entry-edit-form"
                >
                  <input type="hidden" name="entryId" value={entry.id} />
                  <label>
                    Images
                    <input
                      name="images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      required
                    />
                    <span class="field-hint"
                      >Images are stored in this lens's existing gallery.</span
                    >
                  </label>
                  <button class="small" type="submit">Upload and attach</button>
                </form>
              </details>
              <form
                method="POST"
                action="?/deleteEntry"
                class="entry-delete"
                onsubmit={(event) => {
                  if (!confirm('Delete this memory?')) event.preventDefault();
                }}
              >
                <input type="hidden" name="entryId" value={entry.id} />
                <button class="danger small" type="submit">Delete</button>
              </form>
            </article>
          {/each}
        </div>
      {:else}
        <p class="empty-copy">No memories yet.</p>
      {/if}
    </section>
  </div>
</section>
