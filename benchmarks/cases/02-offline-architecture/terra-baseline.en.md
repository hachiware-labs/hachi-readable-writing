# Proposed Offline Design for Tunnel Inspections

## Purpose

The inspection app must allow 40 Android tablet users to complete tunnel inspections without connectivity for up to eight hours, then synchronize safely when service returns. The design preserves inspection data and photos locally, avoids duplicate uploads or updates during retries, and routes concurrent edits to supervisors rather than overwriting them.

## Design overview

Each tablet becomes a temporary, encrypted working copy of the inspection system. It stores inspection forms in encrypted SQLite, retains photo files in encrypted device storage, and records every server-bound change in an outbox. The app can therefore create and edit forms, attach photos, and retain pending work while offline.

When connectivity is available, background synchronization processes the outbox. For each photo, it first uploads the encrypted-device file to object storage and verifies it by checksum. Only after that upload succeeds does it send photo metadata and the related form operation to the API. This ordering prevents a form from referring to a photo that has not reached object storage.

```text
Offline tablet
  encrypted SQLite: forms, local metadata, outbox
  encrypted storage: photo files
             |
             | when connectivity returns
             v
1. Upload photo + checksum to object storage
2. Send photo metadata and form operation to API
3. Server deduplicates, versions the form, and records an audit event
```

## Local data and outbox

SQLite stores the inspection form data, the last known server version of each form, photo paths and checksums, and the outbox entries needed to resume synchronization after interruption. Photo bytes remain outside SQLite in encrypted device storage; SQLite refers to them by path and checksum.

Every user action that must reach the server produces a durable outbox operation before it is treated as pending synchronization. An operation needs a stable, device-generated identifier that is retained across retries. The server records and recognizes that identifier so a retry cannot create a duplicate form update, photo metadata record, or history event.

This allows synchronization to stop and restart safely—for example, if the tablet leaves coverage midway through an upload or the app is restarted.

## Photo synchronization

A form operation that depends on a photo is not eligible to complete until the photo has been uploaded successfully. The synchronization sequence is:

1. Read the photo from encrypted device storage and upload it to object storage with its checksum.
2. Retry the upload safely if the connection fails; the checksum and stable upload identity prevent duplicate stored objects.
3. Send the photo metadata, including its checksum and association with the inspection form.
4. Send or complete the associated form update.

The app must retain local photo files until the server confirms the corresponding metadata and form operations. Temporary device storage must therefore accommodate the unsynchronized photo backlog. The exact capacity requirement cannot be calculated yet because photo size and the expected upload window are not specified.

## Form updates and conflicts

The server remains the authority for each inspection form. It stores a version number, and each update includes the version on which the inspector made the change.

If the submitted version matches the server’s current version, the server applies the update, increments the version, and returns the new state. If it does not match, the server must not silently overwrite either version. Instead, it stores the attempted update as a conflict and places it in a supervisor review queue.

This is appropriate because forms are normally edited by one inspector, while later supervisor corrections are expected. It keeps the common path simple while making exceptional concurrent edits explicit and reviewable.

A supervisor resolves a conflict by choosing or combining the relevant values and submitting a new update against the current server version. The details of the review interface and merge rules remain to be decided.

## Change history and retention

The server records append-only change events for all accepted changes and conflict-related actions. Each event records:

- who made the change;
- what changed;
- when it occurred; and
- which device submitted it.

These events, together with the resulting form versions, provide the required seven-year change history. The design review should confirm the operational retention mechanism and who may view or export this history; the supplied requirement establishes the retention period but not those access rules.

## Device security and revocation

Inspection data in SQLite and photos in device storage are encrypted. The device key is held in the operating system’s secure key store rather than in app-managed storage.

An administrator can revoke a lost device. At minimum, the server must reject synchronization from a revoked device. Because a tablet may remain offline for up to eight hours, revocation cannot by itself guarantee immediate remote enforcement on an unreachable tablet; the desired local behavior after revocation is received, and any device-management integration, need explicit definition.

## Trade-offs

This design exchanges continuous-connectivity simplicity for dependable field operation:

- Each device carries more state and must recover synchronization correctly after interruption.
- Photos require temporary encrypted storage until upload and confirmation.
- Conflicting edits are resolved later by supervisors rather than immediately.
- The server must support durable idempotency records, version checks, conflict storage, and append-only history.

These costs are justified by the ability to complete inspections inside tunnels without losing work or corrupting later changes.

## Decisions requested in review

Approve the offline-first synchronization model, including photo-before-metadata ordering, idempotent outbox operations, server-side version checks, supervisor conflict handling, and seven-year append-only history retention.

The following remain intentionally undecided: device storage sizing, conflict-resolution UI and merge rules, audit-history access and export policy, and the exact behavior of a revoked device while it remains offline.