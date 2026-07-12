# Lumen CLI 3.2.0のインストール方法

初めてLumen CLIを使う開発者向けの手順です。

## 対応環境

- Windows 11
- macOS 13以降
- Ubuntu 22.04以降

事前に次のバージョンが必要です。

- Node.js 22
- npm 10

ターミナルから利用できる状態にしておいてください。Node.jsとnpmは、管理者権限や`sudo`を必要としない利用者向けの方法でインストールします。

## 1. Lumen CLIをインストールする

通常のPowerShellまたはターミナルを開き、次のコマンドを実行します。

```sh
npm install --global @lumen/cli@3.2.0
```

Windowsでも管理者PowerShellを使う必要はありません。macOSやUbuntuで`sudo npm install`を実行しないでください。

## 2. インストールを確認する

```sh
lumen --version
```

正常にインストールされていれば、次のように表示されます。

```text
3.2.0
```

## 3. 最初のプロジェクトを起動する

次のコマンドを順番に実行します。

```sh
lumen init hello-site
cd hello-site
lumen dev
```

起動後、ブラウザで次のURLを開きます。

```text
http://localhost:4173
```

## トラブルシューティング

### `lumen`が見つからない

まず、npmのグローバルインストール先を確認します。

```sh
npm prefix --global
```

表示されたグローバル先について、実行ファイル用のディレクトリが`PATH`に含まれているか確認してください。設定後、PowerShellまたはターミナルをいったん閉じて、開き直します。

### 権限エラーが発生する

Node.jsとnpmが利用者向けにインストールされているかを見直してください。

権限エラーを管理者PowerShellや`sudo`で回避しないでください。

## アンインストール

Lumen CLIを削除するには、次のコマンドを実行します。

```sh
npm uninstall --global @lumen/cli
```

この操作で、すでに作成したプロジェクトが削除されることはありません。