# Receiving Pulse Webhooks with Node.js and Express

Pulse signs each webhook request so your endpoint can confirm that the body was not modified and was sent by someone who knows your webhook secret. Verify that signature against the exact raw request bytes before parsing JSON.

Install Express 5, then set `PULSE_WEBHOOK_SECRET` before starting the server.

```js
import crypto from "node:crypto";
import express from "express";

const app = express();
const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("PULSE_WEBHOOK_SECRET must be set");
}

app.post(
  "/webhooks/pulse",
  // Keep the body as a Buffer so signature verification uses its exact bytes.
  express.raw({ type: "*/*" }),
  (req, res) => {
    const timestamp = req.get("X-Pulse-Timestamp");
    const signatureHeader = req.get("X-Pulse-Signature");

    if (
      !timestamp ||
      !/^\d+$/.test(timestamp) ||
      !signatureHeader ||
      !/^sha256=[0-9a-fA-F]{64}$/.test(signatureHeader)
    ) {
      return res.status(400).end();
    }

    const timestampSeconds = Number(timestamp);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (
      !Number.isSafeInteger(timestampSeconds) ||
      Math.abs(nowSeconds - timestampSeconds) > 5 * 60
    ) {
      return res.status(401).end();
    }

    const receivedSignature = Buffer.from(
      signatureHeader.slice("sha256=".length),
      "hex",
    );

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(timestamp, "utf8")
      .update(".", "utf8")
      .update(req.body)
      .digest();

    if (
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return res.status(401).end();
    }

    let event;
    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).end();
    }

    // Handle the verified event. Do not log the secret or full signature.
    if (event.type === "invoice.paid") {
      console.log(`Invoice paid: ${event.data.invoice_id}`);
    }

    return res.status(204).end();
  },
);

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

For example, Pulse may send this body:

```json
{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

The value being signed is the timestamp text, followed by a period, followed by the unmodified request-body bytes. For a timestamp of `1710000000`, the conceptual signed input is:

```text
1710000000.{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

Do not place `express.json()` before this route: it parses the body and can prevent verification against the original bytes. Parse JSON only after the HMAC and constant-time comparison succeed.