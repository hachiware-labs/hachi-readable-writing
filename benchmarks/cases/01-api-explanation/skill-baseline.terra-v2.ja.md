# Kite Mail APIで送信予約する

Kite Mail APIでは、トランザクションメールを `POST /v1/messages` に送ると、指定時刻に送信予約できます。`send_at` を省略した場合もリクエストは受け付けられますが、予約時刻を指定する場合は現在から7日以内のRFC 3339形式にしてください。

```http
POST https://api.kitemail.example/v1/messages
Authorization: Bearer <token>
Idempotency-Key: <一意のキー>
Content-Type: application/json
```

リクエスト本文には、宛先、テンプレート、テンプレート変数を含めます。宛先は1回のリクエストにつき100件までです。

```json
{
  "to": ["user@example.com"],
  "template_id": "payment-reminder",
  "variables": {
    "customer_name": "山田太郎",
    "due_date": "2026-07-15"
  },
  "send_at": "2026-07-13T09:00:00+09:00"
}
```

`send_at` は任意です。たとえば、すぐに送信処理へ登録したい場合は省略できます。

```json
{
  "to": ["user@example.com"],
  "template_id": "payment-reminder",
  "variables": {
    "customer_name": "山田太郎"
  }
}
```

## 受け付け結果

正常に受け付けられると、APIは `202 Accepted` を返します。

```json
{
  "message_id": "msg_...",
  "status": "queued"
}
```

これはメールが配信済みであることを意味しません。送信要求がキューに登録されたことを示します。`message_id` は、この送信要求を識別する値として保存してください。

## 冪等性キーの扱い

`Idempotency-Key` は必須です。同じ送信要求を通信失敗などで再送する場合は、最初のリクエストと同じキーを使います。

同じキーと同じ本文を24時間以内に再送すると、最初のレスポンスが返されます。一方、同じキーで本文を変更すると `409 Conflict` になります。再送時に宛先や予約時刻を変えたい場合は、新しい `Idempotency-Key` を使用してください。

## エラーと再試行

| ステータス | 意味 | 対応 |
| --- | --- | --- |
| `400` | 入力不正 | 本文や `send_at`、宛先数を修正する。自動再試行しない。 |
| `401` | 認証失敗 | トークンを確認する。自動再試行しない。 |
| `409` | 冪等性キーの競合 | 同じキーで異なる本文を送っていないか確認する。自動再試行しない。 |
| `429` | 送信頻度の上限超過 | `Retry-After` ヘッダーで指定された時間を待って再試行する。 |

ネットワークエラーは再試行して構いません。その際も、送信要求が同一であれば同じ `Idempotency-Key` を使ってください。