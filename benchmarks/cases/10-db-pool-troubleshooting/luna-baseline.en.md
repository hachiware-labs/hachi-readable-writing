# Incident Guide: Production API Database Connection Pool Exhaustion

## Symptoms

Declare or continue the incident when several of these occur:

- API p95 latency rises significantly above the normal ~300 ms.
- `pool acquire timeout` errors increase.
- `idle in transaction` database sessions exceed their normal level.
- Database CPU remains below 45%, disk wait is normal, and slow-query volume is unchanged.

This pattern indicates connections are being held too long—likely by transactions waiting on an external dependency—rather than the database being CPU- or I/O-bound.

## Known cause

The preceding release moved an external payment-API call inside a database transaction. That call takes two to eight seconds, causing transactions to remain open while waiting. Connections stay checked out, the pools exhaust, and requests wait until acquisition times out.

## Immediate mitigation

1. Record the incident start time and current API/database metrics.
2. Roll back the immediately preceding API release.
3. Temporarily reduce the API from 12 to 8 instances.
4. Allow connections to drain normally during instance termination. Avoid changing the database connection limit.
5. Confirm that the rollback is running on all remaining instances.
6. Watch:
   - API p95 latency
   - `pool acquire timeout` rate
   - `idle in transaction` sessions
   - database connection count
   - database CPU, disk wait, and slow-query volume

With eight instances and the current pool maximum:

```text
8 instances × 20 connections = 160 connections
```

This is below the database limit of 180 and provides 20 connections of theoretical headroom.

## Diagnosis checklist

Confirm the following before attributing the incident to another cause:

- The latency and pool-timeout increase began after the release.
- The release contains or coincides with the payment-API call being performed inside a transaction.
- Payment-API duration is approximately two to eight seconds.
- `idle in transaction` sessions increased.
- Database CPU remains below 45%.
- Disk wait remains normal.
- Slow queries did not increase.

Do not increase the database connection limit as a mitigation. The database is not showing resource saturation, and increasing the limit could worsen contention elsewhere.

## Recovery criteria

Treat the service as recovered only after all of the following remain true for 30 continuous minutes:

- No `pool acquire timeout` errors.
- API p95 latency remains below 500 ms.
- `idle in transaction` sessions return to their normal baseline.

If any condition regresses, return to mitigation and reassess the rollback and instance count.

## Permanent fix

Change the payment workflow so that:

1. The external payment-API call occurs outside the database transaction.
2. Only the short, required database update is performed inside the transaction.
3. The transaction begins immediately before the database update and commits immediately afterward.
4. Payment-API failures and retry behavior are handled explicitly outside the transaction.
5. The workflow is tested under payment-API latency between two and eight seconds.

After deployment, verify that transaction duration and `idle in transaction` sessions remain normal.

## Connection-pool sizing

The database connection limit is 180. For 12 API instances, the theoretical maximum per instance is:

```text
floor(180 / 12) = 15 connections per instance
```

Set the API pool maximum to no more than 15 only if the API is the sole database connection consumer. If other services, administrative sessions, jobs, or replicas use the same limit, reserve capacity for them:

```text
per-instance pool maximum
  = floor((180 − reserved connections) / 12)
```

Document the reserved capacity and apply the same calculation whenever the instance count changes.

## Escalation

Escalate to the database or platform owner if:

- Pool timeouts continue after rollback and scaling to eight instances.
- `idle in transaction` sessions remain elevated.
- Database connections do not drain after instances are removed.
- Database CPU or disk wait begins rising materially.
- The recovery criteria cannot be maintained for 30 minutes.

Include the release identifier, incident timeline, instance count, pool settings, database connection counts, and latency/error graphs in the handoff.

