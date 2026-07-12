# Natural-input benchmark design

The original prompts were controlled specification tests. They intentionally stated the audience, desired contents, approximate length, and important cautions. They were removed after review because they supplied much of the document design that the writing skill is meant to improve.

The natural-input series represents a more ordinary request. Each prompt has only two parts:

1. a short request that could reasonably be typed into an AI input box;
2. background notes containing facts known to the requester.

The prompt must not prescribe an outline, headings, tables, bullet points, paragraph count, rhetorical flow, or writing technique. It must also avoid embedding evaluation criteria such as “make it easy to understand,” unless that phrase would naturally be part of the request.

## Prompt shape

```text
<Two or three lines describing what the user wants and, when natural, who will use it.>

背景として分かっていること:

- <fact>
- <fact>
- <fact>
```

The English prompt follows the same information boundary rather than translating Japanese writing instructions that would not occur naturally in English.

## What belongs in the request

- the document the user wants;
- the immediate situation or purpose;
- the intended recipient only when the requester would ordinarily mention it;
- a practical length or delivery constraint only when one really exists.

## What belongs in the background notes

- names, dates, quantities, URLs, commands, and observed events;
- product or organizational rules;
- decisions already made;
- uncertainties and conflicts the finished document must deal with;
- consequences that are known to the requester.

Background notes may be incomplete, unevenly detailed, or ordered as the requester remembered them. They should not secretly serve as an outline.

## What must not be supplied

- a section-by-section structure;
- instructions to use a table, checklist, ordered steps, or prose;
- a list of conclusions the document should explicitly emphasize;
- directions about transitions, storytelling, terminology, or tone beyond a natural recipient relationship;
- warnings already rewritten as polished sentences for the model to copy;
- evaluation language such as “show the trade-offs” or “explain the request lifecycle.”

## Example: API guide

```text
Kite Mail APIを初めて組み込む開発者向けに、送信予約の使い方を説明する文書を作ってください。
社内の開発者ポータルに載せます。

背景として分かっていること:

- ベースURLは `https://api.kitemail.example`
- 送信予約は `POST /v1/messages`
- 認証はBearerトークン
- `Idempotency-Key`も必要。同じキーと本文なら24時間は最初の応答を返す。本文が違うと409
- 本文で使うのは `to`、`template_id`、`variables`。予約時刻があるときは `send_at`
- 宛先は一度に100件まで。予約は7日先まで
- 受け付けると202、`message_id`、`queued`を返す。これは配信完了ではない
- 400は入力、401は認証、409はキーの競合、429は頻度超過
- ネットワークエラーと429は再試行する。429では `Retry-After` に従う
- 400、401、409は同じ内容のまま再試行しない
- 架空のAPIなので、ここにない機能やURLは不明
```

This input still makes factual comparison possible, but it no longer tells the model how to turn the facts into a document.

## Evaluation layers

The result should not receive a single undifferentiated readability score. Reviewers should record at least these four judgments separately:

1. **Use of supplied facts** — whether the document preserves facts, distinguishes unknowns, and avoids inventions.
2. **Document construction** — whether the writer selects a useful order and creates understandable relationships between paragraphs.
3. **Language naturalness** — whether diction, sentence rhythm, reference, register, and Japanese/English terminology suit the reader.
4. **Format restraint** — whether headings, bullets, tables, fragments, repeated summaries, and formulaic labels help the reader rather than substitute for prose.

The natural-input set asks whether the model can design and write a document from ordinary user material. It is now the active benchmark series.
