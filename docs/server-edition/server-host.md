# Server host and owner access

[Overview](server-edition-design.md) · Requires: [shared library](library-extraction.md) · Next: [browser access](browser-access.md)

Add a headless host with durable identity and owner authentication. These check-ins support the first [sign-in/read-only increment](server-edition-design.md#delivery-increments); they need the core repository and its dependencies, not completed media or backup features. Library commands arrive in the corresponding browser check-in, after authentication passes. Internet sync remains unavailable.

## Check-ins

Proposed code lives in `server/`; reuse the extracted library rather than desktop UI commands.

| Change | Scope | Verification |
| --- | --- | --- |
| Persistent server identity | Implement the selected credential provider and its administrative recovery path | Stable identity across restart; atomic creation; missing/corrupt established keys stop startup |
| Headless lifecycle | Open one library under an exclusive process lock; add readiness and graceful shutdown | No desktop runtime dependency; second writer rejected; durable writes and crash recovery |
| Owner bootstrap and recovery | Administrative setup-token command, owner initialization, and shell recovery | Setup expiry/reuse rejected; setup disabled after initialization; password recovery preserves library and sync keys |
| Session storage | Opaque token records, rotation, expiration, and revocation, tested without HTTP routes | Idle/absolute expiry, revoke-one, and sign-out-everywhere preserve device membership |
| Authentication routes and guards | Login/logout, secure cookies, recent-auth checks, CSRF, origin validation, and throttling | Authentication tests pass before any library route is exposed |

Choose the HTTP/auth components before implementing these endpoints. Keep the credential provider and lifecycle tests independent of network access.

## Lifecycle and persistence

Run one process per library volume, holding an exclusive process lock. Serialize mutations through one writer or equivalent transaction discipline. HTTP, sync, and backup jobs use the same repository.

Acknowledge saves and notify sync/browser clients only after durable commit. Use a consistent lock order; never hold repository locks across network waits or callbacks that reenter storage. Stream uploads and archives.

Before serving requests, validate configuration, storage version, identity, and secrets; recover or remove abandoned staging files after checking references. On shutdown, stop accepting mutations, finish or roll back transactions, stop background work, then release the lock.

Keep owner credentials, sessions, backup settings, and endpoint hints outside replicated content. Restarts and upgrades retain identity; missing or corrupt established keys stop startup.

Readiness exposes no library content, paths, device inventory, or secrets. Test disk-full and interrupted-write failures as well as ordinary restarts.

## Credentials

Propose one owner account per installation, with no central identity service or public registration. Keep credential lifecycles separate:

| Credential | Storage | Reset behavior |
| --- | --- | --- |
| Owner password | Salted Argon2id hash in server-owned authentication storage | Revoke browser sessions; retain library and device identity |
| Browser session | Random opaque token in a secure cookie; hashed server-side record | Expire or revoke independently of native membership |
| Server device identity | Persistent, restricted server credential store | Never silently regenerate for an existing library |
| Native device identity | Existing desktop providers, Android Keystore, and iOS installation-scoped Keychain | Existing pairing and removal rules apply |
| Off-host backup credentials or encryption secret | Separate server secrets, excluded from portable exports | Separate operator recovery procedure |

The server identity provider must work unattended, use restrictive permissions, and write keys atomically and durably. Consider a separately mounted wrapping secret for stored keys; the provider and recovery format remain open. The owner password must neither unlock daemon startup nor encrypt sync keys.

Preserve the [iOS provider's](../../native/ios/MuseamoNative/Sources/MuseamoNative/SyncIdentity.swift) device-only, while-unlocked Keychain behavior. Missing or inaccessible keys must not reset an enrolled installation. This provider is not suitable for an unattended server.

## Owner authentication

An administrative command issues a short-lived, single-use setup token in its output, not request logs. Store its verifier and consume it atomically. Setup over HTTPS creates the owner password, then disables further setup.

Use maintained password/session components and benchmark Argon2id on the supported VPS. Set a `__Host-` cookie with `Secure`, `HttpOnly`, `SameSite`, `Path=/`, and no domain override. Enforce idle and absolute expiration, rotate sessions after authentication, and support individual revocation and sign-out-everywhere. Cookie attributes do not replace CSRF protection.

Throttle login, setup, recovery, and unauthenticated connections with bounded state. Require recent authentication for credential changes and device linking. Password recovery runs through the VPS shell and revokes sessions without changing sync keys or data. Defer passkeys and external identity providers.

## Privacy

The VPS administrator can read the library; transport encryption does not hide it from the host. Local browser drafts also contain private text. Backup encryption uses a separate secret and recovery procedure.

Never log thought text, passwords, tokens, or private keys. Do not expose internal paths or credential-provider diagnostics to unauthenticated callers.

## Decisions needed

- **Before real identities:** credential provider, wrapping-secret choice, and recovery format.
- **Before server endpoints:** HTTP/auth libraries and resource limits, informed by the extraction and transport prototype.
- **Before public access:** session policies, throttling, and password-hashing cost.

Implementation references: OWASP [password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [sessions](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), and [authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
