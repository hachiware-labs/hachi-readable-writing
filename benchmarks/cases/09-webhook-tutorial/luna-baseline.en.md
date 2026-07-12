Use route-specific `express.raw()` so Express gives you the original body as a `Buffer`. Verify that buffer before parsing it as JSON.

Install Express 5:

```bash
npm install express@5
```

Create `server.js`:

```js
const express = require("express");
const {
  createHmac,
  timingSafeEqual,
} = require("node:crypto");

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

    // Missing or malformed headers
    if (
      !timestamp ||
      !signature ||
      !/^\d+$/.test(timestamp)
    ) {
      return res.sendStatus(400);
    }

    const match = /^sha256=([0-9a-fA-F]{64})$/.exec(signature);

    if (!match) {
      return res.sendStatus(400);
    }

    const timestampSeconds = Number(timestamp);

    // Reject invalid or stale/replayed timestamps
    if (
      !Number.isSafeInteger(timestampSeconds) ||
      Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > 300
    ) {
      return res.sendStatus(401);
    }

    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      return res.sendStatus(400);
    }

    // Signed input: `${timestamp}.${rawBody}`
    const expected = createHmac("sha256", secret)
      .update(timestamp, "utf8")
      .update(".")
      .update(rawBody)
      .digest();

    const received = Buffer.from(match[1], "hex");

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return res.sendStatus(401);
    }

    let event;

    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.sendStatus(400);
    }

    if (event.type === "invoice.paid") {
      const invoiceId = event.data?.invoice_id;

      // Process the event here.
      // Example: queue work or update application state.
      void invoiceId;
    }

    return res.status(204).end();
  }
);

// Put JSON parsing after the webhook route.
app.use(express.json());

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

Run it with:

```bash
PULSE_WEBHOOK_SECRET="your-secret" node server.js
```

The critical details are:

- Do not put `express.json()` before the webhook route.
- Sign and verify the exact raw bytes, not `JSON.stringify()` output.
- Compare the decoded HMAC values with `timingSafeEqual`.
- Avoid logging the secret or the complete signature.
- A valid request containing `{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}` receives `204 No Content`.