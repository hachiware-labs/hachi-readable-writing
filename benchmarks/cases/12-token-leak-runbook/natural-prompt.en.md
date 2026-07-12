Write the response procedure for a production API token accidentally committed to a public repository.
It is for the on-call engineer and incident lead.

What we know:

- Call the time the leak is confirmed T0. The token has production read and write permissions.
- Revoke the token in the authentication system first. Revocation happens before issuing a replacement.
- Before making the repository private or rewriting history, record the commit ID, discovery time, repository URL, and reporter. Do not copy the token value into records or chat.
- After revocation, issue a new token, store it in the secret-management system, update the dependent services, and restart them.
- Examine authentication and operation logs from 24 hours before T0 through the revocation time. Identify sources, times, and actions performed with the old token.
- If suspicious writes occurred, identify the changed resources and repair them with separate known-good credentials.
- Removing the secret from public history must never make the revoked token usable again.
- Notify the security team, service owner, and the person responsible for legal and communications decisions. That responsible person decides whether external notification is required.
- Closure requires revocation, replacement deployment, review of the full log window, response to suspicious activity, treatment of public history, and assignment of an owner and deadline for the post-incident review.
- We do not have product-specific screen names in these notes.

