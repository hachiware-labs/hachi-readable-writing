# Production API Token Exposed in a Public Repository

Use this procedure when a production API token is confirmed in a public repository. Treat the confirmation time as **T0**. The exposed token has production read and write permissions.

## 1. Contain immediately

**On-call engineer:** Revoke the exposed token in the authentication system first. Do not issue a replacement before revocation is complete.

Do not paste or record the token value in chat, tickets, or incident notes.

## 2. Preserve minimum evidence

Before making the repository private or rewriting its history, record:

- Commit ID
- Discovery time
- Repository URL
- Reporter

These records must identify the exposure without containing the token value.

## 3. Restore service with a new credential

After the old token is revoked:

1. Issue a new production token.
2. Store it in the secret-management system.
3. Update every dependent service to use the new token.
4. Restart those services.

Confirm that the replacement has been deployed and the dependent services are operating with it.

## 4. Investigate use of the revoked token

Review authentication and operation logs from **24 hours before T0 through the time of revocation**. Identify:

- Sources using the old token
- Times of use
- Actions performed

If suspicious writes occurred, identify the affected resources and repair them using separate known-good credentials.

## 5. Treat the public repository history

Remove the secret from public history by making the repository private, rewriting history, or taking the appropriate combination of actions.

History cleanup does not change the containment decision: the original token remains revoked and must never become usable again.

## 6. Notify and coordinate

**Incident lead:** Notify:

- Security team
- Service owner
- Person responsible for legal and communications decisions

The legal and communications decision-maker determines whether external notification is required.

## 7. Close the incident only when all conditions are met

Do not close the incident until all of the following are complete:

- The exposed token is revoked.
- A replacement token is deployed to dependent services.
- The full log window has been reviewed.
- Suspicious activity, if any, has been investigated and addressed.
- Public repository history has been treated.
- An owner and deadline are assigned for the post-incident review.