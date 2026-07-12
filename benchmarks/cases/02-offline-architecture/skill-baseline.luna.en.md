# Proposed Offline Design for the Tunnel Inspection App

## Purpose

The app must allow inspectors to continue working for up to eight hours without connectivity, then synchronize inspection forms and photos safely when a connection returns. The design must preserve seven years of change history and prevent concurrent edits from silently overwriting one another.

The central design choice is to treat each tablet as a temporary working replica of the server. The tablet records local changes immediately, while an outbox preserves those changes until synchronization succeeds.

## Operating assumptions and constraints

Forty inspectors use Android tablets. Each tablet may be offline inside a tunnel for up to eight hours and may capture up to 200 photos per day. An inspection form is normally edited by one inspector, but a supervisor may correct it later.

The current system assumes continuous connectivity and exposes a CRUD API backed by object storage. The offline design therefore requires synchronization semantics in addition to the existing resource operations.

The device stores inspection data in encrypted SQLite. Photo files remain in encrypted device storage; SQLite stores each photo's path and checksum. The device encryption key is held in the operating system's secure key store, and an administrator can revoke a lost device.

## Device-side data and state

SQLite should contain the local inspection record, its last known server version, photo metadata, and the outbox of unsent operations. Each locally created or modified operation needs a stable operation identifier so that a retry can be recognized as the same operation rather than applied twice.

The outbox should retain enough information to retry an operation after process termination, application restart, or intermittent connectivity. An operation is not considered synchronized until the server has acknowledged it.

Photo files and their SQLite metadata have different lifecycles:

- The photo file is the payload stored on the device.
- SQLite records the path, checksum, inspection association, and synchronization state.
- The outbox records the operation that makes the photo available to the server.

A photo should not be treated as synchronized merely because its metadata operation was accepted. The server must have verified or accepted the corresponding object-storage upload first.

Before an offline inspection begins, the device must already have the forms and other required reference data it will need. The exact assignment and prefetch behavior has not yet been decided.

## Synchronization flow

Synchronization should process each photo in two phases:

1. Upload the photo to object storage together with its checksum.
2. Send the photo metadata only after the upload has completed successfully.

The metadata operation can then refer to an object that the server can retrieve. If the upload is interrupted, the device retries the upload and does not send the metadata prematurely.

Every synchronization operation must be safe to repeat. A practical implementation requires stable identifiers for operations and photos. On retry, the server should return the existing result when the same operation identifier has already been applied. If the same identifier is reused with different content, the server should reject it rather than treating it as a new operation.

The checksum serves as an integrity check for the photo payload. A retry with the same photo identifier and checksum should be accepted as the same upload. A checksum mismatch should be treated as an error requiring investigation or re-capture; it must not replace the existing object silently.

Form updates follow the same retry principle, but they also require version checking. The device sends the form's last known server version with the update. The server applies the update only when that version still matches the current version.

A successful form update advances the server version and clears the corresponding outbox operation on the device. A retry after a lost response must return the prior operation result rather than apply the update again.

## Conflict handling

A version mismatch means that another update has been accepted since the device last read the form. The server must not overwrite the current form or automatically merge the update unless a separate merge policy is approved.

Instead, the mismatched update is retained as a conflict and placed in a supervisor review queue. The queue should expose the current server version and the proposed update so that a supervisor can decide how to resolve the difference.

Conflict resolution must itself be recorded as a change. The resolved form should be submitted against the current version, and the server should advance the version again. The original conflicting operation and the supervisor's decision remain part of the history.

This model covers both an inspector synchronizing after another change and a supervisor correcting a form after an inspector has worked on it. It intentionally favors explicit review over silent data loss.

The product decision still needed is whether supervisors may resolve conflicts field by field, choose one complete version, or edit a combined result. Until that behavior is defined, the synchronization layer should preserve both versions without assuming a merge strategy.

## Server-side history and retention

The server stores append-only change events recording:

- who made the change;
- what was changed;
- when it was changed;
- which device made the change.

The event record should also identify the affected inspection and the originating operation so that retries can be distinguished from new changes. Change events must not be rewritten when a conflict is resolved; later corrections should be represented by later events.

The seven-year retention requirement applies to the change history. The retention mechanism, archival storage, deletion policy after seven years, and retrieval requirements have not yet been decided. Those decisions should be made before implementation because they affect storage cost, audit access, and operational procedures.

The server's current CRUD API may continue to serve ordinary online reads and writes, but offline synchronization requires operations for version-aware updates, idempotent retries, photo-upload completion, and conflict retrieval or resolution. The exact API shape is an implementation decision.

## Security and lost devices

Inspection data and photos are encrypted on the device. The device key remains in the operating system's secure key store rather than in application-managed storage.

Administrators can revoke a lost device. The review must define the effect of revocation, including whether the server rejects future synchronization from that device, whether already-issued credentials are invalidated, and how unsynchronized local data is handled. Revocation cannot recover data that exists only on the lost tablet, so the product and operational policy should state what inspectors must do when a device is lost before synchronization.

The server should authenticate the device and associate every accepted operation with both the inspector and device identity used to submit it. Authentication details and key-rotation behavior remain open design points.

## Main trade-offs

This design allows inspections to continue through an eight-hour connectivity gap, but it moves more state and responsibility onto each tablet. The device must track local records, server versions, photo files, checksums, outbox operations, retries, and synchronization status.

Temporary device storage will be required for photos captured before synchronization. Capacity planning must account for the maximum expected offline period, failed uploads, retries, and any photos retained after a successful upload. The known upper bound is 200 photos per tablet per day, but photo size and the required local retention period have not been specified.

Conflict resolution is delayed until synchronization and may require supervisor work. This is the cost of preventing concurrent updates from silently overwriting one another.

The server and synchronization service also become more complex than a simple CRUD implementation. They must support idempotency, version checks, durable conflict records, photo integrity validation, and append-only history.

## Decisions required in design review

The proposed design establishes the following boundaries:

- SQLite is the encrypted local source of pending inspection work.
- The outbox is the durable source of unsent operations.
- Photo bytes are uploaded and checksum-checked before photo metadata is submitted.
- Retries use stable identities and must not create duplicate effects.
- Form updates require a matching server version.
- Version mismatches become supervisor-review conflicts.
- Change history is append-only and retained for seven years.
- Device keys use the operating system's secure key store, with administrator-controlled device revocation.

The review should next decide:

- how forms and assignments are prefetched before tunnel entry;
- the exact synchronization API and retry acknowledgements;
- the conflict-resolution interaction and merge rules;
- local photo capacity and cleanup behavior;
- the effect of device revocation;
- the seven-year archival and retrieval policy;
- authentication and credential-rotation behavior for devices.