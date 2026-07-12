以下を `CONTRIBUTING.md` などに掲載できる形でまとめました。

# Northstar 開発者ガイド

Northstar は、Node.js と pnpm を使う TypeScript モノレポです。リポジトリ取得後、ローカルで動作確認を行い、最初の小さな変更を提出するまでの手順を説明します。

## 1. リポジトリを取得する

```bash
git clone <リポジトリURL>
cd Northstar
```

使用する環境は次のとおりです。

- Node.js 22
- pnpm 10

バージョンを確認します。

```bash
node --version
pnpm --version
```

ブランチ名のルールは別途案内されるまで、チームの指示に従ってください。

## 2. 依存関係をインストールする

リポジトリのルートで、ロックファイルを変更しない方法で依存関係をインストールします。

```bash
pnpm install --frozen-lockfile
```

依存関係を追加・更新していない場合は、ロックファイルを変更しないでください。

## 3. リポジトリの構成

主なパッケージは次のとおりです。

- `apps/web` — React による画面
- `apps/api` — HTTP API
- `packages/domain` — 業務ルール
- `packages/ui` — 共有画面部品

業務上の判定や日付表示など、複数のアプリケーションから使われる処理は、まず `packages/domain` に実装します。`apps/web` や `apps/api` に同じ判定処理を複製しないでください。

## 4. 開発サーバーを起動する

web と api は、ルートから次のコマンドで同時に起動できます。

```bash
pnpm dev
```

環境変数やポート番号が必要な場合は、リポジトリ内の設定やチームの案内を確認してください。現時点では固定の値を前提にしません。

## 5. 最初の課題

最初の課題は、`packages/domain` にある期限表示関数を修正することです。

期限が現在の日付と同じ場合、表示結果が次の文字列になるようにします。

```text
due today
```

### 実装時の注意

- 判定処理は `packages/domain` に置く
- web や api に同じ処理を追加しない
- 時刻ではなく「年月日」の一致として期限当日を判定する
- タイムゾーンによって日付がずれないか確認する
- 既存の期限切れ・将来期限などの挙動を壊さない

まず対象の関数とテストを確認します。

```bash
rg "due|期限|format" packages/domain
```

期限日が今日の場合の単体テストを追加し、期待値が `due today` になることを確認します。可能であれば、現在時刻に依存しない固定日付を使い、テストが常に同じ結果になるようにしてください。

## 6. 変更を検証する

変更したパッケージのテストを実行します。`<package-name>` には `packages/domain/package.json` の `name` を指定してください。

```bash
pnpm --filter <package-name> test
```

続けて、全体の型検査と整形確認を実行します。

```bash
pnpm typecheck
pnpm format:check
```

提出前には、全体テストも実行します。

```bash
pnpm test
```

## 7. 変更を提出する

変更内容を確認します。

```bash
git status
git diff
```

確認するポイントは次のとおりです。

- `packages/domain` の変更になっている
- 期限当日の単体テストが追加されている
- web や api に判定ロジックを複製していない
- 不要な依存関係やロックファイルの変更がない
- 次の検証が成功している

```bash
pnpm --filter <package-name> test
pnpm typecheck
pnpm format:check
pnpm test
```

その後、チームで指定されたブランチ名と提出方法に従ってコミット・プルリクエストを作成します。