# Node.js と Express で Pulse の Webhook を受け取る

Pulse の Webhook は、JSON本文だけでなく、次の2つのヘッダーを使って正当性を確認します。

- `X-Pulse-Timestamp`: Unix秒のタイムスタンプ
- `X-Pulse-Signature`: `sha256=<hex>` 形式のHMAC署名

署名対象は、次の内容です。

```text
文字列化したタイムスタンプ + "." + 受信した本文の生バイト
```

JSONを解析してから再び文字列化すると、空白やキーの順序が変わる可能性があります。そのため、本文をJSONとして解析する前に、生の`Buffer`を使って署名を検証します。

## 準備

Node.js 22を使い、Express 5をインストールします。

```bash
npm init -y
npm install express@5
```

`.env`に秘密値を設定します。

```dotenv
PULSE_WEBHOOK_SECRET=replace-with-your-secret
```

`.env`はリポジトリにコミットしないでください。Node.js 22では、`--env-file`で環境変数を読み込めます。

## 動く最小例

`app.mjs`を作成します。

```js
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { TextDecoder } from 'node:util';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error('PULSE_WEBHOOK_SECRET is not set');
}

app.post(
  '/webhooks/pulse',

  // このルートではJSON解析を行わず、本文をBufferとして受け取る
  express.raw({ type: '*/*' }),

  (req, res) => {
    const timestamp = req.get('X-Pulse-Timestamp');
    const signature = req.get('X-Pulse-Signature');

    // ヘッダーがない場合は400
    if (timestamp === undefined || signature === undefined) {
      return res.sendStatus(400);
    }

    // タイムスタンプはUnix秒、署名は sha256=<64桁の16進数>
    if (
      !/^\d+$/.test(timestamp) ||
      !/^sha256=[0-9a-f]{64}$/i.test(signature)
    ) {
      return res.sendStatus(400);
    }

    const timestampSeconds = Number(timestamp);

    if (!Number.isSafeInteger(timestampSeconds)) {
      return res.sendStatus(400);
    }

    // 現在時刻との差が5分を超えていれば401
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (Math.abs(nowSeconds - timestampSeconds) > 300) {
      return res.sendStatus(401);
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.alloc(0);

    // timestamp + "." + 生本文をバイト列のまま作る
    const signingInput = Buffer.concat([
      Buffer.from(timestamp, 'utf8'),
      Buffer.from('.'),
      rawBody,
    ]);

    const expectedSignature = createHmac('sha256', secret)
      .update(signingInput)
      .digest();

    const receivedSignature = Buffer.from(
      signature.slice('sha256='.length),
      'hex',
    );

    // timingSafeEqualは同じ長さのBufferに対して使う
    const signatureMatches =
      expectedSignature.length === receivedSignature.length &&
      timingSafeEqual(expectedSignature, receivedSignature);

    if (!signatureMatches) {
      return res.sendStatus(401);
    }

    let event;

    try {
      // 署名検証後に、初めて本文をUTF-8のJSONとして解析する
      const jsonText = new TextDecoder('utf-8', {
        fatal: true,
      }).decode(rawBody);

      event = JSON.parse(jsonText);
    } catch {
      return res.sendStatus(400);
    }

    // 秘密値や署名全文、本文全体はログに出さない
    console.log('Pulse webhook received', {
      type: event?.type ?? 'unknown',
    });

    // 必要なイベント処理をここで行う
    // 例: invoice.paid の処理

    return res.status(204).end();
  },
);

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
```

起動します。

```bash
node --env-file=.env app.mjs
```

この例では、Webhook用のルートにだけ`express.raw()`を適用しています。`express.json()`をこのルートより先に全体へ適用すると、署名検証に必要な生本文を取得できなくなるため注意してください。

たとえば、別のJSON API用に`express.json()`を使う場合は、Webhookルートを先に定義します。

```js
app.post('/webhooks/pulse', express.raw({ type: '*/*' }), webhookHandler);

app.use(express.json());

// その他のJSON API
```

## ローカルで署名付きリクエストを送る

Node.jsの`fetch`を使えば、署名計算を含めて確認できます。`send-test.mjs`を作成してください。

```js
import { createHmac } from 'node:crypto';

const secret = process.env.PULSE_WEBHOOK_SECRET;

if (!secret) {
  throw new Error('PULSE_WEBHOOK_SECRET is not set');
}

const body =
  '{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}';

const timestamp = Math.floor(Date.now() / 1000).toString();

const signingInput = Buffer.concat([
  Buffer.from(timestamp, 'utf8'),
  Buffer.from('.'),
  Buffer.from(body, 'utf8'),
]);

const signature =
  'sha256=' +
  createHmac('sha256', secret)
    .update(signingInput)
    .digest('hex');

const response = await fetch(
  'http://localhost:3000/webhooks/pulse',
  {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-pulse-timestamp': timestamp,
      'x-pulse-signature': signature,
    },
    body,
  },
);

console.log(response.status);
```

別のターミナルで実行します。

```bash
node --env-file=.env send-test.mjs
```

署名検証とJSON解析が成功すれば、ステータスコード`204`が表示されます。

## 処理の順序とステータスコード

処理は次の順序で行います。

1. 必須ヘッダーの存在と形式を確認する。
2. タイムスタンプが現在時刻から5分以内か確認する。
3. タイムスタンプ、生本文、秘密値からHMAC-SHA256を計算する。
4. 受信した署名と期待値を定数時間比較する。
5. 検証に成功した生本文をJSONとして解析する。
6. イベントを処理し、`204`を返す。

| 状況 | ステータス |
|---|---:|
| ヘッダー不足 | 400 |
| タイムスタンプまたは署名形式が不正 | 400 |
| タイムスタンプが5分を超えて古い、または未来 | 401 |
| 署名が一致しない | 401 |
| UTF-8またはJSONとして不正 | 400 |
| 正常に受信・検証・解析できた | 204 |

署名検証では、`timingSafeEqual`を使って比較時間の差から秘密情報が推測されにくいようにしています。また、秘密値、署名全文、本文全体をログに出さないことが重要です。

この最小例には、再送処理、IP制限、イベントの永続化は含めていません。