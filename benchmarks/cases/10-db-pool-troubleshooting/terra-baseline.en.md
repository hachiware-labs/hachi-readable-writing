# Production API Incident Guide: Database Connection Pool Exhaustion

Use this guide when API latency rises and `pool acquire timeout` errors increase.

## Immediate containment

1. Record the current incident state before changing anything: API p95 latency, `pool acquire timeout` rate, active database sessions, and `idle in transaction` sessions. Record the deployed release version and current API instance count.

2. Roll back the immediately preceding release.

3. Temporarily reduce the API fleet from 12 instances to 8 instances.

   With the current per-instance pool maximum of 20, eight instances can open at most 160 connections. Do not increase the database connection limit.

4. Confirm that the rollback and scale change have completed, then watch the API and database connection metrics continuously.

Do not treat low database CPU or normal disk wait as evidence that the incident is resolved. This failure is connection contention, not database compute or storage saturation.

## What is happening

The API can theoretically open 240 connections: 12 instances × 20 connections per pool. The database allows only 180 connections.

The preceding release placed an external payment-API call inside a database transaction. That call takes two to eight seconds, so each affected request holds a database connection and transaction open while it waits on an external service. As transactions remain open longer, the pool has fewer connections available for new requests. This produces `pool acquire timeout` errors and sharply increases API latency.

The evidence supports this explanation:

- API p95 latency rose from 300 ms to 9 s.
- `pool acquire timeout` errors increased.
- `idle in transaction` sessions increased.
- Database CPU stayed below 45%, disk wait was normal, and slow queries did not increase.

## Restoration checks

Continue the temporary mitigation until all of the following hold for 30 consecutive minutes:

- No `pool acquire timeout` errors.
- API p95 latency is below 500 ms.
- `idle in transaction` sessions have returned to their normal level.

If any condition fails during the 30-minute window, continue the mitigation and investigate whether the rollback or instance reduction did not take effect as expected.

## During the incident

Keep the incident record updated with:

- Start time, rollback time, and scale-change time.
- API p95 latency and acquire-timeout trend before and after mitigation.
- Connection and `idle in transaction` session counts.
- Release version rolled back.
- Whether recovery criteria have been met.

Communicate that the database is not CPU- or disk-bound; the current constraint is connections held by long-running transactions.

## Permanent correction

Move the external payment-API call outside the database transaction. Keep only the short database update that truly requires transactional protection inside the transaction.

Before deploying the correction, recalculate the per-instance pool maximum from the database-wide connection limit. The total possible API connections across all instances must remain within the allowed API allocation of the global limit, with capacity reserved for any non-API database users. Use:

`per-instance pool maximum = floor((database limit − reserved connections) / API instance count)`

Validate the corrected flow under payment-API latency of two to eight seconds. Confirm that transactions remain short, `idle in transaction` does not rise, and the expected API fleet cannot collectively exceed its allocated connection budget.