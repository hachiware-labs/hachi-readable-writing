# Receiving Pulse webhooks with Node.js and Express

Pulse signs the exact bytes it sends. Verify that signature before parsing JSON; parsing and re-serializing can change the byte representation and make a valid signature fail.

Install Express 5 and set the shared secret:

```bash
npm install express@5
set PULSE_WEBHOOK_SECRET=your_webhook_secret
node server.js
```

On macOS or Linux, use `export PULSE_WEBHOOK_SECRET=your_webhook_secret` instead.

Create `server.js`:

```js
const express = require("express");
const crypto = require("node:crypto");

const app = express();
const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("PULSE_WEBHOOK_SECRET is required");
}

// Use this raw-body parser on the webhook route before any JSON parser.
app.post(
  "/webhooks/pulse",
  express.raw({ type: "*/*" }),
  (req, res) => {
    const timestamp = req.get("X-Pulse-Timestamp");
    const signatureHeader = req.get("X-Pulse-Signature");

    // Require a Unix-seconds timestamp and sha256=<64 hex characters>.
    if (
      !timestamp ||
      !/^\d+$/.test(timestamp) ||
      !signatureHeader
    ) {
      return res.sendStatus(400);
    }

    const signatureMatch = /^sha256=([0-9a-fA-F]{64})$/.exec(signatureHeader);
    if (!signatureMatch) {
      return res.sendStatus(400);
    }

    const timestampSeconds = Number(timestamp);
    if (
      !Number.isSafeInteger(timestampSeconds) ||
      Math.abs(Date.now() / 1000 - timestampSeconds) > 5 * 60
    ) {
      return res.sendStatus(401);
    }

    // Sign timestamp + "." + the exact raw request-body bytes.
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(timestamp, "utf8")
      .update(".", "utf8")
      .update(req.body)
      .digest();

    const receivedSignature = Buffer.from(signatureMatch[1], "hex");

    if (
      receivedSignature.length !== expectedSignature.length ||
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

    // Process only after authentication and JSON parsing succeed.
    if (event.type === "invoice.paid") {
      console.log("Invoice paid:", event.data?.invoice_id);
    }

    return res.sendStatus(204);
  }
);

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

For example, Pulse may send this JSON body:

```json
{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

Do not place `express.json()` before this webhook route. If the application needs JSON parsing for other endpoints, register it afterward:

```js
app.use(express.json());
```

The handler returns:

- `400` for missing or malformed signature headers, or invalid JSON.
- `401` for timestamps more than five minutes from the current time or signatures that do not match.
- `204` after successful verification and processing.

Avoid logging `PULSE_WEBHOOK_SECRET` or the full `X-Pulse-Signature` value.