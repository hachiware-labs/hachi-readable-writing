# Proposed Offline Design for the Tunnel Inspection App

## Summary

The app will use an offline-first design so inspectors can continue working on Android tablets during connectivity gaps of up to eight hours. Inspection data and pending changes will be stored locally in encrypted SQLite. Photos will remain as encrypted files on the device until synchronization uploads them to object storage.

Synchronization will be asynchronous and retryable. The server will detect conflicting form updates using version numbers rather than allowing one user’s changes to silently overwrite another’s. Every accepted change will also produce an append-only audit event retained for seven years.

This design supports the known tunnel workflow, but introduces additional device-state, synchronization, and temporary-storage complexity.

## Context and goals

Forty inspectors use Android tablets in locations where connectivity may be unavailable for an entire working period inside a tunnel. A tablet may capture as many as 200 photos in one day.

The current system assumes continuous connectivity and exposes a CRUD API backed by object storage. That model must be extended so that an inspector can:

- View locally available inspection data while offline.
- Edit an inspection form without waiting for a network connection.
- Capture and associate photos while offline.
- Synchronize pending work after connectivity returns.
- Retry interrupted synchronization without creating duplicate records or uploads.

Inspection forms are normally edited by one inspector. A supervisor may correct a form later, so concurrent or stale edits remain possible even if they are uncommon.

## Proposed architecture

The device will maintain three related kinds of state:

1. Inspection records in encrypted SQLite.
2. An outbox of operations that have not yet been accepted by the server.
3. Photo files in encrypted device storage.

SQLite will contain photo metadata, including each file’s local path and checksum. The binary photo data will not be stored in the database.

The server will continue to be the shared system of record. It will store inspection forms, form version numbers, photo metadata, references to objects in object storage, conflicts awaiting review, and append-only change events.

The device’s local data is therefore a working copy with pending operations, not a separate authoritative database.

## Local changes and the outbox

When an inspector edits a form, the app will commit both the local edit and its corresponding outbox operation to SQLite. These writes should occur in the same database transaction so that a local change cannot be saved without also becoming eligible for synchronization.

Each outbox operation will have a stable identifier generated once on the device. Retries must reuse this identifier. The operation will also identify the device and user and include the server version on which the edit was based.

An operation remains in the outbox until the server returns a definitive result, such as acceptance or conflict. Network failures and uncertain responses leave the operation pending so it can be retried.

Every server-side synchronization endpoint must be idempotent. Repeating an operation with the same identifier must return the existing result rather than applying the change again or creating a duplicate.

## Photo handling

A captured photo will be written to encrypted device storage. SQLite will record its local path, checksum, inspection association, and synchronization state.

Photo synchronization occurs in this order:

1. The device uploads the photo to object storage with its checksum.
2. The checksum is verified as part of the upload process.
3. After the upload succeeds, the device sends the photo metadata to the server.
4. The server associates the stored object with the inspection.
5. The device records that the photo has been synchronized.

Both the object upload and metadata operation must be safe to repeat. A retry must resolve to the same logical photo rather than create another object or metadata record.

Photo metadata must not be accepted as synchronized before its object is successfully stored. If the upload succeeds but the response is lost, the device should retry using the same stable identity and checksum.

The device must retain an unsynchronized photo locally. Rules for removing synchronized local photos, storage thresholds, and behavior when the tablet is close to full have not yet been decided.

## Form versioning and conflicts

The server will maintain a version number for every inspection form. An update from a device will include the version the device originally read.

If that version matches the current server version, the server may apply the update and advance the version.

If it does not match, the server must not silently overwrite the current form. Instead, it will:

- Preserve the submitted update as a conflict.
- Preserve the current server state.
- Add the conflict to a supervisor review queue.
- Return a conflict result to the originating device.

A conflict is a terminal synchronization result for that particular operation, rather than a transient error that should be retried indefinitely. Any later correction resulting from supervisor review should be recorded as a new change.

Automatic field-level merging is not part of the proposed design. The detailed supervisor review experience and resolution rules remain to be defined.

## Change history and retention

The server will write an append-only change event for each accepted form change. Events will record:

- Who made the change.
- What changed.
- When it changed.
- Which device originated the change.

The event history must be retained for seven years. Events are not updated in place or deleted as part of normal form editing. A supervisor correction creates another event rather than rewriting earlier history.

The operational details needed to enforce and verify seven-year retention—including archival, backup, restoration, and deletion controls—still require definition.

## Security and lost-device handling

Inspection data in SQLite and photo files in device storage will be encrypted. The device encryption key will be held in the Android operating system’s secure key store rather than stored directly with the application data.

An administrator will be able to revoke a lost device. Once the server recognizes a device as revoked, it must reject further synchronization attempts from that device.

Revocation protects server access after it takes effect. It does not by itself establish a remote-wipe guarantee or prove that locally stored data has been erased. No such guarantee is included in the current proposal.

## Synchronization behavior

Synchronization will run in the background when connectivity is available. Work may be processed in batches, but acknowledgements must be tracked per operation so that partial success is recoverable.

The design must expect interruptions at any point, including:

- Before a request reaches the server.
- After the server applies an operation but before the device receives the response.
- During a photo upload.
- Between a photo upload and its metadata operation.
- While only part of an outbox batch has completed.

Stable operation identities, checksums, server-side deduplication, and persistent local states allow synchronization to resume safely after these interruptions.

The design does not currently promise immediate synchronization, a maximum time to synchronize after reconnection, or support for additional devices editing the same form simultaneously.

## Main trade-offs

The primary cost is greater complexity. The app must manage local records, pending operations, photo lifecycle states, retries, acknowledgements, conflicts, and device revocation. The server must provide idempotent operations and retain enough information to recognize retried requests.

Photo capture also creates a potentially significant temporary-storage requirement. A tablet may accumulate up to 200 photos per day, including all photos captured during an eight-hour offline period. Required device capacity cannot be calculated until expected photo sizes and local-retention rules are known.

Finally, version-based conflict handling favors data safety over immediate convergence. Edits are not silently lost, but a form may remain unresolved until a supervisor reviews the conflict.

## Design-review decisions still required

The following items are intentionally left open because no product behavior or guarantee has yet been agreed:

- Which inspection data must be downloaded before entering a tunnel.
- Local storage limits and low-storage behavior.
- How long synchronized photos remain on a tablet.
- Photo compression, resolution, and maximum file size.
- Synchronization ordering and batching across multiple inspections.
- The supervisor conflict-review and resolution workflow.
- How devices display pending, synchronized, failed, and conflicted work.
- Authentication behavior during long offline periods.
- Audit-history archival, backup, restoration, and verified retention.
- Expected synchronization latency or availability guarantees.
- Whether administrative revocation is accompanied by any remote-wipe capability.

These decisions can refine the design, but they do not change its central model: durable local work, an idempotent outbox-based synchronization process, photo upload before metadata, explicit version conflicts, and append-only server-side history.