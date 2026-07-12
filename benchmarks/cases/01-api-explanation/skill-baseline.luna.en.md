# Scheduling Messages with the Kite Mail API

Use `POST /v1/messages` to submit a transactional email for processing. Include `send_at` when the message should be scheduled for a specific time.

## Endpoint

```http
POST https://api.kitemail.example/v1/messages
```

Required headers:

```http
Authorization: Bearer <token>
Idempotency-Key: <unique-key>
Content-Type: application/json
```

`Authorization` authenticates the request. `Idempotency-Key` prevents a retry from creating a duplicate message.

## Request body

The body can contain:

- `to` — recipients; a request may contain at most 100 recipients.
- `template_id` — the transactional email template to use.
- `variables` — values required by the selected template.
- `send_at` — optional scheduled time in RFC 3339 format.

Example payload:

```json
{
  "to": [
    "recipient@example.com"
  ],
  "template_id": "welcome-email",
  "variables": {
    "name": "Ada"
  },
  "send_at": "2026-07-15T09:00:00Z"
}
```

The values in this example are illustrative. Use the recipient and variable formats defined by your template configuration.

`send_at` must fall within seven days of the current time when the request is made. Use an RFC 3339 timestamp, such as `2026-07-15T09:00:00Z`.

## Example request

```bash
curl -X POST "https://api.kitemail.example/v1/messages" \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: order-123-confirmation-v1" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient@example.com"],
    "template_id": "order-confirmation",
    "variables": {
      "order_id": "123"
    },
    "send_at": "2026-07-15T09:00:00Z"
  }'
```

Generate one idempotency key for each intended message operation. If the request fails because of a network problem, retry the same request with the same key.

## Successful response

A successful request returns `202 Accepted`:

```json
{
  "message_id": "msg_12345",
  "status": "queued"
}
```

This response confirms that Kite Mail accepted the message for processing. `status: queued` does not mean that delivery is complete.

## Idempotency

If you repeat the same request body with the same `Idempotency-Key` within 24 hours, Kite Mail returns the original response.

Reusing an idempotency key with a different request body returns `409 Conflict`. Do not reuse a key for a different message or payload.

## Errors and retries

| Status | Meaning | Recommended action |
|---|---|---|
| `400` | Invalid input | Correct the request before retrying. |
| `401` | Authentication failed | Check the bearer token before retrying. |
| `409` | Idempotency-key conflict | Resolve the key and body mismatch; do not automatically retry unchanged. |
| `429` | Rate limit exceeded | Wait for the duration specified by the `Retry-After` header, then retry. |

Do not automatically retry `400`, `401`, or `409` without changing or correcting the request. Network errors and `429` responses may be retried. For network retries, preserve the original request body and idempotency key so that the operation remains idempotent.