# Node.jsとExpressでPulseのWebhookを受け取る

PulseのWebhookでは、JSONを解析する前の本文を使って署名を検証します。Expressの通常の `express.json()` は本文をオブジェクトへ変換するため、Webhook用ルートでは先に `express.raw()` で生バイトを受け取る必要があります。

以下は、Node.js 22とExpress 5で動く最小例です。

## 準備

任意のディレクトリでプロジェクトを作成し、Expressをインストールします。

```bash
npm init -y
npm install express@5
```

秘密値を環境変数に設定します。実際にはPulse側に登録した値と同じものを指定してください。

PowerShellの場合:

```powershell
$env:PULSE_WEBHOOK_SECRET = "your-webhook-secret"
```

macOSやLinuxの場合:

```bash
export PULSE_WEBHOOK_SECRET="your-webhook-secret"
```

## 実装

`server.mjs` を作成します。

```js
import express from "express";
import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const app = express();
const port = 3000;
const webhookSecret = process.env.PULSE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("PULSE_WEBHOOK_SECRET is not set");
}

app.post(
  "/webhooks/pulse",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const timestampHeader = req.get("X-Pulse-Timestamp");
    const signatureHeader = req.get("X-Pulse-Signature");

    if (!timestampHeader || !signatureHeader) {
      return res.sendStatus(400);
    }

    // Unix秒として扱える整数だけを受け付ける。
    if (!/^\d+$/.test(timestampHeader)) {
      return res.sendStatus(400);
    }

    // sha256= に続く64桁の16進数であることを確認する。
    const signatureMatch = /^sha256=([0-9a-fA-F]{64})$/.exec(
      signatureHeader,
    );

    if (!signatureMatch) {
      return res.sendStatus(400);
    }

    const timestamp = Number(timestampHeader);
    const now = Math.floor(Date.now() / 1000);

    if (
      !Number.isSafeInteger(timestamp) ||
      Math.abs(now - timestamp) > 300
    ) {
      return res.sendStatus(401);
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.sendStatus(400);
    }

    // 署名対象は timestamp + "." + 本文の生バイト。
    const expectedSignature = createHmac(
      "sha256",
      webhookSecret,
    )
      .update(timestampHeader, "utf8")
      .update(".", "utf8")
      .update(req.body)
      .digest();

    const receivedSignature = Buffer.from(
      signatureMatch[1],
      "hex",
    );

    if (
      receivedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      return res.sendStatus(401);
    }

    let event;

    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.sendStatus(400);
    }

    // 秘密値や署名全文はログに出さない。
    console.log("Pulse webhook received", {
      type: event.type,
    });

    // ここでイベントを処理する。
    // 例: event.type === "invoice.paid"

    return res.sendStatus(204);
  },
);

// Webhook以外のJSON APIでは通常のJSON解析を利用できる。
app.use(express.json());

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
```

起動します。

```bash
node server.mjs
```

## 署名検証の流れ

Pulseから届くイベント本文は、たとえば次のJSONです。

```json
{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

署名対象は、次の3要素を順番に連結したバイト列です。

1. `X-Pulse-Timestamp` の文字列表現
2. ピリオド `.` 
3. 受信した本文の生バイト

たとえばタイムスタンプが `1780000000` なら、概念上の署名対象は次のようになります。

```text
1780000000.{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

ただし、実装では本文を文字列へ変換して連結せず、`Buffer` のままHMACへ渡しています。JSONを解析したり再度文字列化したりすると、空白やキーの並びなどが変わり、Pulseが署名したバイト列と一致しなくなる可能性があるためです。

受信した `X-Pulse-Signature` は `sha256=<hex>` から16進数部分を取り出し、バイト列へ変換します。期待するHMACもバイト列として生成し、両者を `timingSafeEqual()` で比較します。比較前に長さを確認しているのは、長さが異なる値を渡すと `timingSafeEqual()` が例外を投げるためです。

タイムスタンプは現在時刻との差が300秒を超えた場合に拒否します。これにより、古いリクエストや現在より大幅に先の時刻を持つリクエストを受理しません。

## ローカルで正常系を試す

次の `send-test.mjs` は、テスト用の署名を生成してローカルサーバーへWebhookを送信します。

```js
import { createHmac } from "node:crypto";

const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("PULSE_WEBHOOK_SECRET is not set");
}

const timestamp = Math.floor(Date.now() / 1000).toString();
const body = JSON.stringify({
  type: "invoice.paid",
  data: {
    invoice_id: "inv_123",
  },
});

const signature = createHmac("sha256", secret)
  .update(timestamp, "utf8")
  .update(".", "utf8")
  .update(Buffer.from(body, "utf8"))
  .digest("hex");

const response = await fetch(
  "http://localhost:3000/webhooks/pulse",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Pulse-Timestamp": timestamp,
      "X-Pulse-Signature": `sha256=${signature}`,
    },
    body,
  },
);

console.log(response.status);
```

サーバーを起動した状態で実行します。

```bash
node send-test.mjs
```

成功するとクライアントには `204` が表示され、サーバー側には次のような情報だけが記録されます。

```text
Pulse webhook received { type: 'invoice.paid' }
```

この実装が返すステータスは次のとおりです。

| 状況 | ステータス |
|---|---:|
| ヘッダー不足、タイムスタンプ形式不正、署名形式不正 | 400 |
| 現在時刻との差が5分を超える | 401 |
| 署名不一致 | 401 |
| 本文が不正なJSON | 400 |
| 正常に受信 | 204 |

今回は受信と署名検証までを対象とし、イベントの再送制御、送信元IPによる制限、イベントの永続化は含めていません。