Write an incident guide for the database connection pool exhaustion affecting our production API.
The on-call engineer will use it during the incident.

What we know:

- The API runs 12 instances, each with a pool maximum of 20, allowing a theoretical total of 240 connections.
- The database connection limit is 180.
- During the incident, API p95 latency rose from 300 milliseconds to 9 seconds, and `pool acquire timeout` errors increased.
- Database CPU remained below 45 percent, disk wait remained normal, and slow queries did not increase.
- The immediately preceding release moved an external payment-API call inside a database transaction. The external call takes two to eight seconds.
- `idle in transaction` sessions increased.
- Immediate mitigation is to roll back the release and temporarily reduce the API to eight instances. Do not change the database connection limit.
- The permanent fix is to move the external API call outside the transaction and keep only the short required update inside it. Recalculate the per-instance pool maximum from the global limit.
- Recovery requires 30 minutes with no `pool acquire timeout`, p95 below 500 milliseconds, and `idle in transaction` back to its normal level.
- We do not have specific commands or monitoring screen names in the incident notes.

