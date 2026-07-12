# Schedule transactional messages

Use `POST https://api.kitemail.example/v1/messages` to queue a transactional email. Set `send_at` to schedule it for a future time; omit it to queue the message without a specified scheduled time.

Every request requires both an API token and an idempotency key.

```bash
curl --request POST 'https://api.kitemail.example/v1/messages' \
  --header 'Authorization: Bearer <token>' \
  --header 'Idempotency-Key: <unique-key>' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": ["customer@example.com"],
    "template_id": "welcome-email",
    "variables": {
      "name": "Avery"
    },
    "send_at": "2026-07-14T09:00:00+09:00"
  }'
```

`send_at` is optional and must be an RFC 3339 timestamp no more than seven days from the current time. A request may include at most 100 recipients. The example recipient and template values are illustrative; use the recipient format and template identifiers defined for your integration.

## Accepted response

A successful submission returns `202 Accepted`:

```json
{
  "message_id": "msg_123",
  "status": "queued"
}
```

`queued` means Kite Mail accepted the request for processing. It does not confirm that the email has been delivered.

## Idempotency

Generate one idempotency key for each logical send operation and reuse it if you retry that same operation.

Within 24 hours, sending the same request body with the same `Idempotency-Key` returns the original response. This prevents a network retry from creating a duplicate scheduled message. Reusing a key with a different request body returns `409 Conflict`.

## Errors and retries

| Status | Meaning | Recommended action |
|---|---|---|
| `400` | Invalid input | Correct the request before sending again. |
| `401` | Authentication failed | Verify the token before sending again. |
| `409` | Idempotency-key conflict | Use the original body for that key, or create a new key for a new operation. |
| `429` | Rate limit exceeded | Retry after the duration specified by `Retry-After`. |

Network failures and `429` responses may be retried. Do not automatically retry `400`, `401`, or `409` responses without changing the request.