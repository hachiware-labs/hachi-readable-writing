# Relay Runner v1 から v2 への設定移行ガイド

この手順では、v1 の設定を v2 形式へ変換し、検証環境で確認した後に本番へ段階的に切り替えます。v2 は不明な設定キーがあると起動に失敗するため、変換後の設定を必ず検証してから使用してください。

## 変更点

| v1 | v2 | 移行時の扱い |
|---|---|---|
| `workers` | `concurrency` | 名前のみ変更。意味と値は同じです。 |
| `retry.count` | `retry.max_attempts` | 初回を含む総試行回数に変わります。v1 の値に 1 を加えます。 |
| `retry.delay_seconds` | `retry.initial_delay` | 時間文字列に変更します。たとえば `10` は `10s` にします。 |
| なし | `queue` | v2 では必須です。今回の移行では `default` を指定します。 |

## 設定を変換する

たとえば、v1 の設定が次の内容の場合です。

```yaml
workers: 8

retry:
  count: 3
  delay_seconds: 10
```

v2 用には次のように変換します。

```yaml
concurrency: 8
queue: default

retry:
  max_attempts: 4
  initial_delay: 10s
```

`retry.count: 3` は「初回の実行後に最大 3 回再試行する」設定です。v2 の `retry.max_attempts` は初回を含むため、同じ動作にするには `4` を指定します。

変換時には、旧キーである `workers`、`retry.count`、`retry.delay_seconds` を残さないでください。v2 では不明なキーが起動失敗につながります。

## 検証する

変換した設定を v2 の実行環境で検証します。

```sh
relay validate --config relay.yml
```

成功すると、次のように表示されます。

```text
configuration valid
```

この表示が出ない場合は、本番への切り替えを進めず、設定内に v1 のキーや不明なキーが残っていないか確認してください。

## 段階的に切り替える

1. v1 の設定を v2 形式へ変換し、`relay validate --config relay.yml` で検証します。
2. 検証環境で v2 を 1 日間稼働させます。
3. 問題がなければ、本番処理の 10% を v2 へ切り替えます。
4. エラー率と処理時間を 2 時間確認します。
5. 問題がなければ、対象を全体へ広げます。

## ロールバック

エラー率または処理時間に問題が出た場合は、v1 の設定ファイルと v1 の実行物へ同時に戻します。

v2 用の設定ファイルをそのまま v1 に渡してはいけません。`concurrency`、`queue`、`retry.max_attempts`、`retry.initial_delay` は v1 用設定として使用しないでください。