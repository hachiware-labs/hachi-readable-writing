# Kite Mail APIで送信予約を行う

Kite Mail APIでトランザクションメールの送信を予約するには、`POST /v1/messages` を使用します。

## エンドポイント

```text
POST https://api.kitemail.example/v1/messages
```

次のヘッダーは必須です。

| ヘッダー | 内容 |
|---|---|
| `Authorization` | `Bearer <token>` 形式のアクセストークン |
| `Idempotency-Key` | リクエストを一意に識別するキー |

## リクエスト例

```bash
curl -X POST "https://api.kitemail.example/v1/messages" \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: order-1234-welcome-email" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [
      "user@example.com"
    ],
    "template_id": "welcome-email",
    "variables": {
      "user_name": "山田太郎"
    },
    "send_at": "2026-07-15T10:00:00+09:00"
  }'
```

### リクエスト本文

| フィールド | 必須 | 説明 |
|---|---:|---|
| `to` | はい | 宛先。1回のリクエストにつき100件まで |
| `template_id` | はい | 使用するメールテンプレートのID |
| `variables` | はい | テンプレートに渡す変数 |
| `send_at` | いいえ | 送信予定時刻。RFC 3339形式で指定 |

`send_at` を指定する場合、現在時刻から7日以内の日時にしてください。

例：

```text
2026-07-15T10:00:00+09:00
```

## 成功レスポンス

正常に受け付けられると、APIは `202 Accepted` を返します。

```json
{
  "message_id": "msg_abc123",
  "status": "queued"
}
```

`202 Accepted` は送信予約を受け付けたことを示します。メールの配信完了を意味するものではありません。

## `Idempotency-Key` の扱い

同じ処理をネットワークエラー後に再送する可能性があるため、各論理的な送信処理に対して `Idempotency-Key` を設定します。

同じキーについて、次のルールが適用されます。

- 24時間以内に、同じキーと同じ本文を再送した場合  
  → 最初のリクエストと同じレスポンスが返ります。
- 同じキーで本文が異なる場合  
  → `409 Conflict` が返ります。

そのため、同じメール送信処理を再試行するときは、最初と同じ本文と同じ `Idempotency-Key` を使用してください。別の送信処理には、別のキーを使用します。

## エラーと再試行

| ステータス | 意味 | 自動再試行 |
|---:|---|---|
| `400` | 入力不正 | しない |
| `401` | 認証失敗 | しない |
| `409` | 冪等性キーの競合 | しない |
| `429` | 送信頻度の上限超過 | してよい |
| ネットワークエラー | APIから応答を受け取れなかった | してよい |

`429` が返った場合は、レスポンスの `Retry-After` ヘッダーで指定された時間を待ってから再試行してください。

ネットワークエラーの場合も、同じリクエスト本文と同じ `Idempotency-Key` を使って再送します。

`400`、`401`、`409` は、原因を解消せずにそのまま再試行しないでください。

## 実装時の確認事項

- ベースURLが `https://api.kitemail.example` になっている
- `Authorization: Bearer <token>` を付けている
- `Idempotency-Key` を付けている
- 宛先が100件以内になっている
- `send_at` がRFC 3339形式になっている
- `send_at` が現在から7日以内になっている
- `202` を配信完了と解釈していない
- ネットワークエラーや`429`の再試行時に、同じ冪等性キーを使っている
- `400`、`401`、`409` を無条件に再試行していない

この文書で扱っていない機能やURLについては、利用可能な仕様が確認できるまで実装上の前提にしないでください。