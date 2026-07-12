# Production API Token Exposure Response Procedure

Use this procedure when a production API token has been committed to a public repository. The token has production read and write permissions, so treat the incident as a potential production compromise.

Define **T0** as the time the leak is confirmed.

## 1. Revoke the exposed token

The on-call engineer must revoke the token in the authentication system immediately.

- Revoke it before issuing any replacement.
- Do not delay revocation to investigate activity or clean the repository.
- Do not copy the token value into incident records, tickets, or chat.
- Confirm that the old token remains unusable. Repository cleanup must never restore its validity.

Record the revocation time for the investigation window.

## 2. Preserve essential evidence

Before making the repository private or rewriting its history, record:

- commit ID;
- discovery time;
- repository URL; and
- reporter.

Record only the information needed to identify the exposure. Do not record the token value.

## 3. Restore dependent services

After revocation:

1. Issue a new token.
2. Store it in the secret-management system.
3. Update every dependent service to use the new secret.
4. Restart the affected services.
5. Verify that the services are operating with the replacement token and that the revoked token is no longer in use.

If service restoration fails, keep the old token revoked and escalate the service impact to the incident lead.

## 4. Investigate use of the old token

Examine authentication and operation logs covering the period from **24 hours before T0 through the revocation time**.

Identify and record:

- source of each use;
- time of each use; and
- action performed with the old token.

Distinguish expected service activity from suspicious or unexplained activity. The incident lead coordinates ownership of unresolved log entries and ensures that the entire time window is reviewed.

If suspicious writes occurred, identify every changed resource and repair it using separate, known-good credentials. Do not use either the revoked token or the replacement token for this repair work. Record what was changed, how it was repaired, and how the repair was verified.

## 5. Treat the public repository history

After preserving the required evidence, restrict further exposure and remove the secret from public history using the repository platform’s available controls. Product-specific screen names and procedures are not defined in this runbook.

History cleanup reduces continued disclosure but does not replace revocation. Assume that the token may already have been copied, cached, or mirrored. Verify again that the revoked token cannot authenticate after the repository treatment is complete.

## 6. Notify responsible parties

The incident lead must notify:

- the security team;
- the service owner; and
- the person responsible for legal and communications decisions.

Provide the exposure timeline, affected repository and commit, revocation status, service-restoration status, and investigation findings. Do not include the token value.

The person responsible for legal and communications decisions determines whether external notification is required.

## 7. Close the incident

Do not close the incident until all of the following are complete:

- the exposed token has been revoked;
- the replacement token has been deployed to all dependent services;
- the full log window—from 24 hours before T0 through revocation—has been reviewed;
- all suspicious activity has been investigated and addressed;
- any resources changed by suspicious writes have been repaired and verified;
- the secret’s public repository history has been treated;
- the revoked token has been confirmed unusable;
- required internal notifications have been made; and
- an owner and deadline have been assigned for the post-incident review.

The incident lead records the closure decision and any remaining follow-up work.