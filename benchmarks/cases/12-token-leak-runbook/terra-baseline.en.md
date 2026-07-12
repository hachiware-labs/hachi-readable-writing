# Public Production API Token Exposure Response Procedure

**Trigger:** A production API token with read and write permissions is confirmed committed to a public repository. Define confirmation time as **T0**.

## 1. Immediately contain the exposure

1. **Revoke the exposed token in the authentication system immediately.**  
   Do this before issuing any replacement token. Record the revocation time.

2. **Do not copy the token value** into the incident record, tickets, chat, emails, or logs. Refer to it only as “the revoked token” or by an approved non-secret identifier.

3. Notify the security team, service owner, and the person responsible for legal and communications decisions. That person determines whether external notification is required.

## 2. Preserve the minimum evidence before repository cleanup

Before making the repository private, deleting content, or rewriting history, record:

- Repository URL
- Exposed commit ID
- Discovery time
- Reporter
- T0
- Token revocation time, once completed

Do not include the token value in these records.

## 3. Restore service with a replacement credential

After revocation:

1. Issue a new production token.
2. Store it in the approved secret-management system.
3. Update every dependent service to use the new token.
4. Restart the dependent services.
5. Confirm that required service operations succeed using the replacement token.

## 4. Investigate use of the revoked token

Review authentication and operation logs from **24 hours before T0 through the revocation time**.

Identify and record, where available:

- Source addresses or systems
- Times of use
- Authentication events
- Actions performed with the revoked token

If suspicious writes occurred:

1. Identify all changed resources.
2. Repair or roll back the changes using separate, known-good credentials.
3. Record the remediation performed and any remaining impact.

## 5. Treat the public repository history

After the evidence in section 2 is recorded and the token is revoked, remove the secret from public history using the repository’s approved process, including any required access restriction or history rewrite.

Repository cleanup is exposure reduction, not containment. It must never restore, re-enable, or otherwise make the revoked token usable again.

## 6. Incident leadership and closure

The incident lead maintains the incident record, coordinates communications, and confirms completion. Close the incident only when all of the following are complete:

- The exposed token is revoked.
- A replacement token is deployed and dependent services are operating with it.
- The full log window has been reviewed.
- Suspicious activity, if any, has been investigated and remediated.
- Public repository history has been treated.
- A post-incident review has an assigned owner and deadline.