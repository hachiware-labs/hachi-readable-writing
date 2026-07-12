# Proposed Offline Architecture for Tunnel Inspections

## Purpose

The inspection app must remain usable when an Android tablet has no connectivity for up to eight hours. The proposed design makes each tablet temporarily authoritative for work performed offline, then synchronizes that work without duplicating operations or silently overwriting later changes.

This design supports forty inspectors, up to 200 photos per tablet per day, later corrections by supervisors, and seven years of change history. It does not introduce product behavior or guarantees beyond these requirements.

## Architecture Overview

Each tablet stores inspection data in encrypted SQLite. Photos remain as files in encrypted device storage, while SQLite records their paths and checksums. An outbox records operations that have not yet been accepted by the server.

When connectivity returns, background synchronization uploads photos first and then sends their metadata and inspection operations. The server applies repeatable operations, detects version conflicts, and records every accepted change as an append-only event.

```text
Android tablet                              Server
┌──────────────────────────┐               ┌──────────────────────────┐
│ Inspection application   │               │ Synchronization API      │
│                          │               │                          │
│ Encrypted SQLite         │   operations  │ Inspection forms         │
│ - inspection data        ├──────────────►│ - current state          │
│ - photo paths/checksums  │               │ - version number         │
│ - synchronization state  │               │                          │
│ - outbox                 │               │ Conflict review queue    │
│                          │               │                          │
│ Encrypted photo storage  │   photo file  │ Append-only change events│
└─────────────┬────────────┘──────────────►│                          │
              │                            │ Object storage           │
              ▼                            └──────────────────────────┘
     OS secure key store
```

## Local-First Operation

Inspectors must be able to create and edit inspection forms without waiting for a network request. Each local change is committed to SQLite together with an outbox operation. This keeps the visible inspection state and the work awaiting synchronization consistent on the device.

The tablet retains pending operations until the server accepts them. A temporary network failure therefore delays synchronization but does not require the inspector to repeat the edit. The outbox also allows synchronization to resume after the application or tablet restarts.

The current CRUD API assumes that the server is always reachable. Offline support requires a synchronization interface that accepts recorded operations and their version context, rather than treating each request as an isolated overwrite of the latest server state.

## Photo Storage and Synchronization

Photo files remain in encrypted device storage because storing up to 200 photos per day directly in SQLite would make the database unnecessarily large. SQLite instead stores each file’s local path, checksum, and synchronization state.

Synchronization preserves the following order:

1. Upload the photo file to object storage with its checksum.
2. Confirm that the upload has been accepted.
3. Send the photo metadata that associates the stored object with the inspection.
4. Retain or retry unfinished work if any step fails.

This order prevents server metadata from referring to a photo that has not reached object storage. The checksum identifies the intended file and allows the server to verify that repeated upload attempts refer to the same content.

Every synchronization operation must be safe to repeat. The proposed protocol should therefore assign stable identifiers to operations and photo uploads so that a retry returns the previously accepted result instead of creating another event, object, or metadata record. The exact identifier format and server-side deduplication period remain implementation decisions for review.

Photo files must remain on the tablet while their uploads are pending. Local capacity therefore depends on photo size, the duration of disconnection, and how long failed uploads may remain queued. Those inputs are not yet specified, so this proposal does not claim a minimum storage requirement or define when synchronized photos may be removed.

## Form Versions and Conflict Handling

The server stores a version number for each inspection form. An operation that updates a form includes the version on which the edit was based.

If that version matches the current server version, the server applies the update and advances the version. If it does not match, the server must not silently overwrite either edit. It retains the incoming update as a conflict and places it in the supervisor review queue.

This policy fits the expected editing pattern: a form normally has one inspector, so most synchronization remains straightforward, while later supervisor corrections can produce overlapping changes. Conflict resolution is deliberately delayed until a supervisor can review the competing versions. Automatic field-level merging is not part of the proposed design.

The review workflow, including how competing values are displayed and how a supervisor records the chosen result, still requires product definition. Any resolution must itself be recorded as a new change rather than rewriting history.

## Change History

The server records append-only change events describing who changed what, when, and on which device. These events are retained for seven years.

The current form record represents the latest accepted state, while the event history provides the durable audit trail. Conflict submissions and supervisor resolutions should remain distinguishable in that history so reviewers can reconstruct how the final state was reached.

Because tablets can be offline, device-recorded time and server receipt time may differ. The required interpretation of “when” has not been decided. The event schema should preserve enough information to establish both the originating device context and the server’s processing order, but the authoritative timestamp policy requires review.

## Device Security and Revocation

Inspection data, synchronization state, and photo references are stored in encrypted SQLite, while photo files are held in encrypted device storage. The device encryption key is kept in the Android operating system’s secure key store rather than in the application database.

An administrator can revoke a lost device. Revocation must prevent the device from successfully synchronizing after the server recognizes it as revoked. Whether revocation also triggers local deletion, and under what conditions an offline device can receive that instruction, has not been decided and must not be treated as a guaranteed remote wipe.

## Failure Behavior

Synchronization may stop after any step without corrupting accepted server state. Pending work remains in the outbox and is retried when conditions allow. Stable operation identities and checksums ensure that uncertainty about a previous response does not create duplicates during retry.

A photo upload and its metadata submission are separate operations. If the upload succeeds but metadata submission does not, the client retries the metadata operation without creating another logical photo. Cleanup of uploaded objects that never receive metadata requires a separate retention decision.

A version conflict is a valid synchronization outcome rather than a transport failure. The device can stop retrying that specific update once the server has durably accepted it into the conflict workflow.

The design does not yet define retry intervals, synchronization priority, storage-pressure behavior, or the user-visible status of delayed and failed work.

## Trade-offs

The design makes tunnel inspections independent of continuous connectivity and prevents silent data loss, but it moves substantial responsibility onto both the client and synchronization service.

Each tablet must manage local records, photo files, outbox entries, retry state, and server acknowledgements. The server must deduplicate repeated operations, coordinate photo and metadata ingestion, enforce form versions, and preserve conflicts for review. Photos also require temporary device capacity until their uploads are safely completed.

Conflict handling favors preservation over immediacy. Inspectors can continue working offline, but overlapping edits may remain unresolved until a supervisor reviews them. This is appropriate for protecting inspection records, although it delays the final authoritative state.

## Decisions Required at Design Review

The review should confirm the following decisions before implementation proceeds:

- Whether the operation-based synchronization interface replaces or supplements the existing CRUD endpoints.
- How stable operation and photo identifiers are generated and deduplicated.
- What timestamp information change events retain and which time is authoritative.
- How much device storage must be reserved for pending photos and when synchronized files may be removed.
- How orphaned object-storage uploads are identified and cleaned up.
- What inspectors see when work is pending, has failed, or has entered conflict review.
- How supervisors compare and resolve conflicting updates.
- What device revocation guarantees while a tablet is offline, including whether local deletion is required.

These decisions define the remaining boundaries of the offline system. Retry timing, storage guarantees, remote-wipe behavior, and the detailed supervisor workflow should remain unspecified until the review resolves them.