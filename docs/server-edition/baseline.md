# Repository baseline and integration checks

[Overview](server-edition-design.md)

Snapshot reviewed 2026-10-06. These results describe existing code, not verification of the unimplemented server.

## Integrated baseline

`webapp` merged [upstream](https://github.com/prdoring/Museamo) `main` at `8c33694` in `75d7dd6`, retaining the earlier `8ffeae7` history and fail-closed native platform routing. This baseline includes the desktop portability stack and native iOS storage, sync, and sharing.

The local `web:dev`, `web:build`, and `web:preview` commands use `dist-web/`; native frontend builds use `dist/`. The web target is still an in-memory preview. Server persistence, authentication, and remote transport are not implemented.

Android uses Kotlin/Room and Keystore, with Rust sync through JNI. iOS uses [Swift/SQLite and installation-scoped Keychain credentials](../../native/ios/MuseamoNative/README.md), with Rust sync through a C ABI. Neither mobile repository is part of the desktop extraction.

iOS implements capture, drafts, Recovery, media, manual location, LAN sync, and QR sharing while active. Portable backups, widgets, automatic location, and continuous background sync remain unavailable. Hardware acceptance is pending; LAN support does not establish server interoperability.

## October 6 checks

- [Upstream `d5f8bf7`](https://github.com/prdoring/Museamo/actions/runs/37540364605): frontend/tooling, native, Android, iOS, and Windows/Mac/Linux desktop jobs passed.
- [Upstream `8c33694`](https://github.com/prdoring/Museamo/actions/runs/37551659822): documentation-only checks passed; native/frontend jobs and release publication were skipped.
- [iPhone 0.4.4 (1.8.0)](../ios-sharing-acceptance.md): Apple accepted the upload. Processing, internal distribution, phone installation, and hardware acceptance remain unobserved or pending.
- Local `75d7dd6` plus web-build changes: TypeScript, 165 frontend tests, both frontend builds, 41 desktop and 51 sync-core Rust tests (including FFI), and 83 tooling tests passed. Vite emitted asset-resolution and chunk-size warnings.
- Local Swift tests were blocked by the missing generated XCFramework; full Xcode and `rustup` were unavailable. No local iOS simulator/UI, Android device, Windows/Linux build, or physical-device checks were rerun.

The older portability branch tips differ from `main` through historical merge wrappers, not missing implementation. iPhone sharing was squash-merged. Compare trees as well as ancestry on future integrations.

## Upstream workflow

Keep `webapp` as the downstream integration branch. Before each delivery increment and final verification, fetch upstream `main` and active platform branches, compare ancestry and trees, and incorporate relevant changes. Rebuild dependent branches when needed; exclude patches already integrated through squash merges or rebases.

Preserve local work and do not modify collaborator branches. Integrate small, buildable changes rather than waiting for an entire design area to finish. Rerun affected checks on the resulting tree and record the upstream base. Demonstrate each increment from that tree; record feedback, limitations, and the next selected outcome. Development can proceed independently of concurrent native work; upstream acceptance is a separate review.

This design does not authorize pushing, opening PRs, publishing, or deployment.

## Related documents

- [Architecture](../architecture.md)
- [Existing sync, trust, and backup semantics](../offline-sync.md)
- [Original portability stack](../pr-stack.md)
- [Desktop packaging](../desktop-packaging.md)
- [iOS native repository and boundaries](../../native/ios/MuseamoNative/README.md)
- [iPhone sharing acceptance and remaining limits](../ios-sharing-acceptance.md)
- [Change-scoped CI](../ci.md)
- [Release workflow](../releases.md)
