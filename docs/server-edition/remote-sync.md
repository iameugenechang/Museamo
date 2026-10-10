# Remote device transport

[Overview](server-edition-design.md) · Related: [device linking](device-linking.md), [mobile-data policy](mobile-data.md)

Add an internet connection path for existing replication. Keep native storage, signatures, conflict resolution, membership, and LAN behavior unchanged.

## Check-ins

Protocol design and the first two changes can begin alongside library extraction. Server endpoint integration requires the [headless host](server-host.md).

| Change | Code boundary | Verification |
| --- | --- | --- |
| Bound unauthenticated messages | Harden [sharing receive paths](../../crates/sync-core/src/sharing/service.rs) with message-specific limits | Oversized/truncated proof and enrollment messages fail without large allocations; existing LAN/sharing tests pass |
| Prototype remote framing | Isolate an adapter around [Noise transport](../../crates/sync-core/src/transport.rs); specify WSS framing, negotiation, and connection states | Known/unknown versions, invalid frames, disconnects, and bounded queues tested without changing LAN behavior |
| Add the server endpoint | Connect the adapter to the server repository and membership checks; keep it disabled for public use during integration | No content before authentication/approval; removals fence active operations; acknowledged writes survive restart |
| Connect native hosts, one platform per check-in | Configure outbound connections at [desktop startup](../../desktop/src/main.rs#L180-L187), [Android runtime](../../android/app/src/main/java/com/prdoring/museamo/SyncRuntime.kt#L37-L46), and [iOS runtime ownership](../../ios/App/App/MuseamoPlugin.swift#L196-L205) | Each host passes reconnect, offline-edit, original-transfer, and LAN regression checks before the next is added |
| Carry shared-tag operations | Implement the reviewed operation mapping separately from personal-library transport | Existing sharing projections, membership, and private-field restrictions survive remote connections |

Complete [invitation enrollment](device-linking.md) and [metered-network enforcement](mobile-data.md) before enabling normal remote use. A working socket alone is not the remote-sync milestone.

## Transport contract

Existing LAN sync uses literal local addresses, TCP, Noise, pinned identities, and explicit pairing. Keep its discovery and connection rules unchanged.

Propose outbound secure WebSocket connections from native clients to a configured HTTPS origin. Carry the existing protocol with bounded frames, reusing Noise and signed operations where possible without introducing new conflict or membership rules.

- Verify TLS and the configured origin. Keep cryptographic peer pinning independent of DNS and certificates.
- Authenticate endpoint/version negotiation before releasing content. Version the transport separately from signed operation schemas; never rewrite historical signatures.
- Preserve matching-code confirmation and separate combine-library approval on both devices. Only the authenticated server owner can approve its side.
- Expose no summaries before peer authentication and matching-code confirmation, and no originals before combine-library approval and admission. Unpaired endpoints accept only bounded pairing traffic, preferably during an owner-opened enrollment window.
- Catch up from durable receipts with retry backoff, jitter, deadlines, and bounded queues. A lost connection must not acknowledge unapplied data.
- Transfer both ways over the client-initiated session; phones and private-network computers need no incoming public port.
- Recheck membership during active sessions and each data operation. Removal cannot instantly reach disconnected devices or erase their existing copies.
- Show an upgrade requirement for clients without remote support. They retain LAN operation and existing backup capabilities.

Ordinary linking must still refuse to merge separate sync groups. Use portable import to combine their content.

## Shared tags

Shared tags have separate protocol and authorization rules. Android/iOS manage QR invitations; linked desktops display and sync shared content without a QR scanner.

Specify which sharing operations use remote transport and preserve their projections and permissions. Web invitation management may be deferred; existing shared content may not be silently omitted.

This is not just personal-library catch-up: the current [shared-tag sync path](../../crates/sync-core/src/sharing/service.rs#L1551-L1570) exchanges collection state and then fetches missing media. Include that traffic in framing limits and the mobile-data budget.

## Public-exposure blocker

The [sharing service](../../crates/sync-core/src/sharing/service.rs) allows up to 512 MiB in `receive()`, including signature-proof exchange before peer verification. Later request headers are capped at 25 MiB and bulk requests require membership authorization, but neither bounds that earlier exchange. Records are capped at 60 KiB plus 16 bytes of encryption overhead.

Set message-specific pre-authentication limits and test resource use before public exposure. Never publish raw LAN or sharing listeners in the default deployment.

## Interoperability checkpoint

Run the [coordinator tests](../../crates/sync-core/src/coordinator.rs) and [SQLite integration tests](../../desktop/src/integration_tests.rs), then verify each supported native host with a disposable server:

- Changes in both directions, three-device concurrent edits, delete/restore/purge.
- Delayed originals, interrupted transfer, and reconnect after server downtime.
- Removal during a live session and an unsupported client version.
- Existing LAN sync and shared-tag privacy.
- iOS active, suspended, and reopened behavior; include its pending [physical acceptance scenarios](../ios-sharing-acceptance.md).

**Decisions needed:** framing, connection states, and protocol negotiation before the adapter; supported shared-tag operations before claiming compatibility.
