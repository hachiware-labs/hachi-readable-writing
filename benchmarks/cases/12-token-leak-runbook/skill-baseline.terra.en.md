# Production API Token Exposed in a Public Repository

This procedure begins when the exposure is confirmed. Call that time **T0**. The exposed token has production read and write permissions, so treat it as an active production security incident.

## 1. Contain the exposure immediately

The on-call engineer must revoke the exposed token in the authentication system first.

Do not issue a replacement before revocation is complete. Do not assume that deleting the token from a file, making the repository private, or rewriting repository history disables the token.

## 2. Preserve the minimum evidence

Before making the repository private or rewriting its history, record:

- Commit ID
- Discovery time
- Repository URL
- Reporter

Do not copy the token value into incident records, tickets, chat, or any other communication channel.

## 3. Restore service with a replacement token

After revocation:

1. Issue a new production token.
2. Store the new token in the approved secret-management system.
3. Update every dependent service to use the replacement.
4. Restart the affected services.
5. Confirm that the services are operating with the replacement token.

Keep the revoked token disabled throughout this work. Repository cleanup must never make it usable again.

## 4. Investigate use of the revoked token

Review authentication and operation logs from 24 hours before T0 through the time of revocation.

Identify, for each use of the old token where available:

- Source
- Time
- Action performed

If suspicious write activity occurred, identify the changed resources and repair them using separate known-good credentials. Do not use the revoked token or depend on repository cleanup as part of the repair.

## 5. Treat the public repository history

After the required evidence has been recorded and the token is revoked, remove the secret from the public repository history. This may include making the repository private and/or rewriting history, according to the repository’s established controls.

The purpose of this step is to reduce continued exposure. It does not replace revocation and must not restore access for the revoked token.

## 6. Notify and coordinate

The incident lead must notify:

- Security team
- Service owner
- Person responsible for legal and communications decisions

The legal and communications decision owner determines whether external notification is required.

## 7. Close the incident only when all conditions are met

Do not close the incident until all of the following are complete:

- The exposed token is revoked.
- A replacement token is deployed to dependent services.
- The full log window—from 24 hours before T0 through revocation—has been reviewed.
- Any suspicious activity has been investigated and, where needed, repaired.
- Public repository history has been treated.
- An owner and deadline have been assigned for the post-incident review.