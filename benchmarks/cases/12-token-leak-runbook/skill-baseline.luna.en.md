# Production API Token Leak Response Procedure

Use this procedure when a production API token with read and write permissions has been committed to a public repository.

T0 is the time the leak is confirmed.

## 1. Revoke the token immediately

The on-call engineer must revoke the exposed token in the authentication system before issuing a replacement or beginning repository cleanup.

Record the revocation time. Do not copy the token value into incident records, tickets, chat, or commands shared with others.

## 2. Preserve the minimum incident record

Before making the repository private or rewriting its history, record:

- Commit ID containing the token
- Discovery time
- Repository URL
- Reporter

Do not include the token value.

Repository cleanup must not be treated as containment. Removing the token from public history must never restore or preserve the token’s ability to authenticate.

## 3. Restore service with a replacement token

After revocation:

1. Issue a new production token.
2. Store it in the approved secret-management system.
3. Update every dependent service to use the new secret.
4. Restart the affected services.
5. Confirm that the services authenticate and operate normally with the replacement token.

Do not issue or deploy the replacement before the original token has been revoked.

## 4. Investigate use of the exposed token

Examine authentication and operation logs covering the period from 24 hours before T0 through the time of revocation.

Identify, where available:

- Source or origin of each request
- Request time
- Actions performed with the old token
- Resources affected by those actions

If logs show suspicious writes, identify every changed resource and repair it using separate, known-good credentials. Do not use the exposed or merely removed token for repair or verification.

## 5. Treat the public repository history

After the required incident details have been recorded and the token has been revoked, make the repository private or rewrite its public history according to the repository owner’s established process.

Continue to treat the token as compromised even after cleanup. Verify that repository changes do not alter the revoked status of the old token.

## 6. Notify the responsible teams

The incident lead must notify:

- The security team
- The service owner
- The person responsible for legal and communications decisions

The legal and communications decision-maker determines whether external notification is required. The incident lead records that decision and any resulting action.

## 7. Assign follow-up ownership

Assign an owner and deadline for the post-incident review. The review should cover how the token became public, how it was detected, whether access controls and secret-scanning safeguards need improvement, and whether the response exposed any gaps.

## Closure criteria

Close the incident only when all of the following are complete:

- The exposed token is revoked.
- A replacement token is deployed successfully.
- Dependent services have been restarted and verified.
- The full log window—from 24 hours before T0 through revocation—has been reviewed.
- Suspicious activity has been investigated and addressed.
- Public repository history has been treated.
- Security, the service owner, and the legal/communications decision-maker have been notified.
- An owner and deadline are assigned for the post-incident review.