# Schedule messages with the Kite Mail API

Use the Kite Mail API to queue a transactional email for delivery at a specified time. Scheduling is done by sending a `POST` request to:

```text
https://api.kitemail.example/v1/messages
```

A successful request returns `202 Accepted`, which means the message has been queued—not delivered.

## Send a scheduled message

Include a bearer token and a unique idempotency key in the request headers:

```http
POST /v1/messages HTTP/1.1
Host: api.kitemail.example
Authorization: Bearer <token>
Idempotency-Key: <unique-key>
Content-Type: application/json
```

The request body can contain:

- `to`: The intended recipients. A request may include no more than 100 recipients.
- `template_id`: The transactional email template identifier.
- `variables`: Values used when rendering the template.
- `send_at`: The scheduled time in RFC 3339 format. This field is optional, but when provided it must be within seven days of the current time.

The following schematic example schedules a message for July 15, 2026 at 09:00 UTC. The exact representation of recipients and template variables is not specified here.

```json
{
  "to": "<recipient value>",
  "template_id": "account-created",
  "variables": {
    "<variable name>": "<variable value>"
  },
  "send_at": "2026-07-15T09:00:00Z"
}
```

Generate `send_at` as an RFC 3339 timestamp with an explicit time-zone offset, such as `Z` for UTC. Before submitting the request, confirm that the timestamp is no more than seven days in the future.

## Handle the accepted response

An accepted request returns HTTP `202` with a response like:

```json
{
  "message_id": "<message-id>",
  "status": "queued"
}
```

Store `message_id` if your application needs to associate the queued message with its own records. The `queued` status confirms only that Kite Mail accepted the request; it does not confirm delivery.

No delivery-status endpoint or other message-management URL is currently documented.

## Use idempotency keys safely

Every request requires an `Idempotency-Key`. Use a key that uniquely represents the logical send operation, and preserve it when retrying the same request.

If the same request body and key are submitted again within 24 hours, Kite Mail returns the original response instead of creating another message. This allows a client to retry after a network error without knowingly scheduling a duplicate.

Do not change the body while reusing a key. If the same key is submitted with a different body, the API returns `409 Conflict`. To submit a changed message, create a new idempotency key.

## Handle failures and retries

Retry only when the failure may be temporary:

| Status or failure | Meaning | Client action |
|---|---|---|
| `400 Bad Request` | The input is invalid | Correct the request before trying again. |
| `401 Unauthorized` | Authentication failed | Correct the token or authentication configuration before trying again. |
| `409 Conflict` | The idempotency key was reused with a different body | Restore the original body or submit the changed request with a new key. |
| `429 Too Many Requests` | The rate limit was exceeded | Wait for the duration specified by `Retry-After`, then retry. |
| Network error | The outcome may be unknown | Retry the identical body with the same idempotency key. |

Do not automatically retry `400`, `401`, or `409` responses without changing the invalid part of the request. For network errors, keep both the body and idempotency key unchanged so that a request accepted before the connection failed is not queued a second time.