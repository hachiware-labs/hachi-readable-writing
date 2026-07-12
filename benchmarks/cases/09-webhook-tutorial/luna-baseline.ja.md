以下は、Node.js 22 と Express 5 で動く最小例です。

重要なのは、`express.json()` で解析する前の本文を `Buffer` としてHMAC検証することです。JSONを一度オブジェクト化してから再文字列化すると、空白や改行、エンコーディングが変わり署名が一致しない可能性があります。

### `server.js`

```js
const express = require('express');
const crypto = require('node:crypto');
const { TextDecoder } = require('node:util');

const app = express();
const port = Number(process.env.PORT || 3000);
const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  console.error('PULSE_WEBHOOK_SECRET is not set');
  process.exit(1);
}

app.post(
  '/webhooks/pulse',

  // JSON解析せず、生本文をBufferとして受け取る
  express.raw({
    type: '*/*',
    limit: '1mb',
  }),

  (req, res) => {
    const timestampHeader = req.get('X-Pulse-Timestamp');
    const signatureHeader = req.get('X-Pulse-Signature');

    // ヘッダー不足
    if (!timestampHeader || !signatureHeader) {
      return res.status(400).end();
    }

    // Unix秒の形式を確認
    if (
      !/^\d+$/.test(timestampHeader) ||
      !Number.isSafeInteger(Number(timestampHeader))
    ) {
      return res.status(400).end();
    }

    // sha256=<64桁の16進数> の形式を確認
    if (!/^sha256=[0-9a-fA-F]{64}$/.test(signatureHeader)) {
      return res.status(400).end();
    }

    const timestamp = Number(timestampHeader);
    const now = Math.floor(Date.now() / 1000);

    // 5分を超えて時刻がずれていれば拒否
    if (Math.abs(now - timestamp) > 300) {
      return res.status(401).end();
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.alloc(0);

    // timestamp文字列 + "." + 生本文
    const signedPayload = Buffer.concat([
      Buffer.from(`${timestampHeader}.`, 'ascii'),
      rawBody,
    ]);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest();

    const receivedSignature = Buffer.from(
      signatureHeader.slice('sha256='.length),
      'hex'
    );

    // 長さ確認後、定数時間比較
    const signatureMatches =
      expectedSignature.length === receivedSignature.length &&
      crypto.timingSafeEqual(expectedSignature, receivedSignature);

    if (!signatureMatches) {
      return res.status(401).end();
    }

    // 署名検証後に初めてJSONとして解析する
    let event;

    try {
      const jsonText = new TextDecoder('utf-8', {
        fatal: true,
      }).decode(rawBody);

      event = JSON.parse(jsonText);
    } catch {
      return res.status(400).end();
    }

    // 実際の処理をここに記述する
    // 例: event.type === 'invoice.paid' の処理
    void event;

    return res.status(204).end();
  }
);

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
```

### 起動

```powershell
npm init -y
npm install express@5

$env:PULSE_WEBHOOK_SECRET = 'dev-secret'
node server.js
```

Webhookの本文は、例えば次の形式です。

```json
{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

### 動作確認用 `send-test.js`

Node.js 22の組み込み`fetch`を使って、正しい署名付きリクエストを送れます。

```js
const crypto = require('node:crypto');

const secret = process.env.PULSE_WEBHOOK_SECRET;

const body = Buffer.from(
  JSON.stringify({
    type: 'invoice.paid',
    data: {
      invoice_id: 'inv_123',
    },
  }),
  'utf8'
);

const timestamp = Math.floor(Date.now() / 1000).toString();

const signature = crypto
  .createHmac('sha256', secret)
  .update(Buffer.concat([
    Buffer.from(`${timestamp}.`, 'ascii'),
    body,
  ]))
  .digest('hex');

const response = await fetch('http://localhost:3000/webhooks/pulse', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'X-Pulse-Timestamp': timestamp,
    'X-Pulse-Signature': `sha256=${signature}`,
  },
  body,
});

console.log(response.status); // 204
```

別のPowerShellで実行します。

```powershell
$env:PULSE_WEBHOOK_SECRET = 'dev-secret'
node send-test.js
```

処理の順序は次の通りです。

1. ヘッダーの存在と形式を確認する
2. タイムスタンプの差を確認する
3. 生本文でHMAC-SHA256を計算する
4. `timingSafeEqual`で署名を比較する
5. 検証成功後にJSON解析する
6. 正常なら`204 No Content`を返す

既存アプリで`app.use(express.json())`を使っている場合は、Webhookのルートをその前に置いてください。JSONパーサーが先に本文を消費すると、生本文を使った署名検証ができません。

この例では、再送管理、IP制限、イベントの永続化は実装していません。