# Relay Runner v1 → v2 設定移行ガイド

## 1. 目的

Relay Runner v1 の設定を v2 形式へ変換し、検証環境・本番の一部・本番全体の順に段階移行します。

本ガイドに記載していない設定キーやコマンドは対象外です。v2では不明な設定キーがあると起動に失敗するため、実際の設定項目については別途v2の仕様を確認してください。

## 2. 設定変更一覧

| v1 | v2 | 変更内容 |
|---|---|---|
| `workers` | `concurrency` | キー名を変更。意味は同じ |
| `retry.count` | `retry.max_attempts` | 初回を含む総試行回数へ変換 |
| `retry.delay_seconds` | `retry.initial_delay` | 秒数から時間文字列へ変換 |
| なし | `queue` | v2では必須。今回の移行では `default` を指定 |

### retry.count の変換

v1の `retry.count` は「初回を除く再試行回数」です。  
v2の `retry.max_attempts` は「初回を含む総試行回数」です。

```text
v2.retry.max_attempts = v1.retry.count + 1
```

たとえば、v1が `count: 3` の場合、v2は `max_attempts: 4` です。

## 3. YAMLの変更例

### 変更前：v1

```yaml
workers: 4

retry:
  count: 3
  delay_seconds: 10
```

### 変更後：v2

```yaml
concurrency: 4

retry:
  max_attempts: 4
  initial_delay: 10s

queue: default
```

この例では、以下の変換を行っています。

- `workers: 4` → `concurrency: 4`
- `retry.count: 3` → `retry.max_attempts: 4`
- `retry.delay_seconds: 10` → `retry.initial_delay: 10s`
- `queue: default` を追加

## 4. 移行手順

### 4.1 移行前の準備

1. 現在使用しているv1設定ファイルをバックアップする。
2. v1の実行物も、ロールバック可能な状態で保持する。
3. v1設定の `workers`、`retry.count`、`retry.delay_seconds` の値を確認する。
4. v2設定で使用するキーが、v2で認識されるものか確認する。

特に、v1では警告だけだった不明な設定キーが、v2では起動失敗の原因になります。仕様が確認できないキーは、v2設定へ機械的にコピーしないでください。

### 4.2 v2設定への変換

次のルールで設定を変換します。

1. `workers` を `concurrency` に変更する。
2. `retry.count` に1を加え、`retry.max_attempts` として設定する。
3. `retry.delay_seconds` の数値に `s` を付け、`retry.initial_delay` として設定する。
4. `queue: default` を追加する。
5. v2で認識されることを確認できない設定キーを見直す。

### 4.3 設定を検証する

変換後の設定ファイルを `relay.yml` として保存し、次のコマンドを実行します。

```bash
relay validate --config relay.yml
```

成功時には、次の表示を確認します。

```text
configuration valid
```

この表示が得られない場合、検証環境への投入や本番切り替えへ進まないでください。

## 5. 段階的な切り替え

### フェーズ1：設定変換と検証

- v1設定をバックアップする。
- v2設定へ変換する。
- `relay validate --config relay.yml` を実行する。
- `configuration valid` を確認する。

### フェーズ2：検証環境で稼働

検証環境でv2を起動し、1日稼働させます。

1日経過後、少なくとも次を確認します。

- 起動が継続していること
- エラーが発生していないこと
- 処理時間に問題がないこと

### フェーズ3：本番の10%をv2へ切り替え

検証環境で問題がなければ、本番の10%をv2へ切り替えます。

切り替え後、2時間確認します。

- エラー率
- 処理時間

切り替えに使用する具体的な運用コマンドは、本ガイドの対象外です。既存のデプロイまたはトラフィック切り替え手順を使用してください。

### フェーズ4：本番全体へ拡大

2時間の確認でエラー率と処理時間に問題がなければ、残りの本番をv2へ切り替えます。

問題があった場合は、全体展開を中止し、ロールバック判断を行います。

## 6. ロールバック手順

ロールバック時は、次の2つを同時にv1へ戻します。

- v1設定ファイル
- v1実行物

v2設定ファイルを、そのままv1実行物へ渡してはいけません。

基本手順は次のとおりです。

1. v2の切り替えを停止する。
2. v1設定ファイルを復元する。
3. v1実行物へ戻す。
4. v1として起動する。
5. 復旧後のエラー率と処理時間を確認する。

## 7. 移行チェックリスト

### 変換前

- [ ] v1設定ファイルをバックアップした
- [ ] v1実行物を保持した
- [ ] `workers` の値を確認した
- [ ] `retry.count` の値を確認した
- [ ] `retry.delay_seconds` の値を確認した

### v2設定

- [ ] `workers` を `concurrency` に変更した
- [ ] `retry.max_attempts` を `retry.count + 1` で設定した
- [ ] `retry.initial_delay` を時間文字列で設定した
- [ ] `queue: default` を追加した
- [ ] 不明な設定キーを確認した

### 検証・展開

- [ ] `relay validate --config relay.yml` を実行した
- [ ] `configuration valid` を確認した
- [ ] 検証環境で1日稼働させた
- [ ] 本番の10%をv2へ切り替えた
- [ ] 2時間、エラー率を確認した
- [ ] 2時間、処理時間を確認した
- [ ] 問題がなければ本番全体へ展開した

### ロールバック

- [ ] v1設定ファイルへ戻した
- [ ] v1実行物へ戻した
- [ ] v2設定をv1に渡していないことを確認した