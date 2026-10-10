# Museamo server edition technical design

Drafted 2026-10-04. Upstream reviewed 2026-10-06.

Status: design, not implementation. Requirements and decisions marked **Agreed** are settled; other implementation choices remain proposals.

## What changes

Museamo server edition is another Museamo platform: a self-hosted application with its own complete library and a web interface. It runs on a VPS and syncs as a peer of native devices, not as the authority over their libraries. Native editions work without it.

The server adds browser access, a replica that stays online when other devices do not, and versioned backups. Each installation serves one person's library; shared tags remain a separate relationship.

| Area | Change |
| --- | --- |
| [Shared library](library-extraction.md) | Reuse desktop persistence in a headless host without changing native behavior |
| [Server host](server-host.md) | Add durable server identity, process lifecycle, and owner login |
| [Browser access](browser-access.md) | Connect the shared UI to the server instead of preview data |
| [Remote transport](remote-sync.md) | Carry existing replication over an outbound internet connection |
| [Device linking](device-linking.md) | Configure phones by QR and desktops by copied setup code |
| [Mobile data](mobile-data.md) | Allow small budgeted updates; defer attachments and large transfers |
| [Operations](operations.md) | Add scheduled backups, recovery, and Compose/Dokploy deployment |

The [current baseline](baseline.md) already has desktop, Android, and iOS local storage and LAN sync. The web build is still an in-memory preview; no server persistence, authentication, or remote transport is implemented.

## What stays unchanged

**Agreed requirements:**

- Native capture and LAN sync work without the server. Existing conflict, membership, and removal rules remain authoritative.
- Sync covers saved thoughts, tags, locations, attachments, and Recovery. Originals may arrive after metadata. Drafts, widgets, permissions, and preferences remain device-local.
- Browsers act on the server's library and identity; they are not independent replicas.
- Desktop data paths, formats, IDs, credentials, and platform behavior survive extraction without user migration. Android and iOS retain their own repositories and lifecycle.
- Extract shared code separately from new host features and transport changes.
- Remain downstream and compatible with concurrent native work. Follow the [upstream workflow](baseline.md#upstream-workflow) before each increment and final verification. Development can proceed independently; upstream acceptance is a separate review.

## Delivery increments

Build toward a working demonstration, not a completed technical layer. The area check-ins are building blocks for these increments, not seven workstreams that must all finish first. All increments are planned; none is implemented.

| Increment | Demonstrate on a disposable installation | Pull from |
| --- | --- | --- |
| Sign in and read a library | Start through Compose, sign in, browse a fixture library, recreate the container, and reopen the same library and identity; reject unauthorized reads | [Core extraction](library-extraction.md#check-ins), [host/auth](server-host.md#check-ins), read-only [web adapter](browser-access.md#check-ins), minimal [packaging](operations.md#check-ins) |
| Capture and edit text | Save, refresh, and restart without losing a thought; retain drafts on connection loss and writing on stale edits | Browser drafts, mutations, and session recovery |
| Recover saved content | Delete/restore a thought and export/import a verified portable backup into a fresh installation | Recovery, backup extraction, and consistent snapshot jobs |
| Use original attachments | Upload, download, and play media; interrupt a transfer and recover without losing text or falsely reporting missing bytes as saved | Media extraction and browser routes |
| Link one native platform | Pair by temporary invitation; edit offline and catch up both ways, with shared-tag permissions and metered-transfer controls intact | [Transport](remote-sync.md#check-ins), [linking](device-linking.md#check-ins), [mobile data](mobile-data.md#check-ins) |
| Run unattended | Schedule backups, retrieve an encrypted off-host copy, and exercise Dokploy restart, upgrade, and independent restore | Operational jobs and deployment hardening |
| Add another supported target | Repeat the applicable acceptance flow for one additional native platform or deployment path | Per-platform adapters; Coolify verification |

Start the first increment with a private headless bootstrap; expose library routes only after authentication passes. Extract what the selected capability and its dependencies need, preserving the coherent `Store` move and separate behavior-preserving check-ins. Complete media and backup features need not block the read-only demonstration.

The sequence is provisional. After each demonstration, select the next capability using feedback, remaining risk, and dependencies. Split an increment further if it cannot be demonstrated promptly; do not defer all browser work until the backend is “finished.”

## Iteration and acceptance

- **Select:** Agree on one observable outcome, its failure cases, pilot platform, and exclusions. Detail only the next increment; keep later work provisional.
- **Resolve uncertainty:** Time-box an extraction, identity, or transport spike with a specific question and exit result. Record a decision or blocker; a prototype is not a shipped capability.
- **Integrate:** Make small, buildable check-ins with their tests. Keep incomplete paths unavailable and integrate into `webapp` frequently, following the [upstream workflow](baseline.md#upstream-workflow).
- **Demonstrate:** Run the outcome and failure cases on the integrated tree, show the result, and record feedback before choosing the next increment.

An increment is accepted when its code and tests are reviewed, its workflow and affected native regressions pass, deployment/configuration instructions match it, and known limits are visible. Use disposable data until recovery is verified for every content type enabled in that increment. Never reduce scope by bypassing authentication, losing existing shared content, changing conflict rules, or weakening mobile-data safeguards.

Early Compose/Dokploy trials are not operational-release claims. Remote-server support for additional native platforms and deployment support for Coolify require their own checks; existing native/LAN support is unchanged. The full server release still requires the checkpoint below.

## Settled choices and remaining decisions

- **Agreed:** [Temporary invitations](device-linking.md#agreed-invitation-policy), ten-minute default, single-use, revocable, with bounded same-device retries.
- **Agreed:** [Budgeted mobile updates](mobile-data.md#agreed-behavior), no automatic metered attachment transfers, Wi-Fi-only option, and scoped override.
- **Agreed:** [Compose and Dokploy-first deployment](operations.md#deployment), with the same image for independently verified Coolify support.

The remaining choices sit with their implementation area: [credentials/auth](server-host.md#decisions-needed), [draft lifecycle](browser-access.md#browser-milestone), [transport and shared-tag support](remote-sync.md#interoperability-checkpoint), [invitation mechanics](device-linking.md#decisions-needed), [data-budget limits](mobile-data.md#decisions-needed), and [backup/deployment configuration](operations.md#decisions-needed).

## Release checkpoint

Use disposable libraries and the agreed native release versions. Create a thought in the browser, receive and edit it offline in a native app, reconnect, and verify convergence. Repeat with a conflict, attachment, deletion/Recovery restore, server restart, and independent backup restore into a fresh installation.

Browser access, native remote sync, and operational recovery must all pass. Automated checks do not replace real browser, credential-store, or cross-device verification. Existing iOS hardware acceptance remains [pending](../ios-sharing-acceptance.md).
