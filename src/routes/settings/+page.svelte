<!--
  Glassbook
  Copyright 2026 bitfischer.de

  @author  bitfischer.de
  @version 1.0.0
  @license MIT
-->

<script lang="ts">
  let { data, form } = $props();
  let reportFields = $state(['lensName', 'vendor', 'serialNumber', 'purchasePrice']);
</script>

<svelte:head><title>Settings · Glassbook</title></svelte:head>
<div class="page-header">
  <div>
    <p class="eyebrow">Administration</p>
    <h1>Settings</h1>
    <p class="muted">Manage your catalogue, access, and data.</p>
  </div>
</div>

{#if form?.message}<p
    class={form.restoreError ||
    form.authError ||
    form.message.includes('cannot') ||
    form.message.includes('exists')
      ? 'error-banner'
      : 'card settings-notice'}
    role="status"
  >
    {form.message}
  </p>{/if}

<div class="settings-overview-grid">
  <section class="card settings-panel settings-daily-lens">
    <p class="eyebrow">Daily feature</p>
    <h2>Lens of the day</h2>
    <p class="muted">Choose a different lens now. The current lens remains in your history.</p>
    <form method="POST" action="?/chooseAgain" class="settings-panel-action">
      <button type="submit">Choose another lens</button>
    </form>
  </section>

  <section class="card settings-panel">
    <p class="eyebrow">Data protection</p>
    <h2>Backups</h2>
    <p class="muted">Keep an export of your catalogue, settings, and original photos.</p>
    <div class="settings-panel-action">
      <a class="button ghost" href="/backup">Download backup</a>
    </div>
    <details class="restore-backup">
      <summary>Restore a backup</summary>
      <form
        method="POST"
        action="?/restore"
        enctype="multipart/form-data"
        class="restore-backup-form stack"
        onsubmit={(event) => {
          if (
            !confirm(
              'Restore this backup? The current catalogue, login, settings, and original photos will be replaced.'
            )
          )
            event.preventDefault();
        }}
      >
        <div>
          <p class="eyebrow">Destructive action</p>
          <h2>Restore from backup</h2>
          <p class="muted">
            Upload a Glassbook .tar.gz backup. This replaces all catalogue data, settings, login
            credentials, and original photos. You may be signed out afterward.
          </p>
        </div>
        <label>
          Backup archive
          <input
            name="backup"
            type="file"
            accept=".tar.gz,.tgz,.tar,application/gzip,application/x-tar"
            required
          />
        </label>
        <button class="danger" type="submit">Restore and replace data</button>
      </form>
    </details>
  </section>

  <section class="card settings-panel settings-insurance-report">
    <p class="eyebrow">Documentation</p>
    <h2>Insurance report</h2>
    <p class="muted">Export every lens as a PDF with the details you want to include.</p>
    <form method="GET" action="/insurance-report" class="settings-report-form">
      <input type="hidden" name="fieldsConfigured" value="true" />
      <fieldset class="settings-report-fields">
        <legend>Included details</legend>
        <label class="checkbox-field">
          <input type="checkbox" name="field" value="lensName" bind:group={reportFields} />
          <span>Lens name</span>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" name="field" value="vendor" bind:group={reportFields} />
          <span>Vendor</span>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" name="field" value="serialNumber" bind:group={reportFields} />
          <span>Serial number</span>
        </label>
        <label class="checkbox-field">
          <input type="checkbox" name="field" value="purchasePrice" bind:group={reportFields} />
          <span>Purchase price</span>
        </label>
      </fieldset>
      <button type="submit" disabled={!reportFields.length}>Export PDF</button>
    </form>
  </section>
</div>

<section class="card lens-form settings-authentication">
  <p class="eyebrow">Security</p>
  <h2>User authentication</h2>
  <p class="muted">Require a username and password before opening Glassbook.</p>
  <form method="POST" action="?/authentication" class="stack settings-authentication-form">
    <label class="checkbox-field">
      <input name="enabled" type="checkbox" checked={data.authentication.enabled} />
      <span>Require sign-in</span>
    </label>
    {#if data.authentication.user}
      <p class="muted">Username: <strong>{data.authentication.user.username}</strong></p>
    {:else}
      <label>
        Username
        <input name="username" minlength="2" maxlength="60" autocomplete="username" />
      </label>
    {/if}
    <div class="settings-password-fields">
      <label>
        {data.authentication.user ? 'New password' : 'Password'}
        <input
          name="password"
          type="password"
          minlength="5"
          maxlength="200"
          autocomplete="new-password"
        />
      </label>
      <label>
        Confirm {data.authentication.user ? 'new ' : ''}password
        <input
          name="confirmPassword"
          type="password"
          minlength="5"
          maxlength="200"
          autocomplete="new-password"
        />
      </label>
    </div>
    <p class="muted">
      {#if data.authentication.user}
        Leave the password fields empty to keep the current password.
      {:else}
        A username and password are required when you turn authentication on.
      {/if}
    </p>
    <div class="form-actions"><button type="submit">Save authentication settings</button></div>
  </form>
</section>

<section class="settings-catalogue-values" aria-labelledby="catalogue-values-title">
  <div class="settings-section-heading">
    <p class="eyebrow">Catalogue setup</p>
    <h2 id="catalogue-values-title">Manufacturers and mounts</h2>
    <p class="muted">These reusable values keep lens forms tidy and consistent.</p>
  </div>
  <div class="settings-value-grid">
    {#each [{ kind: 'manufacturer', title: 'Manufacturers', items: data.manufacturers }, { kind: 'mount', title: 'Mounts', items: data.mounts }] as group}
      <section class="card settings-value-panel">
        <h2>{group.title}</h2>
        <form method="POST" action="?/add" class="settings-value-add">
          <input type="hidden" name="kind" value={group.kind} />
          <label>New {group.kind}<input name="name" required maxlength="100" /></label>
          <button type="submit">Add</button>
        </form>
        <div class="settings-value-list">
          {#each group.items as item}
            <form method="POST" action="?/delete" class="settings-value-item">
              <input type="hidden" name="kind" value={group.kind} />
              <input type="hidden" name="id" value={item.id} />
              <span>{item.name}</span>
              <button class="danger small" type="submit">Delete</button>
            </form>
          {:else}<p class="muted">No values yet.</p>{/each}
        </div>
      </section>
    {/each}
  </div>
</section>
