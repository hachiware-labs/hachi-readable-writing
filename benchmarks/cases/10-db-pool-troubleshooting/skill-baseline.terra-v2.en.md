# Production Incident Guide: Database Connection Pool Exhaustion

## Do now

1. Roll back the release that moved the external payment-API call inside a database transaction.

2. Temporarily reduce the API from 12 instances to 8 instances.

   With a pool maximum of 20, eight instances allow up to 160 database connections, below the database limit of 180. Do not raise the database connection limit.

3. Watch for the immediate trend:

   - `pool acquire timeout` errors stop increasing.
   - API p95 latency falls from the incident level.
   - `idle in transaction` sessions decline.

## What is happening

The API can theoretically open 240 connections (12 instances × 20 connections), while the database permits only 180. The preceding release worsened this mismatch by holding database transactions open during an external payment-API call that can take two to eight seconds.

This ties up pooled connections even though the database itself is not overloaded: CPU is below 45%, disk wait is normal, and slow queries have not increased. The rising `idle in transaction` count supports this diagnosis.

## Preserve minimal evidence

Before or while rolling back, record the incident time and capture the available values for:

- API instance count and per-instance pool maximum.
- `pool acquire timeout` error rate.
- API p95 latency.
- `idle in transaction` session count.
- Database CPU, disk wait, and slow-query trend.
- The release version being rolled back.

Do not delay rollback to collect more evidence.

## Recovery criteria

Keep the API at eight instances until all of the following have remained true for 30 continuous minutes:

- No `pool acquire timeout` errors.
- API p95 latency is below 500 milliseconds.
- `idle in transaction` sessions have returned to their normal level.

If any condition fails during the 30-minute period, continue the mitigation state and investigate whether the rollback completed and whether instances still use the expected pool configuration.

## Permanent correction

Move the external payment-API call outside the database transaction. Keep only the short database update that requires transactional protection inside the transaction.

Before restoring instance count or changing pool settings, recalculate the per-instance pool maximum from the global database connection limit. The combined maximum across all API instances must remain below the database limit, with appropriate capacity reserved for non-API database clients.