# Remote device linking

[Overview](server-edition-design.md) · Requires: [owner authentication](server-host.md), [remote transport](remote-sync.md)

Configure a remote connection by QR scan or copied setup code, then use the existing device-approval flow. This is personal-device enrollment, not sharing a tag with another person.

## Check-ins

| Change | Scope | Verification |
| --- | --- | --- |
| Invitation records | Server-owned expiry, cancellation, reservation, and atomic redemption; no UI yet | Expired/cancelled/replayed codes fail; concurrent attempts admit at most one device; same-device retry bounds hold |
| Enrollment protocol | Bind the payload to origin, expected peer, and group; connect it to signed membership admission | Wrong peer/group rejected; first-device enrollment handled; summaries wait for matching-code confirmation and library content waits for combine approval |
| Owner setup screen | QR and copyable code, visible expiration, replacement/cancellation, and server-side approvals in the authenticated web UI | Recent authentication enforced; secrets absent from URLs/logs/storage; cancellation cannot remove existing devices |
| Native entry points, one platform per check-in | Phone scan or desktop paste feeds the same enrollment protocol through native bridge/runtime code | Destination confirmation, matching code, separate combine approval, interrupted retry, and successful catch-up |

Reuse suitable code and tests from the existing [shared-tag invitation service](../../crates/sync-core/src/sharing/service.rs), but never accept a tag-sharing invitation as authorization to link a personal device.

## Agreed invitation policy

Invitations are single-use and revocable, expire after ten minutes by default, show their expiration, and are easy to replace. Allow bounded retries by the same authenticated device, never a second admission. There is no permanent shared group password.

An invitation permits a linking attempt, not library access or bypassing either approval. Bind it to the intended group when one exists. The group identifier is neither a secret nor authorization. Invitation expiry/revocation does not affect linked devices; removing one still requires membership removal.

## Proposed flow

1. The owner chooses **Link a device**. Recent authentication opens a bounded enrollment window.
2. The server displays one versioned payload as a QR code and copyable setup code. It contains the HTTPS origin, expected server public identity, group identifier if one exists, and random invitation secret—not private device keys or owner credentials.
3. The native app asks the user to confirm the destination, verifies TLS and the server identity, and proves possession of the invitation secret over the protected connection.
4. Both sides confirm the matching code and separately approve combining libraries. A signed membership change admits the device under its own identity and consumes the invitation atomically. Expiry or cancellation invalidates it.

Keep invitation secrets out of URLs, logs, analytics, and persistent browser storage. Bound payload sizes and enrollment attempts. Separate sync groups still cannot be combined by ordinary linking.

## Decisions needed

Settle encoding, reservation/redemption under concurrency, retry bounds/resumption, and enrollment before a group exists. Prototype these mechanics before implementing the UI; the ten-minute/single-use policy is already agreed.
