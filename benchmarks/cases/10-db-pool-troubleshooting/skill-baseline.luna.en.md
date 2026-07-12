# Production API: Database Connection Pool Exhaustion

## Purpose

Use this guide when API latency rises together with `pool acquire timeout` errors and database sessions show increased `idle in transaction` activity.

The working diagnosis is that the latest release moved an external payment-API call inside a database transaction. Because that call takes two to eight seconds, database sessions and application pool slots remain occupied while waiting on the external service. This can exhaust the application pools even when database CPU, disk wait, and query performance remain normal.

## Immediate mitigation

1. **Roll back the release immediately.** Use the standard deployment rollback procedure for the release that moved the payment-API call into the transaction.

2. **Temporarily reduce the API from 12 instances to 8.** Do not increase the database connection limit, and do not compensate by increasing the application pool maximum.

3. **Preserve the incident evidence before cleanup or restart.** Record the API latency, `pool acquire timeout` rate, instance count, deployment version, and the number of `idle in transaction` sessions using the existing monitoring and operational procedures.

The current configuration allows up to:

- 12 instances × 20 connections = 240 application connections
- Database limit = 180 connections

Eight instances with the current pool maximum would allow up to 160 connections, leaving 20 connections below the database limit.

## Confirm the mitigation is working

After the rollback and scale-down, watch the following together:

- `pool acquire timeout` errors stop increasing and remain absent.
- API p95 latency falls below 500 milliseconds.
- `idle in transaction` sessions return to their normal level.
- Database CPU remains healthy and slow-query volume does not increase.

Do not restore the API to 12 instances until the recovery conditions have been met continuously for 30 minutes.

The incident notes do not specify command names or monitoring screen names. Use the service’s standard rollback, scaling, deployment, and monitoring procedures.

## Diagnosis

The symptoms point to connection occupancy rather than database execution capacity:

- API p95 latency increased from 300 milliseconds to 9 seconds.
- `pool acquire timeout` errors increased.
- Database CPU stayed below 45 percent.
- Disk wait remained normal.
- Slow queries did not increase.
- `idle in transaction` sessions increased immediately after the release.

The external payment call can hold a transaction open for two to eight seconds. While it is waiting, the associated database connection remains occupied, reducing the number of connections available to other requests. Once the application pool is exhausted, requests wait for a connection and eventually fail with `pool acquire timeout`.

## Permanent fix

Change the payment flow so that the external payment-API call runs outside the database transaction. Keep only the short, required database update inside the transaction.

After implementing the change:

1. Verify that the external call no longer occurs while a database transaction is open.
2. Confirm that the required database update remains atomic.
3. Recalculate the per-instance pool maximum from the global database connection limit and the planned maximum instance count.
4. Validate the new configuration under realistic concurrency before returning to normal production capacity.

The pool maximum must be sized from the global limit rather than multiplying an independently chosen per-instance maximum across all instances.

## Recovery and closure

Recovery is complete only after all of the following have held for 30 minutes:

- No `pool acquire timeout` errors.
- API p95 latency below 500 milliseconds.
- `idle in transaction` sessions back at their normal level.

Once these conditions are met, the service owner may decide whether to restore the normal instance count. Record the rollback, temporary scale-down, observed recovery, root cause, and permanent fix status in the incident record.