# Pulse Webhook を Express で受信する

Webhook では、JSON を解析する前の**受信したままの本文バイト列**を使って署名を検証します。先に `express.json()` で解析すると本文が変換され、Pulse が署名した内容と一致しなくなる可能性があります。

以下は Node.js 22、Express 5 で `POST /webhooks/pulse` を受ける最小例です。

```js
// server.js
import crypto from "node:crypto";
import express from "express";

const app = express();
const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("PULSE_WEBHOOK_SECRET を設定してください");
}

// このルートでは JSON ではなく、生の Buffer として本文を受け取る。
app.post("/webhooks/pulse", express.raw({ type: "application/json" }), (req, res) => {
  const timestamp = req.get("X-Pulse-Timestamp");
  const signatureHeader = req.get("X-Pulse-Signature");

  // Unix秒と sha256=<64桁のhex> を受け付ける。
  if (
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    !signatureHeader ||
    !/^sha256=[0-9a-f]{64}$/i.test(signatureHeader)
  ) {
    return res.sendStatus(400);
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isSafeInteger(timestampSeconds)) {
    return res.sendStatus(400);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > 5 * 60) {
    return res.sendStatus(401);
  }

  // `${timestamp}.` のUTF-8バイト列に、受信した生本文をそのまま連結する。
  const signedPayload = Buffer.concat([
    Buffer.from(`${timestamp}.`, "utf8"),
    req.body,
  ]);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const receivedSignature = signatureHeader.slice("sha256=".length);

  // timingSafeEqual は長さが一致している Buffer 同士にだけ使う。
  const signaturesMatch =
    receivedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(receivedSignature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );

  if (!signaturesMatch) {
    return res.sendStatus(401);
  }

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.sendStatus(400);
  }

  // 必要な処理をここに書く。秘密値や署名全文はログに出さない。
  if (event.type === "invoice.paid") {
    console.log("invoice.paid を受信しました", {
      invoiceId: event.data?.invoice_id,
    });
  }

  return res.sendStatus(204);
});

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
```

起動前に秘密値を設定します。

```powershell
$env:PULSE_WEBHOOK_SECRET = "Pulseから取得した秘密値"
node server.js
```

Pulse から次のような本文が届いた場合、署名対象は JSON 文字列ではなく、HTTP で届いた生バイト列です。

```json
{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

署名検証では、`X-Pulse-Timestamp` の値、`.`、生本文をこの順で連結し、`PULSE_WEBHOOK_SECRET` を鍵に HMAC-SHA256 を計算します。ヘッダー不足・形式不正・不正な JSON は `400`、時刻差が5分を超える場合と署名不一致は `401`、正常に処理できた場合は `204` を返します。

アプリ全体で `express.json()` を使う場合も、このルートだけは生本文を受け取る必要があります。`express.json()` より前にこのルートを登録するか、`/webhooks/pulse` を JSON パーサーの対象から外してください。