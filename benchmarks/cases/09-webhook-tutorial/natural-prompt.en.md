Explain how to receive Pulse webhooks with Node.js and Express.
The reader has built HTTP APIs but is new to signature verification, so include a minimal working example.

What we know:

- Use Node.js 22 and Express 5.
- The endpoint is `POST /webhooks/pulse`.
- Read the secret from `PULSE_WEBHOOK_SECRET`.
- `X-Pulse-Timestamp` contains Unix seconds. `X-Pulse-Signature` has the form `sha256=<hex>`.
- The signed input is the timestamp as text, a period, and the exact raw request-body bytes, conceptually `${timestamp}.${rawBody}`.
- Use HMAC-SHA256 and compare the expected and received values in constant time.
- Verify the signature against the raw body before parsing JSON.
- Missing headers or a malformed signature produce 400. A timestamp more than five minutes from the current time produces 401. A signature mismatch produces 401. Invalid JSON produces 400. Successful processing produces 204.
- The example event is `{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}`.
- Do not log the secret or the complete signature.
- Retries, IP restrictions, and persistence are not part of this specification.

