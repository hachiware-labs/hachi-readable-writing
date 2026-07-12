# Production API Database Connection Pool Exhaustion Guide

## Immediate response

Roll back the release that moved the payment API call inside the database transaction, then reduce the API from 12 instances to eight. Do not increase the database connection limit.

Before rollback, capture the release version, incident start time, and current values for API p95 latency, `pool acquire timeout` errors, active connections, and `idle in transaction` sessions. Do not delay mitigation to collect additional evidence.

With eight instances and the current per-instance maximum of 20, the API can open at most 160 connections, below the database limit of 180. The remaining 20 connections are headroom for other database users and operational activity.

## Why this is the likely cause

At 12 instances, the configured pools can request a theoretical total of 240 connections, exceeding the database limit of 180. The preceding release also placed a two-to-eight-second external payment API call inside a database transaction. Each request can therefore hold a connection while waiting for an external service.

The increase in `idle in transaction` sessions supports this explanation. Database CPU stayed below 45 percent, disk wait remained normal, and slow queries did not increase, so the evidence points to connections being held too long rather than the database exhausting compute or storage capacity.

As available connections disappeared, requests waited for the pool. This raised p95 latency from 300 milliseconds to 9 seconds and produced more `pool acquire timeout` errors.

## Containment procedure

1. Record the incident start time, affected release, current instance count, and key measurements.

2. Roll back the release that moved the payment API call inside the transaction.

3. Temporarily reduce the API from 12 instances to eight.

4. Confirm that the rollback and instance-count change completed through the deployment mechanism used by the service.

5. Watch API p95 latency, `pool acquire timeout` errors, database connection usage, and `idle in transaction` sessions. Also confirm that database CPU, disk wait, and slow-query behavior remain consistent with the current diagnosis.

Do not change the database connection limit. Raising it could shift pressure to the database without correcting the transaction that is holding connections.

## Recovery and exit conditions

Keep the incident active until all of the following conditions hold continuously for 30 minutes:

- No `pool acquire timeout` errors occur.
- API p95 latency remains below 500 milliseconds.
- `idle in transaction` sessions return to their normal level.

If any condition fails during the observation period, restart the 30-minute window. Do not restore the API to 12 instances during incident recovery.

If rollback and scale reduction do not produce a clear downward trend in timeouts and latency, reassess the diagnosis. Check whether the rollback actually reached all instances, whether another workload is consuming connections, and whether transactions remain open through another code path. Preserve relevant application and database evidence before taking further corrective action.

## Communication and ownership

The on-call engineer owns containment and recovery verification. Record:

- when the incident was detected;
- the affected release;
- when rollback began and completed;
- when the API reached eight instances;
- measurements at the start of the recovery window;
- any recovery-window reset and its cause;
- when all exit conditions had held for 30 minutes.

Notify the service and database owners if the mitigation does not reduce connection pressure or if another workload appears to be consuming the remaining capacity.

## Permanent correction

Move the external payment API call outside the database transaction. Keep only the short database update that requires transactional consistency inside the transaction.

Recalculate the per-instance pool maximum from the database-wide connection budget:

```text
per-instance pool maximum =
floor((180 - reserved non-API connections - operational headroom) / API instance count)
```

Do not calculate the pool from the full limit unless the API is the database’s only connection source. The reserved amount must account for other applications, administrative access, migrations, monitoring, and expected connection spikes.

Before restoring the normal instance count, verify that the sum of all instance pools fits within the approved API connection budget. At 12 instances, the current maximum of 20 allows 240 connections and is therefore invalid against a database limit of 180 even before reserving headroom.