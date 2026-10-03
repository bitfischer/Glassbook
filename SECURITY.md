# Security Policy

Glassbook stores private data: lens records, photos, and a login. Security reports are welcome and
taken seriously.

## Supported versions

Only the latest release on `main` receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

1. Open a private report at
   <https://github.com/bitfischer/Glassbook/security/advisories/new>.
2. If that is not possible, email <oss@bitfischer.de> with the subject `Glassbook security`.

Include what you found, the steps to reproduce it, the affected version or commit, and the impact
you expect. A proof of concept helps but is not required.

You can expect an acknowledgement within a few days. This is a one-person hobby project, so there is
no guaranteed fix time, but confirmed issues are fixed as soon as practical and you are credited in
the release notes unless you prefer otherwise.

## Scope

In scope:

- Authentication, session handling, and the first-run setup flow.
- Access to catalogue data, uploaded images, or the backup download without a valid session.
- Backup restore (archive parsing, path handling, size limits) and image upload handling.
- Injection, cross-site scripting, and request-forgery issues in the application.

Out of scope:

- Running Glassbook with `AUTH_ENABLED` unset on a network you do not control. Authentication is
  off by default and documented as such in the [README](README.md#security-model).
- Missing HTTPS or reverse-proxy hardening on your own deployment.
- Attacks that require access to the host, the Docker volume, or `DATA_DIR`.
- Vulnerabilities in dependencies with no practical impact on Glassbook. Report those upstream.

## Hardening your own instance

- Set `AUTH_ENABLED=true` before exposing Glassbook to anything beyond your own machine.
- Serve it over HTTPS and set `ORIGIN` to the exact public URL.
- Keep port `7002` reachable only from the reverse proxy or a trusted network.
- Keep regular backups off the server, and never commit `data/` or `.env` to Git.
