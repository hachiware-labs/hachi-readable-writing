Signature verification must use the body exactly as received. In Express, attach `express.raw()` specifically to the webhook route, verify the HMAC, and only then call `JSON.parse()`.

```bash
npm init -y
npm install express@5
```

Save as `server.js`:

```js
const express = require("express");
const crypto = require("node:crypto");

const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("PULSE_WEBHOOK_SECRET is required");
}

const app = express();

app.post(
  "/webhooks/pulse",
  express.raw({ type: "*/*" }),
  (req, res) => {
    const timestamp = req.get("X-Pulse-Timestamp");
    const signature = req.get("X-Pulse-Signature");

    // Missing or malformed authentication headers.
    if (
      !timestamp ||
      !signature ||
      !/^\d+$/.test(timestamp) ||
      !/^sha256=[0-9a-fA-F]{64}$/.test(signature)
    ) {
      return res.sendStatus(400);
    }

    const timestampSeconds = Number(timestamp);

    if (!Number.isSafeInteger(timestampSeconds)) {
      return res.sendStatus(400);
    }

    // Reject requests older or newer than five minutes.
    const currentSeconds = Math.floor(Date.now() / 1000);

    if (Math.abs(currentSeconds - timestampSeconds) > 5 * 60) {
      return res.sendStatus(401);
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.sendStatus(400);
    }

    // Build: timestamp text + "." + exact raw body bytes.
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(timestamp, "utf8")
      .update(".", "utf8")
      .update(req.body)
      .digest();

    const receivedSignature = Buffer.from(
      signature.slice("sha256=".length),
      "hex"
    );

    if (!crypto.timingSafeEqual(expectedSignature, receivedSignature)) {
      return res.sendStatus(401);
    }

    let event;

    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.sendStatus(400);
    }

    // Process the verified event here.
    // Example:
    // {
    //   "type": "invoice.paid",
    //   "data": { "invoice_id": "inv_123" }
    // }
    if (event.type === "invoice.paid") {
      console.log("Invoice paid:", event.data?.invoice_id);
    }

    return res.sendStatus(204);
  }
);

// Register normal JSON parsing after the raw-body webhook route.
app.use(express.json());

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

Run it with the secret in the environment:

```powershell
$env:PULSE_WEBHOOK_SECRET = "your-webhook-secret"
node server.js
```

The important ordering is:

1. Receive the body as a `Buffer`.
2. Validate the headers and five-minute timestamp window.
3. calculate HMAC-SHA256 over the timestamp, period, and raw bytes.
4. Compare the decoded signatures with `crypto.timingSafeEqual()`.
5. Parse and process the JSON only after verification.

Keep the raw-body middleware scoped to this route. A global `express.json()` registered before it would consume and transform the body, preventing reliable signature verification. Do not log the secret or complete signature.