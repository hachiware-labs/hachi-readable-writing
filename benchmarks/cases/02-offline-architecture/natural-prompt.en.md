Write up the proposed offline design for our tunnel inspection app.
Engineers and product staff will read it during design review.

What we know:

- Forty inspectors use Android tablets. A tablet can be without connectivity inside a tunnel for up to eight hours.
- Each tablet captures up to 200 photos per day. An inspection form is normally edited by one inspector, but a supervisor may correct it later.
- Change history must be retained for seven years.
- The current system assumes continuous connectivity and uses a CRUD API plus object storage.
- Each device will use encrypted SQLite for inspection data and an outbox of unsent operations. Photo files will remain in encrypted device storage; SQLite will store their paths and checksums.
- Background synchronization uploads each photo to object storage with its checksum before sending its metadata. Every operation must be safe to repeat without creating duplicates.
- The server stores a version number for each inspection form. An update with a mismatched version must not silently overwrite data; it is held as a conflict and sent to a supervisor review queue.
- The server stores append-only change events recording who changed what, when, and on which device.
- The device key is kept in the operating system's secure key store, and an administrator can revoke a lost device.
- The main trade-offs are greater device-state and synchronization complexity, temporary storage requirements for photos, and delayed conflict resolution.
- No other product features or guarantees have been decided.

