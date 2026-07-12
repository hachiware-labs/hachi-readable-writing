# Schedule messages with the Kite Mail API

Use the Kite Mail API to queue a transactional email for immediate or scheduled sending. All requests use this base URL:

```text
https://api.kitemail.example
```

## Send or schedule a message

Send a `POST` request to `/v1/messages`. Include an RFC 3339 timestamp in `send_at` to schedule the message. Omit `send_at` if you do not need to specify a delivery time.

```bash
curl --request POST \
  --url https://api.kitemail.example/v1/messages \
  --header "Authorization: Bearer $KITE_MAIL_TOKEN" \
  --header "Idempotency-Key: order-123-confirmation" \
  --header "Content-Type: application/json" \
  --data '{
    "to": ["customer@example.com"],
    "template_id": "order-confirmation",
    "variables": {
      "order_number": "123",
      "customer_name": "Avery"
    },
    "send_at": "2026-07-12T18:30:00+09:00"
  }'
```

The example’s recipient and variable values are illustrative; use the values expected by your integration and template.

A request may contain:

- `to`: the message recipients, with no more than 100 recipients per request
- `template_id`: the transactional email template
- `variables`: values supplied to the template
- `send_at`: an optional RFC 3339 timestamp

The `send_at` time must be within seven days of the current time. Generate it close to the time you submit the request to avoid validation failures.

## Required headers

Every request must include:

```http
Authorization: Bearer <token>
Idempotency-Key: <unique-key>
```

Keep tokens out of source control and logs.

Choose an idempotency key that uniquely identifies the logical send—for example, an order confirmation or password-reset operation. Persist the key with the operation so it can be reused if the request outcome is uncertain.

## Handle the response

A successfully accepted request returns `202 Accepted`:

```json
{
  "message_id": "example-message-id",
  "status": "queued"
}
```

`202 Accepted` means Kite Mail has queued the request. It does **not** mean the email has been delivered.

Store the returned `message_id` if your application needs to associate the queued message with its originating operation. No message-status URL is documented here, so do not assume that one exists.

## Prevent duplicate messages

Kite Mail retains idempotency results for 24 hours:

- Repeating the same request body with the same `Idempotency-Key` returns the original response.
- Reusing that key with a different body returns `409 Conflict`.

When retrying after a network error, resend the exact same body and idempotency key. Do not generate a new key, because that could create another queued message.

## Error handling and retries

| Status | Meaning | Recommended action |
|---|---|---|
| `400` | Invalid input | Correct the request before retrying. |
| `401` | Authentication failed | Correct the token or authentication configuration before retrying. |
| `409` | The idempotency key was reused with a different body | Use the original body, or use a new key only for a genuinely new message. |
| `429` | Rate limit exceeded | Wait for the duration specified by `Retry-After`, then retry. |

Network errors may also be retried. Use the same body and idempotency key for every attempt belonging to the same logical message.

Do not automatically retry `400`, `401`, or `409` responses without first changing or correcting the request. For network errors and `429` responses, use bounded retries and stop after a reasonable attempt or time limit.

## Integration checklist

Before releasing the integration, verify that it:

- Uses `https://api.kitemail.example/v1/messages`
- Sends both required headers
- Limits each request to 100 recipients
- Formats `send_at` as RFC 3339 and keeps it within seven days
- Treats `202` as queued, not delivered
- Reuses both the body and idempotency key after uncertain network outcomes
- Honors `Retry-After` for `429` responses
- Does not blindly retry `400`, `401`, or `409` responses
- Avoids relying on undocumented Kite Mail features or URLs