# Scheduling messages with the Kite Mail API

The Kite Mail API schedules transactional emails through `POST /v1/messages`.

A successful request returns `202 Accepted`, which means the message has been queued—not delivered.

## Endpoint

```http
POST https://api.kitemail.example/v1/messages
```

Required headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
Idempotency-Key: <unique-key>
```

`Idempotency-Key` should identify one logical send operation. Store it so you can safely repeat a request after a network failure.

## Request body

The body may contain:

- `to`: recipient list; no more than 100 recipients
- `template_id`: the transactional email template to use
- `variables`: values supplied to the template
- `send_at`: optional RFC 3339 timestamp

`send_at` must be no more than seven days from the current time. Use a timezone-aware timestamp, such as `2026-07-15T09:00:00Z`.

Example:

```json
{
  "to": ["customer@example.com"],
  "template_id": "order-confirmation",
  "variables": {
    "order_id": "ORD-12345",
    "customer_name": "Aiko"
  },
  "send_at": "2026-07-15T09:00:00Z"
}
```

If `send_at` is omitted, the message is submitted without a scheduled delivery time.

## Example request

```bash
curl -X POST "https://api.kitemail.example/v1/messages" \
  -H "Authorization: Bearer $KITE_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-ORD-12345-confirmation-v1" \
  -d '{
    "to": ["customer@example.com"],
    "template_id": "order-confirmation",
    "variables": {
      "order_id": "ORD-12345",
      "customer_name": "Aiko"
    },
    "send_at": "2026-07-15T09:00:00Z"
  }'
```

## Successful response

The API returns `202 Accepted`:

```json
{
  "message_id": "msg_01HXYZ...",
  "status": "queued"
}
```

Save the `message_id` and treat `status: queued` as confirmation that Kite accepted the message for processing. It is not confirmation that the email was delivered.

## Idempotency

Repeating the same request body with the same `Idempotency-Key` within 24 hours returns the original response. This makes it safe to retry when the client does not know whether the original request reached Kite.

```text
Same key + same body     → original response
Same key + different body → 409 Conflict
```

Use a new idempotency key for a new logical message. Do not change the request body while retrying an uncertain request.

## Errors and retry behavior

| Status | Meaning | Recommended action |
|---|---|---|
| `400` | Invalid input | Fix the request; do not automatically retry unchanged |
| `401` | Authentication failed | Fix the token or authentication configuration |
| `409` | Idempotency-key conflict | Reconcile the key and request body |
| `429` | Rate limit exceeded | Retry after the delay in the `Retry-After` header |

Network errors may be retried using the same idempotency key and unchanged body. Rate-limit responses may also be retried after honoring `Retry-After`.

Do not automatically retry `400`, `401`, or `409` without changing the request or correcting its cause.

## Integration checklist

Before sending a message:

- Include both `Authorization` and `Idempotency-Key`.
- Keep each request to 100 recipients or fewer.
- Format `send_at` as RFC 3339.
- Ensure `send_at` is within seven days of the current time.
- Persist the idempotency key for retry handling.
- Interpret `202` as `queued`, not delivered.
- Honor `Retry-After` for `429` responses.