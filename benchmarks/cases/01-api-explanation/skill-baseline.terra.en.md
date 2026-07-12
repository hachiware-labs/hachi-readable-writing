# Schedule Transactional Email

Use `POST https://api.kitemail.example/v1/messages` to queue a transactional email for immediate or scheduled sending. Include `send_at` only when the message should be sent later.

A scheduled time must use RFC 3339 and be no more than seven days from the current time.

```http
POST /v1/messages HTTP/1.1
Host: api.kitemail.example
Authorization: Bearer <token>
Idempotency-Key: <unique-key>
Content-Type: application/json
```

```json
{
  "to": "<recipient-or-recipient-list>",
  "template_id": "welcome-email",
  "variables": {
    "first_name": "Ada"
  },
  "send_at": "2026-07-13T09:00:00Z"
}
```

`to`, `template_id`, and `variables` may be included in the request body. The request may contain at most 100 recipients. Omit `send_at` to queue the message without scheduling it for a future time.

## Successful response

A successful request returns `202 Accepted`.

```json
{
  "message_id": "<message-id>",
  "status": "queued"
}
```

`202 Accepted` means Kite Mail accepted the request and queued the message. It does not confirm that the email has been delivered.

## Use an idempotency key

`Idempotency-Key` is required. Generate a key for the logical send operation and reuse it if the client must retry the same request.

If the same request body is sent again with the same key within 24 hours, Kite Mail returns the original response. If a key is reused with a different request body, the API returns `409 Conflict`.

Do not reuse an idempotency key for a changed recipient set, template, variables, or scheduled time.

## Handle errors and retries

| Status | Meaning | Client action |
|---|---|---|
| `400` | Invalid input | Correct the request before sending again. Do not retry automatically. |
| `401` | Authentication failed | Correct the authentication problem before sending again. Do not retry automatically. |
| `409` | Idempotency-key conflict | Use the appropriate key for the request. Do not retry automatically without changing the request. |
| `429` | Rate limit exceeded | Retry after the duration specified by `Retry-After`. |

Network errors may also be retried. When retrying, send the unchanged request body with the same `Idempotency-Key` so a successful first attempt is not queued twice.