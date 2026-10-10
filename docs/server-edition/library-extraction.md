# Shared library extraction

[Overview](server-edition-design.md) · Next: [server host](server-host.md)

Move reusable desktop persistence into a Rust library. Each extraction check-in preserves desktop behavior; new server behavior belongs in a separate check-in.

## Check-ins

Each row is a separate proposed change, with its tests in the same check-in. Extract the core repository for the first [read-only increment](server-edition-design.md#delivery-increments); pull media and backup processing into the increments that need them rather than completing the entire table before starting the host.

| Change | Code boundary | Verification |
| --- | --- | --- |
| Separate identity access | Add the host-supplied identity boundary around [desktop identity](../../desktop/src/identity.rs); keep OS credential implementations in desktop | Same signing identity after reopen; missing/locked credentials remain errors; interrupted creation recovers |
| Separate change notifications | Replace Tauri coupling in [replication callbacks](../../desktop/src/replica.rs) with a host callback; desktop still emits `dataChanged` | Existing desktop updates and sync wakeups still occur after commit |
| Separate repository from host adapter | Within desktop, separate SQLite `impl Store` code in [replica](../../desktop/src/replica.rs) from `NativePlatform`; group it with [store](../../desktop/src/store.rs) and [sharing persistence](../../desktop/src/sharing.rs) | Desktop still compiles and passes replication/sharing tests before any crate move |
| Move the repository modules together | Move `Store` and all its inherent implementations into proposed `crates/library-core/`; keep `NativePlatform` and [Tauri dispatch](../../desktop/src/main.rs) in desktop | Unchanged paths, schema, IDs, Recovery, receipts, removal fences, and post-commit wakeups |
| Separate media processing | Extract reusable parts of [media](../../desktop/src/media.rs); leave file selection and delivery in the host | Import, checksum, reference tracking, and interrupted-transfer tests pass |
| Separate backup processing | Extract archive creation/import from [backup](../../desktop/src/backup.rs); retain desktop destination selection | Portable round-trip, conflict copies, Recovery, originals, and fresh-identity restore pass |

Rust requires inherent implementations to live in the crate that owns their type. Do not move `Store` while leaving its `impl Store` blocks in desktop. Prepare the repository/host boundary first, then move the repository modules together without cleanup or schema changes. Verify any media/backup dependencies during that preparation; preserve a buildable boundary rather than forcing an artificial split. Run the existing [desktop integration tests](../../desktop/src/integration_tests.rs) against each extracted portion before the server consumes it.

## Library boundary

The proposed dependency direction is:

```text
desktop ─┐
         ├─ library-core ─ sync-core
server ──┘
```

`library-core` owns repository validation, revisions, Recovery, tags, media bookkeeping, backups, and SQLite replication callbacks. Reuse common validation already in [`sync-core`](../../crates/sync-core/src/validation.rs).

Keep `sync-core` independent of SQLite and Tauri. Neither shared crate may require a graphical session or desktop credential service. Define host callbacks in shared code and implement them in each host. Names are provisional.

## What stays in each host

Desktop retains data-directory selection, Keychain/DPAPI/Secret Service adapters, file pickers, clipboard access, link opening, menus, startup registration, and window lifecycle. The server will translate library notifications into browser invalidation; desktop continues to emit `dataChanged`.

Separate backup creation from destination selection, media import from file selection, and media lookup from HTTP serving. Keep desktop bridge commands; change their implementation to call the library. Signing and replication callbacks remain native-only.

Android keeps Kotlin/Room and Keystore, with Rust sync through JNI. iOS keeps Swift/SQLite and installation-scoped Keychain credentials, with Rust sync through the [C ABI](../../crates/sync-core/src/ffi.rs). Neither mobile repository is part of this extraction. Preserve iOS schema-v2 migrations, transaction boundaries, identities, and callback shutdown ordering.

## Compatibility checks

- Preserve desktop data locations and on-disk formats. Extraction requires no user migration.
- Preserve transaction boundaries, migration order, idempotent capture IDs, signed operations, and stale-edit checks.
- Preserve scoped credential references and interrupted-creation recovery. Missing or inaccessible established keys must fail; never fall back from desktop keychain failure to server-style storage.
- Preserve Mac and Windows/Linux controls and lifecycle behavior.
- Keep existing LAN discovery, linking, replication, and mobile ABI/JNI contracts unchanged.

Later server metadata belongs in server-owned tables or a separate administrative database with explicit migrations—not in this refactor.
