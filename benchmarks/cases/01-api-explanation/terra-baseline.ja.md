# Kite Mail API：トランザクションメールの送信予約

Kite Mail API では、`POST https://api.kitemail.example/v1/messages` にリクエストを送ることで、トランザクションメールをキューに登録できます。`send_at` を指定しなければ通常送信として、指定すれば予約送信として扱います。

`202 Accepted` はリクエストを受け付けてキューへ登録したことを示すだけで、メールの配信完了を意味しません。

## リクエストを作成する

認証と重複送信の防止のため、次のヘッダーは必須です。

```http
Authorization: Bearer <token>
Idempotency-Key: <unique-key>
Content-Type: application/json
```

本文には `to`、`template_id`、`variables` を含めます。予約する場合は、RFC 3339 形式の `send_at` も指定してください。

```json
{
  "to": ["customer@example.com"],
  "template_id": "order-shipped",
  "variables": {
    "customer_name": "山田 太郎",
    "order_number": "ORD-12345"
  },
  "send_at": "2026-07-13T09:00:00+09:00"
}
```

この例では宛先を1件だけ指定しています。1回のリクエストで指定できる宛先は最大100件です。また、`send_at` はリクエスト時点から7日以内にしてください。

`to` の詳細な値形式や、テンプレート・変数の定義方法は、この文書で分かっている範囲には含まれません。利用中のテンプレート仕様に合わせて値を作成してください。

## 予約送信の例

```bash
curl -X POST "https://api.kitemail.example/v1/messages" \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: 5d6c2a10-7c88-4d6d-9d65-123456789abc" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["customer@example.com"],
    "template_id": "order-shipped",
    "variables": {
      "customer_name": "山田 太郎",
      "order_number": "ORD-12345"
    },
    "send_at": "2026-07-13T09:00:00+09:00"
  }'
```

正常に受け付けられると、API は `202 Accepted` と次のような本文を返します。

```json
{
  "message_id": "msg_01...",
  "status": "queued"
}
```

アプリケーションでは、`message_id` を自分の送信記録と関連付けて保存してください。ただし、この情報だけでは配信済みかどうかは判断できません。この文書の範囲では、配信状況を確認する機能やURLは不明です。

## 冪等性キーと再試行

`Idempotency-Key` は、タイムアウトやネットワークエラー時に二重送信を防ぐためのキーです。1回の送信操作ごとに新しいキーを作り、再試行時には最初のリクエストと同じキー・同じ本文を使います。

同じキーと同じ本文を24時間以内に再送すると、API は最初のレスポンスを返します。一方、同じキーで本文を変更すると `409 Conflict` になります。予約時刻や変数を変更して送信し直す場合は、新しい `Idempotency-Key` を使ってください。

ネットワークエラーでは、サーバーがリクエストを受け付けたか判定できないことがあります。この場合も、キーと本文を変えずに再試行することで、重複登録を防げます。

## エラー時の扱い

| ステータス | 意味 | 自動再試行 |
| --- | --- | --- |
| `400 Bad Request` | 入力不正 | しない。本文や予約時刻を修正する |
| `401 Unauthorized` | 認証失敗 | しない。トークンを確認する |
| `409 Conflict` | 冪等性キーの競合 | しない。本文とキーの組み合わせを確認する |
| `429 Too Many Requests` | 送信頻度の上限超過 | `Retry-After` ヘッダーに従って再試行する |
| ネットワークエラー | 到達・応答を確認できない | 同じキー・同じ本文で再試行してよい |

予約送信では、送信を実行する時点だけでなく、再試行時にも `send_at` が現在から7日以内であることを確認してください。