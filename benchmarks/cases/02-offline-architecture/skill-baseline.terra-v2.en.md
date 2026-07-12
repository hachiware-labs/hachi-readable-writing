# Proposed Offline Design for Tunnel Inspections

## Purpose

Inspectors must be able to complete inspections for up to eight hours without connectivity, while preserving photos, form changes, and a seven-year change history. The design moves inspection work to an offline-first device model and synchronizes durable operations when connectivity returns.

## Design overview

Each Android tablet becomes a local working copy of the inspection system. It stores inspection data in encrypted SQLite and keeps photo files in encrypted device storage. SQLite records each photo’s local path and checksum, rather than embedding the photo binary itself.

Changes made while offline are written locally and added to an outbox. Background synchronization later processes the outbox, uploading photo content before its metadata and sending form operations to the server. Both photo uploads and operations must be repeatable without creating duplicate server records.

```text
Android tablet
  ├─ Encrypted SQLite
  │   ├─ inspection forms
  │   ├─ local form versions
  │   ├─ photo paths and checksums
  │   └─ outbox of pending operations
  └─ Encrypted device storage
      └─ photo files

When connected:
  photo file + checksum ──> object storage
  photo metadata ────────> server
  form operations ───────> server version check
                                ├─ accepted and recorded
                                └─ conflict review queue
```

This retains the current server-side CRUD API and object storage roles, but changes the client-server interaction from immediate CRUD requests to synchronization of durable, idempotent operations.

## Local data and offline work

An inspector edits an inspection form against the version last known by the device. The device commits the change locally first, so form entry and photo capture do not depend on network availability.

For every locally committed change, the tablet retains enough information to synchronize it later, including the affected form, the expected server version, the operation identity, the originating device, and any related photo metadata. The outbox remains the source of pending work until the server has accepted the operation or has returned it as a conflict.

A normal inspection is expected to have one active inspector. This reduces concurrent-editing pressure, but it does not eliminate it: a supervisor may later correct the same form, and a device may reconnect after that correction has already been accepted.

## Photo synchronization

Photos are handled as two linked but separate resources:

1. The device uploads the encrypted-device-stored photo to object storage, using its checksum.
2. After that upload succeeds, the device sends photo metadata to the server, including the stored path reference and checksum.
3. The associated inspection operation can then refer to the photo metadata.

This ordering prevents the server from accepting metadata for a photo that has not yet been uploaded. Checksums support repeat-safe upload behavior and allow the server-side flow to identify the intended photo content without treating a retry as a new photo.

The design requires temporary device capacity for photos captured before synchronization. At the stated maximum of 200 photos per tablet per day, storage planning must account for a full offline period and for any backlog that remains after connectivity returns. Photo sizes and local retention rules have not yet been decided.

## Form synchronization and conflicts

The server remains authoritative for each inspection form and stores its current version number. A device sends an update with the version on which its edit was based.

If the version matches, the server applies the update, advances the form version, and records the change event. If it does not match, the server must not overwrite the newer form silently. Instead, it holds the update as a conflict and places it in a supervisor review queue.

This favors preserving both edits over automatic merging. The consequence is that some corrections will wait for supervisor action rather than resolving immediately on the device. The exact supervisor workflow for viewing, comparing, and resolving conflicts remains to be designed.

## Audit history and device security

The server stores append-only change events for every accepted change, recording:

- who made the change;
- what changed;
- when it changed; and
- which device originated it.

These events provide the history that must be retained for seven years. The final data-retention and deletion policy should explicitly cover both inspection records and their associated change events.

Each device’s encryption key is held in the operating system’s secure key store. An administrator can revoke a lost device. The detailed behavior of a revoked device, including treatment of any unsynchronized local work, is not yet specified and should be decided before implementation.

## Main trade-offs

The design accepts more complexity on the device in exchange for reliable tunnel operation. Tablets must manage local state, encryption, retries, outbox ordering, and synchronization recovery. They also need enough temporary storage for photos that cannot be uploaded immediately.

Conflicts become explicit rather than silent, which protects form history but delays final resolution when a supervisor’s change overlaps an offline inspector’s update. The audit trail and idempotent operation model add server-side persistence and processing requirements, but they are necessary to retain history and safely tolerate repeated synchronization attempts.

## Decisions for design review

The proposed architecture establishes these decisions:

- Android tablets use encrypted SQLite for inspection data and an outbox, while photo files remain in encrypted device storage.
- Synchronization uploads a photo before its metadata and uses checksums to support repeat-safe retries.
- The server enforces version checks for form updates and routes mismatches to supervisor review rather than overwriting data.
- The server keeps append-only change events for seven years.
- Device encryption keys remain in the operating system secure key store, with administrative revocation for lost devices.

The review should next decide local photo-storage capacity and retention, the supervisor conflict-resolution experience, and how revocation affects unsynchronized data on a lost device.