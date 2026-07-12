# Production API: Database Connection Pool Exhaustion Incident Guide

Use this guide when API latency rises with `pool acquire timeout` errors and database connections are being held longer than expected.

## Immediate containment

1. Roll back the release that moved the external payment-API call inside a database transaction.

2. Temporarily reduce the API deployment from 12 instances to 8 instances.

   This lowers the theoretical maximum number of API pool connections from 240 to 160, below the database connection limit of 180.

3. Do not increase the database connection limit.

   Database CPU, disk wait, and slow-query indicators do not point to database capacity or query performance as the cause. Raising the limit would allow more long-running transactions to accumulate rather than removing the contention.

## Preserve essential evidence

Before the rollback removes the immediate symptoms, capture the incident time window and record:

- API p95 latency and `pool acquire timeout` error rate.
- API instance count and configured per-instance pool maximum.
- Database active connection count.
- Count or trend of `idle in transaction` sessions.
- Database CPU, disk wait, and slow-query trends.
- Release version and deployment time.

The known incident pattern is p95 latency increasing from about 300 ms to 9 s, accompanied by more `pool acquire timeout` errors and increased `idle in transaction` sessions.

## Restore service

After rollback and scaling to eight instances, watch for connection acquisition to recover before changing anything else.

Recovery is complete only after all of the following have held continuously for 30 minutes:

- No `pool acquire timeout` errors.
- API p95 latency below 500 ms.
- `idle in transaction` sessions returned to their normal level.

If these conditions do not improve after the rollback, keep the API at eight instances and investigate remaining transaction holders before making further capacity changes.

## Diagnosis

The preceding release placed a two-to-eight-second external payment-API call inside a database transaction. While that call waits on the external service, the transaction remains open and its database connection cannot return to the pool.

Across 12 instances, a pool maximum of 20 permits up to 240 connections, although the database permits only 180. The long-held transactions cause connections to accumulate as `idle in transaction`; eventually, application requests wait for a pool connection and fail with `pool acquire timeout`.

The normal database CPU, disk wait, and slow-query indicators support this conclusion: the problem is connection retention during external waiting, not database execution saturation.

## Permanent correction

Move the external payment-API call outside the database transaction. Keep only the short database update that requires transactional protection inside the transaction.

Before deploying the correction, recalculate the per-instance pool maximum from the global database limit of 180. The combined maximum across all API instances must remain within that limit, with appropriate allowance for any other database clients if they exist.

Do not restore the API to 12 instances with the existing per-instance pool maximum of 20; that configuration again permits 240 potential API connections.

## Incident handoff

Record:

- Rollback time and the API instance count used for mitigation.
- The start and end of the 30-minute recovery window.
- Whether all recovery conditions were met.
- The release change that introduced the external call inside the transaction.
- The owner and expected release for the permanent transaction-boundary fix.