# Mobile-data policy

[Overview](server-edition-design.md) · Applies to: [native remote sync](remote-sync.md)

Prevent automatic remote sync from consuming large amounts of mobile data. This policy is new work; incremental replication alone does not enforce it.

## Check-ins

| Change | Code boundary | Verification |
| --- | --- | --- |
| Transfer budget | Add testable scheduling/accounting policy around remote sends and requests, separate from conflict rules | Count both directions, retries, overhead, peers, and shared-tag traffic; budget survives reconnect/restart |
| Native network-cost adapters, one host per check-in | Feed route changes from [Android sync/network code](../../android/app/src/main/java/com/prdoring/museamo/SyncPlatform.kt), [iOS lifecycle integration](../../ios/App/App/MuseamoPlugin.swift), and the [desktop host](../../desktop/src/main.rs) into scheduling | Metered Wi-Fi and unknown routes handled conservatively; mobile handoff stops bulk scheduling with bounded in-flight bytes |
| Remote-transfer enforcement | Apply the budget to metadata batches and original upload/download requests, including incoming server data | First sync/large backlog and attachments defer; verified LAN sync still works without internet |
| Settings and waiting status | Add Wi-Fi-only preference, pending-transfer details, and scoped override through [sync UI](../../src/components/Devices.tsx) | Accurate waiting reasons; override is cancellable and does not authorize later transfers; local saves never appear failed |

Budget tests can be written before the remote adapter. Do not enable automatic remote sync on mobile data until enforcement and the native route-change checks pass.

## Agreed behavior

Allow small, budgeted text/metadata updates on mobile data; defer bulk transfers to unmetered connections. Offer **Wi-Fi only** to disable automatic remote sync on mobile data. Capture still saves locally.

| Situation | Default behavior |
| --- | --- |
| Unmetered Wi-Fi or wired connection | Catch up automatically, including attachments, while the host permits sync |
| Mobile data or another metered connection | Small text/metadata updates within a device-wide budget |
| Original attachments | No automatic uploads or downloads on metered connections |
| First sync or large backlog | Wait for an unmetered connection; keep linking/control traffic small and budgeted |
| **Transfer using mobile data** | Explicit, cancellable override for a selected transfer or bounded catch-up; show the size or state that it is unknown |

Text history and proofs can also be large. Limit bytes before sending or requesting batches, including incoming server data. Count uploads, downloads, retries, and protocol overhead across sessions, peers, and shared-tag traffic. Persist the budget across reconnects and restarts.

Use native network-cost information; treat metered Wi-Fi and unknown routes conservatively. On a switch to mobile data, stop scheduling bulk data, pause or close its stream, and retain resumable progress with bounded in-flight traffic. Overrides do not authorize later transfers.

Keep settings device-local and exclude verified LAN traffic from the mobile budget; LAN sync must work without internet. This policy applies to native replication, not browser traffic.

## Status

Show **Thoughts up to date · 12 attachments waiting for Wi-Fi** only when metadata is current. Otherwise show **Changes waiting for Wi-Fi** or **Mobile-data budget reached**, with pending-transfer details and an override. Waiting is not a failed save.

## Decisions needed

Choose byte limits, accounting period, backlog thresholds, platform network-cost handling, and in-flight allowance before automatic mobile-data sync. Test uploads and downloads, large text histories, retries, peer changes, process restart, and network handoff—not only a single small transfer.
