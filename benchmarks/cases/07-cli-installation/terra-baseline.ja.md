# Lumen CLI 3.2.0 のインストール

この手順は、Windows 11、macOS 13以降、Ubuntu 22.04以降で初めてLumen CLIを使う開発者向けです。開始前に、Node.js 22とnpm 10を利用できるようにしてください。

## 1. Lumen CLIをインストールする

ターミナルを開き、次のコマンドを実行します。

```sh
npm install --global @lumen/cli@3.2.0
```

`sudo npm install` は使わないでください。Windowsでも、管理者としてPowerShellを起動する必要はありません。

## 2. インストールを確認する

次のコマンドを実行します。

```sh
lumen --version
```

正常にインストールされていれば、次のように表示されます。

```text
3.2.0
```

## 3. 最初のプロジェクトを起動する

次の順に実行します。

```sh
lumen init hello-site
```

```sh
cd hello-site
```

```sh
lumen dev
```

開発用画面は、ブラウザで次のURLを開いて確認します。

```text
http://localhost:4173
```

## `lumen` が見つからない場合

次のコマンドで、npmのグローバルインストール先を確認します。

```sh
npm prefix --global
```

表示された場所の実行ファイル用ディレクトリが、PATHに含まれているか確認してください。設定後はターミナルを閉じて開き直し、もう一度`lumen --version`を実行します。

## 権限エラーが出る場合

Node.jsとnpmが利用者向けにインストールされているかを見直してください。管理者権限や`sudo`での回避は行いません。

## Lumen CLIを削除する

Lumen CLIだけを削除するには、次のコマンドを実行します。

```sh
npm uninstall --global @lumen/cli
```

この操作で、`lumen init`で作成したプロジェクトは削除されません。