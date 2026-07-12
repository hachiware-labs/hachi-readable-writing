Relay Runnerをv1からv2へ移行する設定ガイドを作ってください。
運用担当者が段階的に切り替えるために使います。変更前後のYAML例も必要です。

背景として分かっていること:

- v1の `workers` はv2で `concurrency` に改名され、意味は同じ。
- v1の `retry.count` はv2で `retry.max_attempts` になる。v1のcountは「初回を除く再試行回数」、v2のmax_attemptsは「初回を含む総試行回数」なので、v1が3ならv2は4。
- v1の `retry.delay_seconds` はv2で `retry.initial_delay` となり、値は `10s` のような時間文字列にする。
- v2では `queue` が必須。今回の移行では `queue: default` を使う。
- v2は不明な設定キーがあると起動に失敗する。v1は警告だけだった。
- v2の設定確認コマンドは `relay validate --config relay.yml`。成功時は `configuration valid` と表示される。
- 段階移行では、まず設定を変換して検証し、検証環境で1日動かし、本番の10%をv2へ切り替え、エラー率と処理時間を2時間確認してから全体へ広げる。
- ロールバック時はv1設定ファイルとv1実行物へ同時に戻す。v2設定をv1へそのまま渡さない。
- ここに書いた以外の設定キーやコマンドは分からない

