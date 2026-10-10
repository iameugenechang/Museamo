# Browser access

[Overview](server-edition-design.md) · Requires: [authenticated server host](server-host.md)

Connect the shared interface to the server's library. Browser actions create revisions under the server's device identity; the browser is not another enrolled replica.

## Check-ins

| Change | Code boundary | Verification |
| --- | --- | --- |
| Web runtime and read-only queries | Add `web` beside native/preview in [platform detection](../../src/platform.ts); add an authenticated adapter at [the UI bridge](../../src/data.ts) and allowlisted server queries | Real data after refresh; backend errors never show sample data; native and preview routing unchanged |
| Browser draft storage | Add server-owned namespaces, composer IDs, revisions, and local text recovery | Tabs/browsers cannot overwrite each other; reload, session expiry, and interrupted connectivity preserve writing |
| Mutations and retry handling | Connect capture/edit/delete to the repository; wire revision and idempotency errors into the editor | Duplicate and ambiguous retries do not duplicate saves; stale edits preserve writing and offer reload/save-as-new |
| Media routes | Connect extracted media processing to authenticated upload/download and browser file selection | Streamed, bounded uploads; protected originals/previews; playback/ranges; interrupted cleanup |
| Recovery actions | Expose existing restore/purge operations | Recovery behavior preserved; duplicate restore requests do not create duplicate thoughts |
| Manual backup jobs | Expose extracted portable import/export operations and owner-only job status/downloads | Duplicate imports are safe; unauthorized archives/downloads rejected; existing portable format retained |
| Change notifications and session recovery | Connect post-commit invalidation and reauthentication to the web adapter | Unknown cursor/server restart triggers requery; expired/revoked sessions cannot access commands, media, backups, or events |

Each row includes server contracts and the frontend tests that exercise them. Pull rows into the [delivery increments](server-edition-design.md#delivery-increments), rather than treating the whole table as one browser milestone. Read-only access can run before media and backups; text capture needs drafts, stale-edit handling, and session recovery. Manual backup actions use extracted primitives; scheduling and off-host jobs follow in [operations](operations.md).

## Runtime and API

Serve the UI and API from one HTTPS origin. Backend failure must show an error, never sample data. Support browser clipboard, link, and file-selection handling; omit native window controls, widgets, and startup settings.

The first release excludes offline browsing and an offline capture queue. Connection loss must still preserve writing and distinguish local drafts from server-confirmed saves.

Define request schemas and limits with contract tests:

| Route group | Access and behavior |
| --- | --- |
| Versioned library commands | Authenticated, explicitly allowed and validated app-facing operations |
| Media upload and registered-media download | Authenticated streaming, file limits, checksums, and byte-range support |
| Backup jobs and downloads | Authenticated job creation/status and owner-only archive access |
| Library change notifications | Authenticated invalidation, followed by ordinary library queries |
| Device linking and management | Authenticated owner actions with recent-authentication requirements |

Setup/session routes belong to [owner authentication](server-host.md#owner-authentication); the remote sync endpoint has [native-device authentication](remote-sync.md), not browser sessions.

Allowlist browser commands; never forward arbitrary names to signing, replication, credential, or filesystem callbacks. Use stable errors for stale revisions, expired sessions, unsupported versions, missing originals, and storage failures.

Mutations require same-origin validation and CSRF protection. Authentication covers original media, previews, attachments retained in Recovery, backup downloads, and event streams as well as JSON commands. Cookie or token values must never appear in URLs. Private responses must not enter shared caches.

Use bounded events or polling to invalidate browser data. Events carry a cursor, not library state. Requery on an unknown cursor or server restart so missed notifications cannot leave stale views.

## Drafts, retries, and concurrent edits

For web drafts, use browser-specific namespaces, composer IDs, and revisions instead of desktop's app/tag key. Validate ownership on the server. Authentication tokens are not draft identifiers.

Keep a local text copy for interruptions and reloads, namespaced by server and owner, alongside server drafts. Define cleanup on logout and provide a discard action. Keep authentication credentials out of local/session storage. Attachments are not saved until upload succeeds; preserve text if a file needs reselection.

Capture retries reuse the same entry ID. Make restore and backup-import job creation idempotent too. Never retry an ambiguously completed mutation under a fresh ID.

Edits and deletes carry the revision the user saw. On a stale request, preserve submitted writing and offer reload or save-as-new. Draft updates also require revision checks. Native conflict rules stay unchanged.

## Media

Reuse media IDs, checksums, references, staging, and validation. Stream uploads to private staging files, enforce limits while reading, publish atomically, and acknowledge only after durable registration. Reject client-provided paths. Keep originals even when the browser cannot decode them; distinguish missing files from unavailable previews.

Protect originals referenced by drafts, thoughts, Recovery, transfers, or backup snapshots from collection. Clean up interrupted uploads and failed imports. Support bounded range requests for video; reject invalid ranges without exposing other files.

## Browser milestone

Using a disposable library, verify save, refresh, server restart, search, tags, checklists, Recovery, media, and backup import/export. Exercise concurrent tabs, lost responses, stale requests, and session expiration in an actual browser, not only bridge mocks.

Draft persistence, recovery, and logout cleanup must be settled before this milestone. It delivers browser access; [remote sync](remote-sync.md) and [operational recovery](operations.md) are still required for the complete server edition.
