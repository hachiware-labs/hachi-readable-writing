# Receiving Pulse Webhooks with Node.js and Express

Pulse signs each webhook so your server can verify that the request body has not been altered. Verification must use the exact bytes Pulse sent; parsing and re-serializing the JSON can change those bytes and invalidate the signature.

This example uses Node.js 22 and Express 5.

## Set up the server

Create a project and install Express:

```bash
npm init -y
npm install express@5
```

Set `PULSE_WEBHOOK_SECRET` to the secret supplied by Pulse:

```bash
export PULSE_WEBHOOK_SECRET="your-webhook-secret"
```

On PowerShell:

```powershell
$env:PULSE_WEBHOOK_SECRET = "your-webhook-secret"
```

Create `server.js`:

```js
const express = require("express");
const crypto = require("node:crypto");

const app = express();
const webhookSecret = process.env.PULSE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("PULSE_WEBHOOK_SECRET is required");
}

app.post(
  "/webhooks/pulse",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const timestamp = req.get("X-Pulse-Timestamp");
    const signature = req.get("X-Pulse-Signature");

    // Both headers are required. A SHA-256 signature contains 64 hex digits.
    if (
      !timestamp ||
      !signature ||
      !/^\d+$/.test(timestamp) ||
      !/^sha256=[0-9a-f]{64}$/i.test(signature)
    ) {
      return res.sendStatus(400);
    }

    const timestampSeconds = Number(timestamp);

    if (!Number.isSafeInteger(timestampSeconds)) {
      return res.sendStatus(400);
    }

    // Reject requests sent more than five minutes ago or in the future.
    const currentSeconds = Math.floor(Date.now() / 1000);

    if (Math.abs(currentSeconds - timestampSeconds) > 300) {
      return res.sendStatus(401);
    }

    // Sign the timestamp, a period, and the exact request-body bytes.
    const signedInput = Buffer.concat([
      Buffer.from(`${timestamp}.`, "utf8"),
      req.body,
    ]);

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedInput)
      .digest();

    const receivedSignature = Buffer.from(
      signature.slice("sha256=".length),
      "hex"
    );

    if (
      expectedSignature.length !== receivedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return res.sendStatus(401);
    }

    let event;

    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.sendStatus(400);
    }

    if (event.type === "invoice.paid") {
      const invoiceId = event.data?.invoice_id;

      // Process the paid invoice here.
      console.log("Invoice paid:", invoiceId);
    }

    return res.sendStatus(204);
  }
);

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

Start the server:

```bash
node server.js
```

The route uses `express.raw()` instead of `express.json()` because signature verification depends on the original request bytes. Only after the signature passes does the handler parse an event such as:

```json
{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

## Send a signed test webhook

Create `send-test-webhook.js`:

```js
const crypto = require("node:crypto");

const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("PULSE_WEBHOOK_SECRET is required");
}

const timestamp = Math.floor(Date.now() / 1000).toString();
const body = JSON.stringify({
  type: "invoice.paid",
  data: {
    invoice_id: "inv_123",
  },
});

const signature = crypto
  .createHmac("sha256", secret)
  .update(`${timestamp}.${body}`)
  .digest("hex");

const response = await fetch("http://localhost:3000/webhooks/pulse", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Pulse-Timestamp": timestamp,
    "X-Pulse-Signature": `sha256=${signature}`,
  },
  body,
});

console.log("Status:", response.status);
```

Run it while the server is listening:

```bash
node send-test-webhook.js
```

A valid request prints `Status: 204`. The endpoint returns `400` for missing or malformed headers and invalid JSON, and `401` for stale timestamps or signature mismatches. The secret and complete signature should never be written to logs.