# Proposed Offline Design: Tunnel Inspection App

## 1. Purpose and scope

This design allows inspectors to continue working when Android tablets have no connectivity for up to eight hours inside a tunnel. Work is stored locally and synchronized when connectivity returns.

The design covers:

- Offline inspection-form editing
- Local photo capture and storage
- Reliable upload of photos and metadata
- Duplicate-safe synchronization
- Version-based conflict detection
- Supervisor conflict review
- Seven-year server-side change history
- Lost-device revocation

The design does not yet define automatic conflict merging, remote wiping, retention exceptions, or detailed user-permission rules.

## 2. Operating assumptions

There are up to 40 Android tablets. Each tablet may capture up to 200 photos per day, or approximately 8,000 photos per day across all tablets at peak usage.

A tablet may be offline for eight hours, so local storage must accommodate:

- Inspection data created or edited during the offline period
- All locally captured photos awaiting upload
- The synchronization outbox
- Temporary upload state and retry metadata

Required photo capacity depends on the average photo size and the chosen storage headroom. It should be calculated before hardware and storage limits are finalized.

## 3. High-level architecture

Each tablet contains three local layers:

1. **Encrypted SQLite database**
   - Inspection forms and their local state
   - Photo records, paths, and checksums
   - Pending synchronization operations
   - Synchronization cursor and conflict state

2. **Encrypted device file storage**
   - Original photo files
   - Files are referenced by stable photo IDs
   - SQLite stores the path and checksum, not the image contents

3. **Synchronization worker**
   - Runs when connectivity is available
   - Uploads photos before their metadata
   - Sends pending operations to the server
   - Retries safely after failures or process termination
   - Pulls server changes and conflict outcomes

The server continues to use object storage for photos and a database or service layer for inspection data, versions, conflicts, and append-only change events. The existing CRUD API may be extended with synchronization-specific behavior, or a dedicated sync API may be introduced.

## 4. Local data model

The exact schema remains to be finalized, but the main records should include the following.

### Inspection form

- `inspection_id`
- Form fields and local form status
- `server_version`
- `base_server_version` used for the current edit
- Local modified timestamp
- Last modifying user and device
- Synchronization state
- Conflict state, if applicable

### Photo

- `photo_id`, generated on the device
- `inspection_id`
- Encrypted local file path
- Content checksum
- Capture timestamp
- Photo metadata
- Upload status
- Object-storage reference, once uploaded

Photo IDs should be unique and stable. Photo objects should be immutable from the synchronization system’s perspective. A changed image should be represented as a new photo record rather than overwriting an existing object.

### Outbox operation

Each operation should have a stable client-generated identifier:

- `operation_id`
- `device_id`
- User identity
- Operation type
- Entity identifier
- Payload
- Base form version
- Creation timestamp
- Retry count and state
- Server result, once acknowledged

The local form update and its corresponding outbox entry should be committed in one SQLite transaction. This prevents a form change from being saved without a synchronization record.

## 5. Synchronization workflow

Synchronization should use at-least-once delivery with idempotent server processing. Network retries, process restarts, and duplicate requests are expected.

### Photo upload

For each photo:

1. Read the local file and calculate or verify its checksum.
2. Upload the file to object storage with a deterministic object identity, such as a photo ID plus checksum.
3. Confirm that the stored object matches the expected checksum.
4. Mark the photo as uploaded locally.
5. Send the inspection metadata operation referencing the uploaded object.

The server should verify that the referenced object exists and has the expected checksum before accepting photo metadata.

If an upload succeeds but the tablet loses connectivity before receiving the response, the retry must detect the existing object and avoid creating a duplicate. Object-storage keys and metadata operations should therefore be deterministic and duplicate-safe.

### Form operation

A form update includes:

- The inspection ID
- The complete update or a well-defined patch
- The version on which the update was based
- The operation ID
- The user and device identity

The server processes it using compare-and-swap semantics:

```text
accept only if submitted_base_version == current_server_version
```

When accepted:

1. Apply the update.
2. Increment the server version.
3. Record an append-only change event.
4. Store the result against the operation ID.
5. Return the new version.

If the operation ID is received again, the server returns the original result instead of applying the update again.

## 6. Conflict handling

If the submitted base version does not match the current server version, the server must not overwrite the current form.

Instead, it should:

1. Preserve the incoming operation and its payload.
2. Preserve the current server version and content.
3. Create a conflict record.
4. Place the conflict in the supervisor review queue.
5. Return a conflict response to the device.
6. Record the attempted change for audit purposes.

The tablet should retain the inspector’s local data and mark the form as needing conflict resolution. It should not silently discard the local edit.

The supervisor workflow still requires product decisions. Possible resolution options include:

- Keep the server version
- Apply the incoming version
- Select fields from each version
- Edit a final resolved version manually

Regardless of the chosen UI, the resolution itself should create a new version and a new change event. The original conflicting submission should remain available for review.

## 7. Pulling server changes

When a tablet reconnects, synchronization must operate in both directions:

- Upload local outbox operations
- Download server changes relevant to that device or user
- Advance a durable synchronization cursor only after changes are safely stored locally

The pull protocol should be resumable. A tablet crash during download must not cause changes to be skipped or applied repeatedly in a harmful way.

Server changes should be identified by a stable event or sequence identifier. The device can use that identifier as its synchronization cursor.

The design must also define how edits made by supervisors are surfaced on devices that have local copies of the affected inspection. Version checks protect against silent overwrites, but the product behavior for newly downloaded server changes still needs to be specified.

## 8. Change history and retention

The server should maintain append-only change events for at least seven years.

Each event should include, at minimum:

- Event ID
- Inspection or entity ID
- Who made the change
- Device ID
- Device event timestamp
- Server receipt timestamp
- Operation ID
- Previous and resulting version
- Description or structured diff of what changed
- Whether the event was accepted, rejected as a conflict, or created through conflict resolution

The photo file itself should not be copied into the event log. Events should reference the photo ID and checksum.

The server timestamp should be retained alongside the device timestamp because a device may have an incorrect clock while offline. The authoritative timestamp policy remains to be decided.

Retention storage, archival format, legal hold behavior, and deletion procedures must be defined before implementation.

## 9. Security and device revocation

The device database and photo files should be encrypted at rest. The encryption key should be protected by the Android operating system’s secure key store.

The device should authenticate when synchronizing, and all synchronization traffic should use authenticated encrypted transport. The exact authentication mechanism and token lifetime are still open decisions.

If a tablet is lost:

1. An administrator revokes its device identity on the server.
2. The server rejects future synchronization attempts from that device.
3. Existing operations from the device remain attributable through its device ID.
4. The device cannot be assumed to receive a remote wipe command while offline.

Revocation therefore prevents future server access but does not immediately erase data already stored on an offline tablet. Whether remote wipe, key invalidation, or other device-management controls are required should be decided separately.

## 10. Failure and recovery behavior

The synchronization worker must tolerate:

- Connectivity dropping during an upload
- Application termination
- Tablet restart or battery loss
- Duplicate requests
- Object upload succeeding while metadata submission fails
- Metadata submission succeeding while its response is lost
- Full or nearly full local storage
- Invalid or corrupted photo files
- Device revocation while operations are pending
- Schema upgrades while unsent operations remain

The server should return durable operation results so the device can safely clear an outbox item only after it knows whether the operation was accepted, conflicted, or rejected.

Photo cleanup must be conservative. A local photo should not be deleted until the system has confirmed that the server has the required object and metadata, subject to the product’s local-retention policy.

## 11. Main trade-offs

This design provides continued inspection capability during connectivity loss, but introduces:

- More state on every device
- A synchronization worker and retry state
- Temporary storage requirements for photos
- More complicated recovery and testing
- Delayed visibility of other users’ changes
- Supervisor work when concurrent edits conflict
- Operational requirements for key management, revocation, and retention

It also avoids relying on exactly-once network delivery. Correctness comes from stable identifiers, version checks, durable operation results, and idempotent server behavior.

## 12. Decisions required during design review

The following items should be resolved before implementation is considered complete:

- Maximum local photo capacity and storage-headroom target
- Whether photo uploads require resumable or multipart transfer
- Full-update versus field-level patch representation
- Conflict-resolution options for supervisors
- Whether conflict submissions are included in the formal change-event stream
- How supervisor changes are delivered to tablets
- Authentication and authorization model
- Device-key rotation and revocation behavior
- Whether remote wipe or mobile-device-management integration is required
- Authoritative timestamp policy
- Seven-year archival and deletion policy
- Behavior when local storage is full
- Whether users may edit or delete already synchronized photos
- API compatibility strategy for the existing CRUD system

## 13. Proposed acceptance criteria

A design implementation should demonstrate that:

- An inspector can create and edit forms for eight hours without connectivity.
- Photos remain available locally until their server-side storage and metadata are confirmed.
- Repeated upload requests do not create duplicate photos, metadata, or form changes.
- A stale form update never silently overwrites a newer server version.
- Conflicts reach the supervisor review queue with enough context to resolve them.
- Every accepted change is attributable to a user, device, operation, and timestamp.
- Seven-year event retention is operationally supported.
- A revoked device cannot synchronize after revocation.
- Crashes and connectivity loss at each synchronization step can be recovered safely.