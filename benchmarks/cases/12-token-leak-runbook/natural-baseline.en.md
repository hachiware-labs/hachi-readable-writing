# Public Production API Token Exposure Response

Audience: on-call engineer and incident lead  
Severity: treat as a production security incident because the token has read and write permissions.

## Critical ordering

1. Confirm the exposure and declare **T0**.
2. **Revoke the exposed token immediately.**
3. Record repository evidence.
4. Restrict the repository and remove the secret from public history.
5. Issue and deploy a replacement token.
6. Investigate and remediate any use of the old token.

Do not delay revocation to preserve evidence, make the repository private, rewrite history, or prepare a replacement. Revocation must occur before replacement issuance.

## 1. Declare and coordinate the incident

The on-call engineer:

- Record T0 as the time the leak is confirmed.
- Open an incident channel and incident record.
- Page or appoint the incident lead.
- Notify:
  - Security team
  - Service owner
  - Person responsible for legal and communications decisions

Never paste, quote, screenshot, or otherwise copy the token value into tickets, records, email, or chat.

The incident lead:

- Assign owners for revocation, service recovery, repository treatment, log review, and communications.
- Maintain a timestamped incident timeline.
- Ensure response actions do not expose the token further.

## 2. Revoke the exposed token

The on-call engineer or authentication-system owner:

1. Revoke or disable the old token in the authentication system immediately.
2. Record the revocation time and outcome without recording the token value.
3. Verify that authentication attempts using the old token are rejected.

If revocation cannot be completed or verified promptly, escalate immediately to the authentication-system owner and security team. Do not issue a replacement while the old token remains active.

Repository cleanup must never restore, re-enable, or otherwise make the revoked token usable.

## 3. Preserve repository evidence

After revocation, and before making the repository private or rewriting its history, record:

- Exposed commit ID
- Discovery time
- Repository URL
- Reporter

Do not record the token value. Preserve only the minimum metadata needed for investigation.

## 4. Restrict and clean the repository

After recording the required evidence:

1. Restrict public access, such as making the repository private, where available and appropriate.
2. Remove the secret from the current files.
3. Rewrite affected repository history or follow the hosting provider’s procedure for removing sensitive data from public history.
4. Address other public copies where possible, including forks, cached views, build artifacts, and generated packages.
5. Confirm that ordinary repository browsing and cloning no longer reveal the secret.

Assume that anyone may already possess a copy. Repository cleanup is not a substitute for revocation.

## 5. Replace and deploy the credential

Only after the old token has been revoked:

1. Issue a new production token with the minimum permissions required.
2. Store it directly in the approved secret-management system.
3. Update every dependent service to reference the replacement.
4. Restart or redeploy the affected services so they load the new value.
5. Verify:
   - Services are healthy.
   - Required read and write operations work.
   - Services are using the replacement credential.
   - The revoked token remains unusable.

Do not place the replacement token in source control, incident records, command output retained in logs, or chat.

## 6. Investigate use of the old token

Review authentication and operation logs covering the complete interval:

**T0 minus 24 hours through the token’s revocation time**

Identify and record, without recording the token value:

- Source addresses, identities, agents, or other available source information
- Authentication and operation times
- Actions attempted or completed
- Resources read, created, modified, or deleted
- Failed or unusual requests
- Any indicators that activity came from an unauthorized party

The incident lead must ensure the entire window is reviewed. Known legitimate activity should be distinguished from unexplained or suspicious activity.

## 7. Respond to suspicious activity

If suspicious reads occurred:

- Identify the information accessed.
- Notify security and the legal/communications decision-maker.
- Preserve relevant logs and evidence.
- Let the designated legal/communications decision-maker determine whether external notification is required.

If suspicious writes occurred:

1. Identify every changed resource and the nature of each change.
2. Contain any continuing impact.
3. Repair, restore, or remove the changes using separate, known-good credentials—not the exposed token or its replacement.
4. Validate the repaired state with the service owner.
5. Document the remediation and any remaining uncertainty.

Expand the investigation if the available evidence indicates activity outside the initial log window or impact to other systems.

## 8. Communications

The incident lead provides factual, timestamped status updates to the security team and service owner.

The designated legal and communications decision-maker—not the on-call engineer—decides whether customers, partners, regulators, repository hosts, or the public must be notified.

Do not speculate about attribution or impact. Do not include either the old or replacement token in communications.

## 9. Closure criteria

The incident may close only when all of the following are complete:

- The exposed token is revoked and verified unusable.
- A replacement has been securely stored and deployed.
- Dependent services have been restarted or redeployed and validated.
- The full log window from T0 minus 24 hours through revocation has been reviewed.
- Suspicious activity has been investigated and addressed.
- Any suspicious writes have been repaired with separate known-good credentials.
- Public repository history and other identified public copies have been treated.
- Security, the service owner, and the legal/communications decision-maker have been notified.
- Any external-notification decision has been recorded.
- A named owner and deadline have been assigned for the post-incident review.

The post-incident review should address why the token entered source control, why preventive or detection controls did not stop it, credential scope, secret scanning, rotation procedures, and concrete corrective actions.