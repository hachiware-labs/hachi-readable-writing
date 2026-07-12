# Kite Mail APIでメールの送信を予約する

Kite Mail APIでは、`POST /v1/messages` に送信日時を指定することで、トランザクションメールの送信を予約できます。

## リクエスト

送信先、テンプレート、テンプレート変数に加えて、`send_at` に送信予定日時を指定します。

```http
POST https://api.kitemail.example/v1/messages
Authorization: Bearer <token>
Idempotency-Key: <一意なキー>
Content-Type: application/json
```

```json
{
  "to": ["user@example.com"],
  "template_id": "welcome-email",
  "variables": {
    "name": "山田 太郎"
  },
  "send_at": "<現在から7日以内のRFC 3339形式の日時>"
}
```

`send_at` はRFC 3339形式で指定します。タイムゾーンを明示してください。

```text
2026-07-15T10:00:00+09:00
```

主な制約は次のとおりです。

- 1回のリクエストで指定できる宛先は100件までです。
- `send_at` に指定できるのは、現在から7日以内の日時です。
- `send_at` は任意ですが、送信を予約する場合は指定します。
- `Authorization` と `Idempotency-Key` は必須です。

完全なリクエスト例は次のようになります。`send_at` は実行時点から7日以内の日時に置き換えてください。

```bash
curl -X POST "https://api.kitemail.example/v1/messages" \
  -H "Authorization: Bearer ${KITEMAIL_TOKEN}" \
  -H "Idempotency-Key: order-12345-confirmation" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["user@example.com"],
    "template_id": "order-confirmation",
    "variables": {
      "customer_name": "山田 太郎",
      "order_number": "12345"
    },
    "send_at": "2026-07-15T10:00:00+09:00"
  }'
```

## レスポンス

リクエストが受け付けられると、APIは`202 Accepted`を返します。

```json
{
  "message_id": "msg_abc123",
  "status": "queued"
}
```

`202 Accepted`は、メールが送信キューに登録されたことを示します。受信者への配信完了を意味するものではありません。

## 冪等性キーの扱い

`Idempotency-Key`は、タイムアウトやネットワーク切断によって同じメールが重複登録されることを防ぐために使用します。

同じキーと同じリクエスト本文を24時間以内に再送すると、最初のリクエストと同じレスポンスが返ります。再試行するときは、キーだけでなく本文も変更しないでください。

同じキーを異なる本文に使用すると、`409 Conflict`になります。別の送信予約を作成する場合は、新しいキーを発行します。

キーには、注文IDやイベントIDなど、アプリケーション側で送信処理を一意に識別できる値を使うと管理しやすくなります。

```text
order-12345-confirmation
```

## エラーと再試行

| ステータス | 意味 | 対応 |
|---|---|---|
| `400 Bad Request` | リクエストの入力が不正 | 内容を修正する。そのまま自動再試行しない |
| `401 Unauthorized` | 認証に失敗 | トークンを確認する。そのまま自動再試行しない |
| `409 Conflict` | 同じ冪等性キーが異なる本文で使用された | キーと本文の対応を確認する。そのまま自動再試行しない |
| `429 Too Many Requests` | 送信頻度の上限を超えた | `Retry-After`ヘッダーで指定された時間を待って再試行する |

ネットワークエラーは再試行できます。その際は、最初のリクエストと同じ`Idempotency-Key`と同じ本文を使用してください。これにより、最初のリクエストがサーバーに到達していた場合でも重複登録を防げます。

`429`を再試行する場合も、`Retry-After`に従い、同じキーと本文を使用します。

## 実装時のチェックリスト

- `Authorization: Bearer <token>`を付けている
- 送信処理ごとに一意な`Idempotency-Key`を発行している
- `send_at`がRFC 3339形式で、現在から7日以内になっている
- 宛先が100件を超えていない
- `202`を配信完了として扱っていない
- ネットワークエラー時は、同じキーと本文で再試行している
- `429`では`Retry-After`に従っている
- `400`、`401`、`409`を無条件に自動再試行していない