Lumen CLI 3.2.0のインストール方法を書いてください。
Windows、macOS、Ubuntuで初めて使う開発者向けです。

背景として分かっていること:

- 対応環境はWindows 11、macOS 13以降、Ubuntu 22.04以降。
- Node.js 22とnpm 10が事前に必要。
- インストールコマンドは `npm install --global @lumen/cli@3.2.0`。
- `sudo npm install` は使わない。Windowsでも管理者PowerShellを前提にしない。
- 確認コマンドは `lumen --version`。正常時は `3.2.0` と表示される。
- 最初のプロジェクトは `lumen init hello-site`、`cd hello-site`、`lumen dev` の順で起動する。
- 開発用画面は `http://localhost:4173` で開く。
- `lumen` が見つからない場合は `npm prefix --global` でnpmのグローバル先を確認し、その実行ファイル用ディレクトリがPATHに含まれるかを確認して、ターミナルを開き直す。
- 権限エラーの場合はNode.js/npmの利用者向けインストールを見直し、管理者権限やsudoで回避しない。
- 削除コマンドは `npm uninstall --global @lumen/cli`。作成済みプロジェクトは削除されない。
- ここに書いた以外のコマンドや画面は分からない

