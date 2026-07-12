# Lumen CLI 3.2.0 をインストールする

Lumen CLI は、Lumen プロジェクトの作成と開発サーバーの起動に使うコマンドラインツールです。この手順では、初めて使う開発者が Lumen CLI 3.2.0 をインストールし、最初のプロジェクトを起動するまでを説明します。

対応環境は Windows 11、macOS 13 以降、Ubuntu 22.04 以降です。事前に Node.js 22 と npm 10 を利用できるようにしてください。

## インストール

PowerShell、ターミナル、または Ubuntu の端末を通常の利用者として開き、次のコマンドを実行します。

```sh
npm install --global @lumen/cli@3.2.0
```

`sudo npm install` は使用しないでください。Windows でも、管理者として PowerShell を開く必要はありません。

インストール後、次のコマンドでバージョンを確認します。

```sh
lumen --version
```

正常にインストールされていれば、次のように表示されます。

```text
3.2.0
```

## 最初のプロジェクトを起動する

インストールを確認できたら、次の順に実行します。

```sh
lumen init hello-site
cd hello-site
lumen dev
```

開発用画面は、ブラウザで次のアドレスを開いて確認します。

```text
http://localhost:4173
```

## `lumen` が見つからない場合

`lumen` コマンドが見つからない場合は、npm のグローバルインストール先を確認します。

```sh
npm prefix --global
```

表示された場所にある、実行ファイル用のディレクトリが `PATH` に含まれているか確認してください。設定を確認・変更した後は、ターミナルを閉じて開き直し、もう一度次を実行します。

```sh
lumen --version
```

## 権限エラーが出る場合

権限エラーが出た場合は、Node.js と npm が利用者向けにインストールされているかを見直してください。管理者権限や `sudo` を使って回避しないでください。

## アンインストール

Lumen CLI を削除するには、次を実行します。

```sh
npm uninstall --global @lumen/cli
```

この操作で Lumen CLI は削除されますが、すでに作成したプロジェクトは削除されません。