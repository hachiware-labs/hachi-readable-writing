Node.jsとExpressでPulseのWebhookを受け取る方法を解説してください。
HTTP APIは作ったことがありますが署名検証は初めてなので、動く最小例も入れてください。

背景として分かっていること:

- Node.js 22、Express 5を使う。
- 受信先は `POST /webhooks/pulse`。
- 秘密値は環境変数 `PULSE_WEBHOOK_SECRET` から読む。
- `X-Pulse-Timestamp` はUnix秒、`X-Pulse-Signature` は `sha256=<hex>` の形式。
- 署名対象は、文字列化したタイムスタンプ、ピリオド、受信した本文の生バイトを連結したもの。概念上は `${timestamp}.${rawBody}`。
- HMAC-SHA256を使い、期待値と受信値は定数時間比較する。
- JSONとして解析する前の生本文で署名を検証する。
- ヘッダー不足または署名形式不正は400、現在時刻との差が5分を超えるタイムスタンプは401、署名不一致は401、不正なJSONは400、正常処理は204。
- イベント本文の例は `{"type":"invoice.paid","data":{"invoice_id":"inv_123"}}`。
- ログに秘密値や署名全文を出さない。
- 再送、IP制限、永続化は今回の仕様に含まれない

