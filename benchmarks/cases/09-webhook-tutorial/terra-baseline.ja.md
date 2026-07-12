Webhook では、JSONに変換する前の本文の生バイトで署名を検証します。JSONを先に解析・再シリアライズすると、元のバイト列と変わる可能性があり、正しい署名でも検証に失敗します。

以下は Node.js 22 / Express 5 の最小例です。

```js
// server.js
import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';

const app = express();
const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error('PULSE_WEBHOOK_SECRET が設定されていません');
}

app.post(
  '/webhooks/pulse',

  // このルートだけ本文を Buffer（生バイト）として受け取る。
  // express.json() をこのルートより前に適用しないこと。
  express.raw({ type: '*/*' }),

  (req, res) => {
    const timestamp = req.get('X-Pulse-Timestamp');
    const signatureHeader = req.get('X-Pulse-Signature');

    // ヘッダーの存在と形式を確認する
    if (!timestamp || !signatureHeader) {
      return res.status(400).json({ error: 'Missing signature headers' });
    }

    if (!/^\d+$/.test(timestamp)) {
      return res.status(400).json({ error: 'Invalid timestamp format' });
    }

    const signatureMatch = /^sha256=([0-9a-f]{64})$/i.exec(signatureHeader);
    if (!signatureMatch) {
      return res.status(400).json({ error: 'Invalid signature format' });
    }

    // タイムスタンプはUnix秒。現在時刻との差が5分を超えたら拒否する。
    const timestampSeconds = Number(timestamp);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (
      !Number.isSafeInteger(timestampSeconds) ||
      Math.abs(nowSeconds - timestampSeconds) > 5 * 60
    ) {
      return res.status(401).json({ error: 'Timestamp outside allowed window' });
    }

    // `${timestamp}.${rawBody}` を、本文を変更せずにバイト列として組み立てる
    const signedPayload = Buffer.concat([
      Buffer.from(`${timestamp}.`, 'utf8'),
      req.body,
    ]);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest();

    const receivedSignature = Buffer.from(signatureMatch[1], 'hex');

    // 長さが違う場合は timingSafeEqual が例外を投げるため、先に確認する
    if (
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 署名検証に成功してからJSONとして解析する
    let event;
    try {
      event = JSON.parse(req.body.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // 例: event.type === 'invoice.paid'
    // event.data.invoice_id === 'inv_123'
    console.log('Received Pulse event:', event.type);

    return res.sendStatus(204);
  },
);

app.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
```

`.env` には秘密値を置きます。

```dotenv
PULSE_WEBHOOK_SECRET=your_webhook_secret
```

依存関係の例です。

```bash
npm install express dotenv
```

受信するイベント本文の例:

```json
{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}
```

処理の順序は次のとおりです。

1. `X-Pulse-Timestamp` と `X-Pulse-Signature` の存在・形式を確認する。  
2. タイムスタンプが現在時刻の前後5分以内か確認する。  
3. `timestamp + "." + 生本文` をHMAC-SHA256で署名する。  
4. 期待した署名と受信署名を `timingSafeEqual` で定数時間比較する。  
5. 一致した場合だけJSONを解析し、イベントを処理する。  

`express.json()` をアプリ全体に使う場合も、このWebhookルートには適用しないでください。例えば `app.use(express.json())` をこのルートより前に置くと、生本文が失われて署名検証ができなくなります。また、ログには秘密値や `X-Pulse-Signature` の全文を出さないようにします。