# Schedule transactional email

Use `POST https://api.kitemail.example/v1/messages` to queue a transactional email for immediate or future delivery. Every request requires a bearer token and an idempotency key.

A successful `202 Accepted` means Kite Mail has queued the message. It does not confirm that the email has been delivered.

## Send a message

Include these headers:

```http
Authorization: Bearer <token>
Idempotency-Key: <unique-key>
```

Provide the message fields in the request body:

| Field | Required | Description |
|---|---:|---|
| `to` | Yes | Recipient or recipients. A request may include at most 100 recipients. |
| `template_id` | Yes | The transactional email template to send. |
| `variables` | Yes | Values used by the template. |
| `send_at` | No | When to send the message, as an RFC 3339 timestamp. Omit it to queue the message immediately. It must be within seven days of the current time. |

For example, schedule a message for a specific time:

```json
{
  "to": ["customer@example.com"],
  "template_id": "welcome-email",
  "variables": {
    "first_name": "Avery"
  },
  "send_at": "2026-07-13T09:00:00Z"
}
```

A queued request returns:

```http
202 Accepted
```

```json
{
  "message_id": "…",
  "status": "queued"
}
```

Store the returned `message_id` in your application logs or database so you can associate the queued message with your own workflow.

## Use idempotency keys safely

Generate one `Idempotency-Key` per logical send operation, then reuse that key if the same operation must be retried.

If you repeat the same request body with the same key within 24 hours, Kite Mail returns the original response. This prevents duplicate emails when a network failure leaves the client uncertain whether the request reached the API.

Do not reuse a key for a changed request body. Kite Mail returns `409 Conflict` in that case. Create a new key after intentionally changing recipients, template data, or the scheduled time.

## Handle errors and retries

| Status | Meaning | Client action |
|---|---|---|
| `400 Bad Request` | Invalid input | Correct the request before trying again. |
| `401 Unauthorized` | Authentication failed | Correct the token or authentication configuration before trying again. |
| `409 Conflict` | Idempotency key was reused with a different body | Use the original body with that key, or create a new key for the changed request. |
| `429 Too Many Requests` | Rate limit exceeded | Retry after the duration in `Retry-After`. |

Network errors may also be retried. When retrying a request that may already have been accepted, reuse the same idempotency key and unchanged request body.

Do not automatically retry `400`, `401`, or `409` responses without changing the request or its credentials.