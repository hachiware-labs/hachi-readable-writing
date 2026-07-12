# Production API Token Leak Response Procedure

## Scope

Use this procedure when a production API token with read and write permissions is committed to a public repository.

Let **T0** be the time the leak is confirmed.

## 1. Contain the credential immediately

The on-call engineer must:

1. Confirm and record T0.
2. Revoke the exposed token in the authentication system immediately.
3. Do not issue a replacement until revocation is complete.
4. Do not copy the token value into tickets, chat, logs, or incident records.

Revocation is the primary containment action. Removing the token from the repository or rewriting history does not replace revocation.

## 2. Preserve incident facts

Before making the repository private, deleting the commit, or rewriting history, record:

- Commit ID
- Discovery time
- Repository URL
- Reporter

Record only the minimum necessary facts. Never record the token value.

## 3. Notify and establish ownership

The incident lead must notify:

- Security team
- Service owner
- Person responsible for legal and communications decisions

The legal and communications decision-maker determines whether external notification is required.

The incident lead should assign clear owners for containment, investigation, remediation, repository cleanup, and communications.

## 4. Issue and deploy a replacement

After the old token has been revoked:

1. Issue a new token.
2. Store it in the approved secret-management system.
3. Update all dependent services to use the new secret.
4. Restart the dependent services as required.
5. Verify that services authenticate successfully and operate normally.
6. Confirm that the revoked token is no longer accepted.

Do not place the replacement token in source code, tickets, chat, or shell history.

## 5. Investigate use of the revoked token

Review authentication and operation logs covering:

**24 hours before T0 through the exact time revocation took effect.**

Identify, for each use of the old token:

- Source IP, service, account, or other available source identifier
- Time of activity
- Authentication events
- API operations performed
- Resources read or changed
- Success or failure status

Preserve relevant log references and evidence without including the token value.

## 6. Respond to suspicious activity

If the investigation identifies suspicious writes:

1. Identify every affected resource.
2. Determine the expected state from trusted records or known-good sources.
3. Repair the resources using separate, known-good credentials—not the revoked or replacement token unless explicitly approved for that purpose.
4. Validate the repaired state.
5. Record the actions taken and any residual impact.

Escalate suspected unauthorized access, data exposure, or incomplete remediation to the security team and incident lead.

## 7. Treat the public repository history

After the credential has been revoked and the required incident facts have been recorded:

1. Restrict or remove public access to the repository as appropriate.
2. Remove the secret from the current files.
3. Rewrite repository history or otherwise remove the secret from publicly accessible history.
4. Check branches, tags, forks under organizational control, release artifacts, build caches, and other copies where applicable.
5. Verify that the revoked token remains unusable.

History cleanup reduces further exposure but must never be treated as a way to restore or invalidate credential security. The old token must remain revoked permanently.

## 8. Validate recovery

The incident lead must confirm:

- The exposed token is revoked.
- The replacement token is stored in the secret-management system.
- All dependent services use the replacement.
- Services were restarted and verified.
- The complete log window was reviewed.
- Suspicious activity was either ruled out or remediated.
- Public repository history was treated appropriately.
- Required notifications and communications decisions were completed.
- A post-incident review owner and deadline are assigned.

## 9. Close the incident

Do not close the incident until all closure requirements above are satisfied.

The incident record should contain the timeline, affected systems, actions taken, investigation results, decisions, owners, and post-incident review deadline—but never the exposed or replacement token values.