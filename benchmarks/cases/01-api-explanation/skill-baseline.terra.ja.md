# 送信予約

Kite Mail APIでは、トランザクションメールをすぐに送信キューへ登録するほか、指定した時刻に送信する予約もできます。送信予約には `POST /v1/messages` を使用します。

ベースURLは `https://api.kitemail.example` です。

## リクエスト

すべてのリクエストで、認証用の `Authorization` ヘッダーと、重複送信を防ぐ `Idempotency-Key` ヘッダーが必要です。

```http
POST /v1/messages HTTP/1.1
Host: api.kitemail.example
Authorization: Bearer <token>
Idempotency-Key: <request-unique-key>
Content-Type: application/json
```

本文には、少なくとも宛先の `to`、使用するテンプレートの `template_id`、テンプレートへ渡す `variables` を含めます。予約する場合は `send_at` にRFC 3339形式の日時を指定します。

```json
{
  "to": [
    "user@example.com"
  ],
  "template_id": "order-confirmation",
  "variables": {
    "name": "山田 花子",
    "order_number": "A-12345"
  },
  "send_at": "2026-07-13T09:00:00+09:00"
}
```

`send_at` を省略した場合は、予約時刻を指定しない送信としてキューへ登録されます。

1回のリクエストに指定できる宛先は100件までです。また、`send_at` はリクエスト時点から7日以内にしてください。これらの条件を満たさない入力は `400 Bad Request` になる可能性があります。

## 受付結果

正常に受け付けられると、APIは `202 Accepted` を返します。

```json
{
  "message_id": "msg_01H...",
  "status": "queued"
}
```

`202 Accepted` と `status: queued` は、送信依頼がキューに登録されたことを表します。メールが配信済みであることは意味しません。

## 冪等性キーの扱い

通信失敗時などに同じ送信依頼を再送するため、各送信依頼には `Idempotency-Key` を付与します。

同じキーと同じリクエスト本文を24時間以内に再送した場合、APIは最初のリクエストと同じレスポンスを返します。タイムアウト後に結果が分からない場合も、同じキーと同じ本文で再送すれば、重複登録を避けられます。

一方、同じキーで本文を変更して送信すると `409 Conflict` になります。内容を変更して新しい送信依頼として扱う場合は、新しい `Idempotency-Key` を使用してください。

## エラーと再試行

| ステータス | 意味 | 対応 |
|---|---|---|
| `400 Bad Request` | 入力が不正 | リクエスト内容を修正してから送信する |
| `401 Unauthorized` | 認証に失敗 | トークンを確認してから送信する |
| `409 Conflict` | 冪等性キーが本文と競合 | キーまたはリクエスト内容を確認する |
| `429 Too Many Requests` | 送信頻度の上限を超過 | `Retry-After` ヘッダーの値に従って再試行する |

`400`、`401`、`409` は、そのまま自動再試行しないでください。設定や入力を直さずに再試行しても成功しないためです。

ネットワークエラーは、同じ `Idempotency-Key` と同じ本文で再試行できます。`429` を受け取った場合も再試行できますが、必ず `Retry-After` ヘッダーに従って待機してください。