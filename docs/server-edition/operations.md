# Backups, deployment, and recovery

[Overview](server-edition-design.md) · Requires: [server lifecycle](server-host.md); [backup primitives](library-extraction.md) are extracted earlier

Make the server recoverable and deployable without changing native storage or sync semantics.

## Check-ins

Use packaging in the first [delivery increment](server-edition-design.md#delivery-increments), initially on disposable installations. Add jobs as recovery capabilities become available. Early deployment tests do not establish production readiness.

| Change | Code boundary | Verification |
| --- | --- | --- |
| Minimal image and Compose | Package the available headless host, web assets, persistent mounts, health checks, and HTTPS configuration in proposed `deploy/` | Bootstrap privately; after auth lands, demonstrate sign-in/read-only access, container recreation, identity persistence, and single-writer enforcement |
| Consistent snapshot jobs | Build server jobs around extracted [backup](../../desktop/src/backup.rs) and [media](../../desktop/src/media.rs) primitives | Writes/collection during export; missing originals fail; restore preserves content, Recovery, and checksums |
| Scheduling and retention | Server-owned settings, job status, last-success record, and prune-after-verification | Failed/interrupted jobs retain earlier archives; bounded job concurrency |
| Encrypted off-host copy | Add one selected destination and established encryption implementation | Retrieve and restore independently; missing credentials/keys fail clearly |
| Harden standalone Compose | Extend the initial package and instructions as media, remote sync, jobs, and upgrades become available | Fresh install, redeploy, reboot, proxy/WebSocket handling, streaming/uploads, and independent restore |
| Dokploy setup | Trial the same image with the panel's proxy early; extend volumes, secrets, origin, and upgrade instructions with each capability | No second proxy; repeat deployment checks as features land and complete them before advertising operational support |
| Coolify setup | Verify the same image/configuration contract with panel-specific instructions | Complete deployment checks before advertising support |
| Upgrade and disaster-recovery procedure | Pin releases, require pre-migration backup, document portable versus full-volume restore | Unsupported schema rejected; migration failure stops service; independent restore without duplicated identities |

Snapshot jobs can follow the required library extraction and headless host. Public browser access waits for authentication; any enabled remote endpoint must also pass its exposure checks. Keep packaging, storage, and protocol changes in separate buildable check-ins even when they contribute to the same increment.

## Backups

Use the existing portable format, version validation, import rules, and conflict-copy behavior. Include Recovery and required originals; exclude credentials, membership, replication cursors, and unfinished drafts.

Export a consistent logical snapshot and pin its originals until completion. Copying live `library.sqlite` alone is insufficient with WAL and concurrent media collection. Missing or pending originals fail the backup. Record the last success, failures, size, and checksum; prune old archives only after verifying the new one.

Propose scheduled versioned archives, configurable retention, and optional encrypted off-host copies. Schedule, retention, encryption format, and destinations remain open. Use established encryption, not custom archive cryptography.

Portable restore creates a fresh server identity and requires pairing. Full-volume recovery preserves identity but requires retiring the old instance first. A process lock cannot prevent two machines from running cloned identities.

Verify restored content, originals, checksums, Recovery, and identity behavior—not just whether the archive opens.

## Deployment

**Agreed:** Ship a versioned container image and Docker Compose configuration. Support standalone Compose and Dokploy first; verify Coolify as an additional target before advertising support. Use the same image and configuration contract without panel-specific application APIs.

Package the Rust server and matching web assets in one non-root image. Use persistent storage and separate secrets. The app schedules sync and backups; it needs no database or queue service. Configure restart after VPS reboot.

| Deployment path | HTTPS and operation |
| --- | --- |
| Standalone Docker Compose | Optional HTTPS proxy, or an existing host proxy |
| Dokploy | Panel-managed domain and HTTPS; no second proxy container |
| Coolify | Same image and configuration, with tested panel instructions |

Document the internal port, public origin, health/readiness checks, data/identity paths, secrets, permissions, and shutdown behavior. Configure trusted proxies explicitly. Test WebSockets, reconnects, uploads, streaming, and proxy timeouts on each path.

Store the library, originals, identity, and authentication state outside the container so redeployments retain them. Use one instance per library and stop-before-start upgrades, not overlapping rolling or blue-green instances. Do not bypass the storage lock or clone active identities. Document volume reuse and restore; panel volume backups do not replace application-consistent backups.

Expose HTTPS only. Bind the app to a private container network or loopback behind the proxy. Never expose raw LAN/sharing listeners. Serve static assets from a directory separate from data and backups.

## Upgrades and status

Pin an explicit release, not `latest`, with server and web assets from the same revision. Reject unsupported newer database/protocol versions at startup. `vite preview` is not the production server.

Verify a backup before schema-changing upgrades. Failed migrations stop service; they must not initialize a blank library. An image downgrade does not reverse a database migration—document restore-based recovery.

Report storage/disk pressure, pending originals, sync failures, and backup failures. Never log thought text, passwords, tokens, or private keys. Set request, upload, connection, and job limits; test disk-full and interrupted writes.

Preserve license and corresponding-source notices.

## Decisions needed

- Backup schedule, retention, encryption format, and off-host destinations before operational release.
- Linux architectures, resource baseline, domain, storage/secrets, and panel/proxy configuration before packaging and deployment. Test every advertised target.
