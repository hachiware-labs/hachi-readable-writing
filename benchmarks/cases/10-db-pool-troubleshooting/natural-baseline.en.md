# Incident Guide: Production API Database Pool Exhaustion

## Trigger conditions

Use this guide when the production API shows:

- `pool acquire timeout` errors.
- API p95 latency significantly above the normal 300 ms.
- Increased `idle in transaction` database sessions.
- Database CPU, disk wait, and slow-query volume remain normal.

Known incident behavior: p95 increased to 9 seconds while database CPU stayed below 45%.

## Likely cause

The latest release moved a two-to-eight-second payment API call inside a database transaction. Connections remain checked out while the API waits for the external service, exhausting the connection pools.

The capacity mismatch amplifies the problem:

- 12 API instances × pool maximum 20 = 240 possible connections.
- Database connection limit = 180.
- The API can therefore request more connections than the database permits.

This is connection retention and pool exhaustion—not database compute, disk, or query-performance saturation.

## Immediate response

1. Declare or update the incident according to the normal incident process.
2. Record the current values for:

   - API p95 latency.
   - `pool acquire timeout` error rate.
   - `idle in transaction` session count.
   - API instance count and deployed release.
   - Total database connections.

3. Roll back the immediately preceding release.
4. Temporarily reduce the API from 12 instances to eight.

   At eight instances, the current configuration permits at most 160 API connections, below the database limit of 180.

5. Do **not** increase the database connection limit.
6. Watch for failed or interrupted requests during rollback and scaling. Follow normal retry or reconciliation procedures for payments; do not manually retry a payment unless its completion state is known.

Use the organization’s standard deployment, scaling, and monitoring procedures. No service-specific commands or dashboard names are available in the incident notes.

## Verify mitigation

After rollback and scale-down, confirm that:

- `pool acquire timeout` errors fall to zero.
- API p95 latency trends below 500 ms.
- `idle in transaction` sessions return toward their established normal level.
- Database connections fall below the 180 limit.
- Database CPU and disk wait remain normal.
- Payment processing and other critical API operations succeed.

If timeouts continue, confirm that rollback completed on every instance and that only eight API instances are active. Check for remaining long-lived transactions and other database clients consuming connections.

## Recovery criteria

Do not resolve the incident until all of the following remain true continuously for 30 minutes:

- No `pool acquire timeout` errors.
- API p95 latency below 500 ms.
- `idle in transaction` sessions at their normal level.

Keep the temporary eight-instance limit until the permanent fix and corrected pool configuration have been validated.

## Escalation

Escalate to the API and database owners if:

- Rollback cannot be completed.
- Timeouts persist after rollback and scale-down.
- Database connections remain near 180.
- Long-lived or `idle in transaction` sessions do not clear.
- Reducing to eight instances causes unacceptable traffic saturation.
- Payment outcomes are ambiguous or reconciliation is required.

Do not compensate by raising the database connection limit.

## Permanent remediation

Change the payment flow so that:

1. Work needed before the payment request is performed without holding a database transaction.
2. The external payment API call occurs outside the transaction.
3. Only the short, required database update is performed inside a transaction.

Recalculate the per-instance pool maximum using:

```text
per-instance maximum =
floor((180 - reserved headroom - non-API connection allowance)
      / maximum API instance count)
```

For 12 instances, 15 connections per instance is only the mathematical ceiling with zero headroom and no other database clients. The configured value must be lower if administration, migrations, background workers, failover, or other services require connections.

Before deployment, test:

- Slow and failed payment API responses.
- Transaction duration and `idle in transaction` behavior.
- Pool acquisition under expected peak concurrency.
- Retries and payment idempotency.
- Operation at the maximum intended API instance count.