Write a guide to scheduling messages with the Kite Mail API for developers integrating it for the first time.
It will appear in our internal developer portal.

What we know:

- The base URL is `https://api.kitemail.example`.
- Schedule a transactional email with `POST /v1/messages`.
- `Authorization: Bearer <token>` and `Idempotency-Key` are required.
- The request body can contain `to`, `template_id`, and `variables`. `send_at` is optional and uses RFC 3339. A request can have at most 100 recipients, and `send_at` must be within seven days of the current time.
- A successful request returns `202 Accepted` with `message_id` and `status: queued`. A 202 response does not mean that delivery is complete.
- Repeating the same body with the same `Idempotency-Key` within 24 hours returns the original response. Reusing the key with a different body returns 409.
- The main errors are 400 for invalid input, 401 for failed authentication, 409 for an idempotency-key conflict, and 429 for exceeding the rate limit. For 429, follow the `Retry-After` header.
- Do not automatically retry 400, 401, or 409 without changing the request. Network errors and 429 may be retried.
- We do not have information about any other features or URLs.

