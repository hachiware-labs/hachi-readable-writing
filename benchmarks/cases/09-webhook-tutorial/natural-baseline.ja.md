以下の構成なら、生本文を保持したまま署名検証し、検証後にだけJSONとして解析できます。

Node.jsの`timingSafeEqual()`は入力長が異なると例外になるため、先に長さを確認するのがポイントです。[Node.js 22 Crypto API](https://nodejs.org/download/release/v22.16.0/docs/api/crypto.html#cryptotimingsafeequala-b)

## 1. セットアップ

```powershell
mkdir pulse-webhook-example
cd pulse-webhook-example
npm init -y
npm install express@5
```

`package.json`に起動スクリプトを追加します。

```json
{
  "type": "module",
  "scripts": {
    "start": "node server.mjs",
    "test:webhook": "node send-test.mjs"
  },
  "dependencies": {
    "express": "^5.0.0"
  }
}
```

## 2. Webhook受信サーバー

`server.mjs`:

```js
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

const app = express();
const port = process.env.PORT ?? 3000;
const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  console.error('PULSE_WEBHOOK_SECRET is required');
  process.exit(1);
}

app.post(
  '/webhooks/pulse',

  // express.json()ではなくBufferとして本文を受け取る。
  // 圧縮された本文は、署名対象のバイトが変わるのを避けるため拒否する。
  express.raw({
    type: 'application/json',
    limit: '1mb',
    inflate: false,
  }),

  (req, res) => {
    const timestamp = req.get('X-Pulse-Timestamp');
    const signatureHeader = req.get('X-Pulse-Signature');

    // 1. 必須ヘッダーと形式を検証
    if (
      !timestamp ||
      !signatureHeader ||
      !/^\d+$/.test(timestamp) ||
      !/^sha256=[0-9a-fA-F]{64}$/.test(signatureHeader)
    ) {
      return res.sendStatus(400);
    }

    // express.raw()が適用されていないリクエストも不正扱い
    if (!Buffer.isBuffer(req.body)) {
      return res.sendStatus(400);
    }

    // 2. タイムスタンプの鮮度を検証
    const timestampSeconds = Number(timestamp);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (
      !Number.isSafeInteger(timestampSeconds) ||
      Math.abs(nowSeconds - timestampSeconds) > 300
    ) {
      return res.sendStatus(401);
    }

    // 3. HMAC-SHA256を計算
    //
    // 署名対象:
    //   timestampのUTF-8バイト + "." + 受信本文の生バイト
    //
    // req.bodyを文字列化しないことが重要。
    const expectedSignature = createHmac('sha256', secret)
      .update(timestamp, 'utf8')
      .update('.', 'utf8')
      .update(req.body)
      .digest();

    const receivedSignature = Buffer.from(
      signatureHeader.slice('sha256='.length),
      'hex',
    );

    // timingSafeEqualは同じ長さの入力を要求する
    const signatureIsValid =
      receivedSignature.length === expectedSignature.length &&
      timingSafeEqual(receivedSignature, expectedSignature);

    if (!signatureIsValid) {
      return res.sendStatus(401);
    }

    // 4. 署名検証に成功してからJSONとして解析
    let event;

    try {
      // fatal:trueにより、不正なUTF-8も400にする
      const json = new TextDecoder('utf-8', { fatal: true }).decode(req.body);
      event = JSON.parse(json);
    } catch {
      return res.sendStatus(400);
    }

    // 5. イベント処理
    // 秘密値や署名全文はログに出さない
    console.log('Pulse webhook accepted', {
      type: event?.type,
    });

    return res.sendStatus(204);
  },
);

// 通常のJSON APIがある場合は、Webhookルートより後に置く
app.use(express.json());

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
```

`express.raw()`は本文を`Buffer`として提供します。Webhookルートを`express.json()`より前に定義する必要があります。先にJSONパーサーを通すとリクエストストリームが消費され、署名対象の生本文を取得できなくなります。[Express 5 API](https://expressjs.com/en/5x/api/)

また、HMACには文字列へ変換した本文ではなく、`req.body`の`Buffer`を直接渡しています。空白、改行、プロパティ順などが変わっただけでも署名は変わるためです。Node.jsの`createHmac()`と`update()`は`Buffer`を直接処理できます。[Node.js 22 Crypto API](https://nodejs.org/download/release/v22.16.0/docs/api/crypto.html#createhmacalgorithm-key-options)

## 3. 動作確認用送信スクリプト

`send-test.mjs`:

```js
import { createHmac } from 'node:crypto';

const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  console.error('PULSE_WEBHOOK_SECRET is required');
  process.exit(1);
}

const body = Buffer.from(
  JSON.stringify({
    type: 'invoice.paid',
    data: {
      invoice_id: 'inv_123',
    },
  }),
  'utf8',
);

const timestamp = Math.floor(Date.now() / 1000).toString();

const signature = createHmac('sha256', secret)
  .update(timestamp, 'utf8')
  .update('.', 'utf8')
  .update(body)
  .digest('hex');

const response = await fetch('http://localhost:3000/webhooks/pulse', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Pulse-Timestamp': timestamp,
    'X-Pulse-Signature': `sha256=${signature}`,
  },
  body,
});

console.log(`Status: ${response.status}`);
```

PowerShellで、1つ目のターミナルからサーバーを起動します。

```powershell
$env:PULSE_WEBHOOK_SECRET = 'development-secret'
npm start
```

別のターミナルから送信します。

```powershell
$env:PULSE_WEBHOOK_SECRET = 'development-secret'
npm run test:webhook
```

成功時は次のようになります。

```text
Status: 204
```

サーバー側:

```text
Pulse webhook accepted { type: 'invoice.paid' }
```

この例の判定結果は次のとおりです。

| 状況 | ステータス |
|---|---:|
| ヘッダー不足・形式不正 | 400 |
| タイムスタンプが現在から5分超 | 401 |
| 署名不一致 | 401 |
| JSONまたはUTF-8が不正 | 400 |
| 正常 | 204 |