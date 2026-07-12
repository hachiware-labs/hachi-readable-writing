## Receive and verify Pulse webhooks

A webhook is an HTTP request sent by Pulse to your server. Treat the body as untrusted until its signature verifies.

Pulse signs the exact bytes it sends, using this value:

```text
<timestamp>.<raw request-body bytes>
```

Your endpoint must therefore read the body as raw bytes, verify the HMAC-SHA256 signature, and only then parse the JSON.

```js
// server.mjs
import crypto from "node:crypto";
import express from "express";

const app = express();
const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("PULSE_WEBHOOK_SECRET is required");
}

// This route must be registered before express.json().
// It preserves the exact bytes Pulse signed.
app.post("/webhooks/pulse", express.raw({ type: "*/*" }), (req, res) => {
  const timestamp = req.get("X-Pulse-Timestamp");
  const signature = req.get("X-Pulse-Signature");

  // Require Unix seconds and sha256=<64 hexadecimal characters>.
  if (
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    !signature ||
    !/^sha256=[a-f0-9]{64}$/i.test(signature)
  ) {
    return res.sendStatus(400);
  }

  const timestampSeconds = Number(timestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);

  // Reject stale or implausibly future requests.
  if (
    !Number.isSafeInteger(timestampSeconds) ||
    Math.abs(nowSeconds - timestampSeconds) > 5 * 60
  ) {
    return res.sendStatus(401);
  }

  const receivedSignature = Buffer.from(
    signature.slice("sha256=".length),
    "hex",
  );

  // Keep the body as bytes: do not convert it to text before signing.
  const signedPayload = Buffer.concat([
    Buffer.from(`${timestamp}.`, "utf8"),
    req.body,
  ]);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest();

  // Both values are 32-byte SHA-256 digests; compare in constant time.
  if (
    receivedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return res.sendStatus(401);
  }

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.sendStatus(400);
  }

  // Example event:
  // { "type": "invoice.paid", "data": { "invoice_id": "inv_123" } }
  if (event.type === "invoice.paid") {
    const { invoice_id } = event.data;
    console.log(`Received invoice.paid for ${invoice_id}`);
  }

  return res.sendStatus(204);
});

// Apply JSON parsing only to routes that are not Pulse webhooks.
app.use(express.json());

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

Set the secret before starting the server:

```bash
PULSE_WEBHOOK_SECRET=your-secret node server.mjs
```

The endpoint returns:

| Condition | Status |
|---|---:|
| Missing or malformed timestamp/signature header | 400 |
| Timestamp more than five minutes from current time | 401 |
| Signature does not match | 401 |
| Verified signature, but invalid JSON | 400 |
| Verified and processed | 204 |

Do not log `PULSE_WEBHOOK_SECRET` or the full signature.