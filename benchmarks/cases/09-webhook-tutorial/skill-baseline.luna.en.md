# Receiving Pulse Webhooks with Node.js and Express

A Pulse webhook request should be verified before its JSON body is parsed. Pulse signs the timestamp together with the exact raw request-body bytes, so parsing the body first can change what is being verified.

This example uses Node.js 22 and Express 5.

## 1. Install Express

```bash
npm install express@5
```

Set the webhook secret in the environment:

```bash
PULSE_WEBHOOK_SECRET=your-secret node server.mjs
```

## 2. Create the webhook endpoint

Save the following as `server.mjs`:

```js
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

const app = express();
const port = 3000;

const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error('PULSE_WEBHOOK_SECRET is required');
}

function verifyPulseSignature(rawBody, timestampText, signatureHeader) {
  const match = /^sha256=([0-9a-fA-F]{64})$/.exec(signatureHeader);

  // The signature must contain exactly one SHA-256 digest.
  if (!match) {
    return false;
  }

  const expected = createHmac('sha256', secret)
    .update(timestampText, 'utf8')
    .update('.', 'utf8')
    .update(rawBody)
    .digest();

  const received = Buffer.from(match[1], 'hex');

  // The format check above guarantees equal-length buffers.
  return timingSafeEqual(expected, received);
}

app.post(
  '/webhooks/pulse',

  // Keep the body as a Buffer so its exact bytes can be verified.
  express.raw({ type: '*/*' }),

  (req, res) => {
    const timestampText = req.get('X-Pulse-Timestamp');
    const signatureHeader = req.get('X-Pulse-Signature');

    if (!timestampText || !signatureHeader) {
      return res.status(400).end();
    }

    // Unix seconds must be a decimal integer.
    if (!/^\d+$/.test(timestampText)) {
      return res.status(400).end();
    }

    const timestamp = Number(timestampText);

    if (!Number.isSafeInteger(timestamp)) {
      return res.status(400).end();
    }

    // Reject requests more than five minutes old or in the future.
    const now = Math.floor(Date.now() / 1000);

    if (Math.abs(now - timestamp) > 5 * 60) {
      return res.status(401).end();
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).end();
    }

    // Verify the timestamp and raw body before parsing JSON.
    if (!verifyPulseSignature(req.body, timestampText, signatureHeader)) {
      return res.status(401).end();
    }

    let event;

    try {
      event = JSON.parse(req.body.toString('utf8'));
    } catch {
      return res.status(400).end();
    }

    if (event.type === 'invoice.paid') {
      const invoiceId = event.data?.invoice_id;

      // Process the event here.
      console.log(`Invoice paid: ${invoiceId}`);
    }

    return res.status(204).end();
  }
);

// JSON parsing for other API routes must come after the webhook route.
app.use(express.json());

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
```

The signed input is constructed as:

```text
${timestamp}.${rawBody}
```

The code updates the HMAC with the timestamp, a period, and the original body `Buffer`. It then compares the expected digest with the received digest using `timingSafeEqual`.

## 3. Expected event

After verification, the body is parsed as JSON. A successful event might look like this:

```json
{
  "type": "invoice.paid",
  "data": {
    "invoice_id": "inv_123"
  }
}
```

The endpoint returns `204 No Content` after successful processing.

## Response behavior

| Condition | Response |
|---|---:|
| Missing required headers | `400` |
| Malformed signature | `400` |
| Invalid timestamp format | `400` |
| Timestamp more than five minutes from current time | `401` |
| Signature mismatch | `401` |
| Invalid JSON | `400` |
| Successful processing | `204` |

Do not log `PULSE_WEBHOOK_SECRET`, the complete `X-Pulse-Signature` value, or the request headers containing them.