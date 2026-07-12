# Relay Runner v1 → v2 設定移行ガイド

本ガイドは、Relay Runnerをv1からv2へ段階的に切り替える運用担当者向けです。

## 1. 設定変更の対応表

| v1 | v2 | 変換方法 |
|---|---|---|
| `workers` | `concurrency` | 値をそのまま引き継ぐ |
| `retry.count` | `retry.max_attempts` | v1の値に1を加える |
| `retry.delay_seconds` | `retry.initial_delay` | 秒数を時間文字列にする |
| なし | `queue` | `default`を指定する |

`retry.count`と`retry.max_attempts`は数え方が異なります。

- v1の`count`: 初回を除く再試行回数
- v2の`max_attempts`: 初回を含む総試行回数

たとえばv1で`count: 3`の場合、最大実行回数は初回と再試行3回の計4回です。そのため、v2では`max_attempts: 4`にします。

## 2. YAMLの変更例

変更前（v1）:

```yaml
workers: 5

retry:
  count: 3
  delay_seconds: 10
```

変更後（v2）:

```yaml
concurrency: 5
queue: default

retry:
  max_attempts: 4
  initial_delay: 10s
```

この例では、同時実行数と再試行の動作は変更前と同じです。

## 3. 変換時の注意事項

v2は不明な設定キーを検出すると起動に失敗します。v1で警告だけになっていたキーも、v2では移行の妨げになる可能性があります。

設定を変換するときは、少なくとも次を確認してください。

- `workers`を残さず、`concurrency`へ置き換える
- `retry.count`を残さず、`retry.max_attempts`へ置き換える
- `retry.delay_seconds`を残さず、`retry.initial_delay`へ置き換える
- `retry.max_attempts`を「v1の`count` + 1」にする
- `initial_delay`を`10s`のような時間文字列にする
- 必須項目として`queue: default`を追加する
- 用途が分からない既存キーを推測で変換しない

本ガイドに記載していない設定キーについては、v2で有効か判断できません。検証で不明なキーとして報告された場合は、正式な仕様を確認してから対応してください。

## 4. 設定を検証する

変換したv2設定を、起動前に次のコマンドで確認します。

```shell
relay validate --config relay.yml
```

成功時は、次のメッセージが表示されます。

```text
configuration valid
```

この表示を確認できない場合は、v2の起動や切り替えを進めないでください。特に、旧キーの残存、`queue`の不足、時間値の形式を確認します。

## 5. 段階移行の手順

1. v1設定をコピーし、v2用の設定ファイルを作成します。
2. 対応表に従って設定を変換します。
3. `relay validate --config relay.yml`を実行します。
4. `configuration valid`が表示されたことを確認します。
5. v2を検証環境で1日稼働させます。
6. 検証環境で問題がなければ、本番処理の10%をv2へ切り替えます。
7. 2時間、エラー率と処理時間を確認します。
8. 問題がなければ、残りをv2へ切り替えて全体に広げます。

各段階で、次へ進む時刻、担当者、設定ファイルの版を記録しておくと、問題発生時の切り分けとロールバックが容易になります。

## 6. ロールバック

ロールバックでは、次の2点を同時にv1へ戻します。

- v1の設定ファイル
- v1の実行物

v2の設定ファイルをv1の実行物へ渡してはいけません。`concurrency`、`max_attempts`、`initial_delay`、`queue`などは、v1設定としてそのまま利用できるとは限らないためです。

切り替え前に、動作確認済みのv1設定ファイルとv1実行物を一組として保管してください。ロールバック後は、切り替え前と同じ監視指標でエラー率と処理時間が通常の水準へ戻ったことを確認します。