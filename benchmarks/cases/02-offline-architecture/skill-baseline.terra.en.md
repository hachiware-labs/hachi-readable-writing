# Proposed Offline Design for Tunnel Inspections

## Purpose

Inspectors must be able to complete inspections for up to eight hours without connectivity, while preserving photos, form changes, and an auditable history. The design keeps inspection work local first, then synchronizes it safely when a connection returns.

## Design overview

Each Android tablet will store its assigned inspection data in encrypted SQLite. The tablet will also maintain an outbox of operations that have not yet been accepted by the server. Photos remain in encrypted device storage; SQLite records each photo’s local path and checksum.

This separates field work from network availability. An inspector can edit a form and capture photos inside a tunnel without waiting for the server. When connectivity returns, background synchronization uploads and records the pending changes.

## Synchronization model

Photos must be uploaded to object storage before their metadata is sent to the server. The metadata operation includes the photo checksum, allowing the server to associate the inspection record with the uploaded object.

All operations must be idempotent: retrying an upload or metadata update must not create duplicate photos, forms, or change events. This is necessary because a tablet may lose connectivity during synchronization and retry after an unknown server outcome.

The synchronization sequence is:

1. The tablet writes the local form change, photo reference, or other operation to encrypted SQLite and its outbox.
2. For a pending photo, the tablet uploads the encrypted-device-stored file to object storage using its checksum.
3. After the upload is accepted, the tablet sends the photo metadata and other pending operations to the server.
4. The tablet removes an outbox entry only after the server confirms that the operation has been accepted or has already been applied.

The design does not assume a connection during an inspection session. It does assume that the tablet eventually reconnects before its local storage capacity or administrative policy requires intervention.

## Form updates and conflicts

An inspection form normally has one editor, but supervisors may later correct it. The server therefore stores a version number for each form.

Each form update includes the version on which the device based its edit. If that version matches the current server version, the server applies the update and advances the version. If it does not match, the server must not overwrite the newer data silently. Instead, it records the submitted update as a conflict and places it in a supervisor review queue.

This favors preservation over automatic merging. It avoids losing an inspector’s offline work, but it means some changes remain unresolved until a supervisor reviews them.

## Change history and retention

The server will store append-only change events for inspection activity. Each event records:

- who made the change;
- what changed;
- when it changed; and
- which device submitted it.

These events provide the history required for seven-year retention. Form state can change over time, but prior events are retained rather than replaced. Conflicted updates should also be represented in this history so that the review outcome does not erase evidence of the original submission.

## Device security and administration

Inspection data in SQLite and photos in device storage are encrypted. The device encryption key is held in the operating system’s secure key store rather than stored directly in application data.

An administrator can revoke a lost device. The precise behavior after revocation—for example, whether the device may continue working offline or must be blocked at its next contact with the server—has not been decided and requires a product and security decision.

## Trade-offs

The offline model introduces complexity that the current continuously connected CRUD design does not need:

- Each tablet becomes a temporary source of inspection state and must retain data until synchronization succeeds.
- Photos may accumulate locally during an eight-hour disconnected period, so device storage capacity is a practical constraint.
- Retrying operations safely requires stable identifiers and server-side idempotency handling.
- Conflicts are delayed until synchronization and may require supervisor review rather than immediate resolution.

These costs are necessary to prevent tunnel connectivity from blocking inspection work or causing silent data loss.

## Decisions requested in review

The proposed design asks the review group to approve these core choices:

1. Use encrypted SQLite plus an outbox as the tablet’s offline inspection store.
2. Keep photos in encrypted device storage, referenced by SQLite path and checksum.
3. Upload photos before their metadata, with idempotent retry behavior for all operations.
4. Reject mismatched form versions into a supervisor conflict queue rather than overwriting data.
5. Retain append-only server change events for seven years.
6. Use the operating system secure key store and support administrator device revocation.

Storage limits, post-revocation behavior, conflict-review workflow details, and any guarantees beyond these decisions remain open.