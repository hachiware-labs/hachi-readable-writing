TypeScriptモノレポ「Northstar」に参加する開発者向けの案内を作ってください。
リポジトリを取得した後、最初の小さな変更を提出できるところまで説明したいです。

背景として分かっていること:

- Node.js 22とpnpm 10を使う。
- ルートで `pnpm install --frozen-lockfile` を実行する。
- 主な構成は `apps/web`（React画面）、`apps/api`（HTTP API）、`packages/domain`（業務ルール）、`packages/ui`（共有画面部品）。
- `pnpm dev` でwebとapiを同時起動する。
- 全体テストは `pnpm test`、型検査は `pnpm typecheck`、整形確認は `pnpm format:check`。
- パッケージ単体のテストはルートから `pnpm --filter <package-name> test`。
- 最初の課題は、`packages/domain` の期限表示関数が期限当日を `due today` と返すように修正し、その単体テストを追加すること。
- `apps/web` や `apps/api` に同じ判定処理を複製しない。
- 変更後は対象パッケージのテスト、全体の型検査、整形確認を行う。全体テストは提出前に実行する。
- ロックファイルは依存関係を変えた場合だけ更新する。
- 環境変数、ポート番号、ブランチ名はまだ案内されていない

