# Node.js と Express で Pulse の Webhook を受け取る

Pulse の署名は、JSON に変換する前の生本文に対して計算されています。そのため、Webhook のルートではまず生バイトを受け取り、署名とタイムスタンプを検証してから JSON を解析します。

## 準備

```bash
npm install express
```

秘密値を環境変数に設定して起動します。

```bash
PULSE_WEBHOOK_SECRET=your_secret node server.mjs
```

## 最小実装

```js
// server.mjs
import crypto from "node:crypto";
import express from "express";

const app = express();
const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("PULSE_WEBHOOK_SECRET is required");
}

// このルートだけは JSON ではなく生本文を受け取る。
// express.json() より先に登録することが重要。
app.post(
  "/webhooks/pulse",
  express.raw({ type: "*/*", limit: "1mb" }),
  (req, res) => {
    const timestamp = req.get("X-Pulse-Timestamp");
    const signatureHeader = req.get("X-Pulse-Signature");

    // ヘッダーが不足している、または署名形式が不正
    if (!timestamp || !signatureHeader) {
      return res.status(400).json({ error: "Missing webhook headers" });
    }

    if (!/^\d+$/.test(timestamp)) {
      return res.status(400).json({ error: "Invalid timestamp" });
    }

    const signatureMatch = /^sha256=([0-9a-f]{64})$/i.exec(signatureHeader);
    if (!signatureMatch) {
      return res.status(400).json({ error: "Invalid signature format" });
    }

    const timestampSeconds = Number(timestamp);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!Number.isSafeInteger(timestampSeconds)) {
      return res.status(400).json({ error: "Invalid timestamp" });
    }

    // 未来・過去のどちらも 5 分を超えるものは拒否する。
    if (Math.abs(nowSeconds - timestampSeconds) > 5 * 60) {
      return res.status(401).json({ error: "Webhook timestamp is too old" });
    }

    // 署名対象: timestamp + "." + raw body bytes
    const signedPayload = Buffer.concat([
      Buffer.from(`${timestamp}.`, "utf8"),
      req.body,
    ]);

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest();

    const receivedSignature = Buffer.from(signatureMatch[1], "hex");

    // 長さが異なる値は timingSafeEqual に渡せない。
    const signatureIsValid =
      receivedSignature.length === expectedSignature.length &&
      crypto.timingSafeEqual(receivedSignature, expectedSignature);

    if (!signatureIsValid) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    let event;
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(req.body);
      event = JSON.parse(text);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    // ここでイベントを処理する。
    // 例: event.type === "invoice.paid"
    console.log("Received Pulse event:", event.type);

    return res.status(204).end();
  },
);

// 通常の JSON API があるなら、Webhook ルートの後に登録する。
app.use(express.json());

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

たとえば、Pulse から次のイベントが届いた場合、署名検証に成功してから `event.type` として `invoice.paid` を扱えます。

```json
{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

重要なのは、`express.json()` を Webhook ルートより先に適用しないことです。先に JSON 解析すると元のバイト列が失われる可能性があり、Pulse が計算した署名と一致しなくなります。また、ログには `PULSE_WEBHOOK_SECRET` や `X-Pulse-Signature` の全文を出さないでください。