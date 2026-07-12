# Lumen CLI 3.2.0のインストール

この手順は、Windows、macOS、UbuntuでLumen CLIを初めて使う開発者向けです。

## 事前準備

次の環境が必要です。

- Windows 11、macOS 13以降、またはUbuntu 22.04以降
- Node.js 22
- npm 10

Node.jsとnpmは、管理者権限や`sudo`に頼らず利用できるよう、利用者向けにインストールしてください。

## インストール

通常のターミナルを開きます。Windowsでも管理者PowerShellを使う必要はありません。

次のコマンドを実行してください。

```console
npm install --global @lumen/cli@3.2.0
```

`sudo npm install`は使用しないでください。

インストール後、バージョンを確認します。

```console
lumen --version
```

次のように表示されれば、インストールは完了です。

```text
3.2.0
```

## 最初のプロジェクトを起動する

プロジェクトを作成します。

```console
lumen init hello-site
```

作成されたディレクトリへ移動します。

```console
cd hello-site
```

開発用サーバーを起動します。

```console
lumen dev
```

起動後、次のURLをブラウザーで開きます。

```text
http://localhost:4173
```

## `lumen`が見つからない場合

まず、npmのグローバルインストール先を確認します。

```console
npm prefix --global
```

表示されたグローバル先に対応する実行ファイル用ディレクトリが、環境変数`PATH`に含まれているか確認してください。設定を変更した場合は、ターミナルを開き直してから、もう一度バージョンを確認します。

```console
lumen --version
```

## 権限エラーが発生した場合

Node.jsとnpmが、現在の利用者で扱える方法でインストールされているか見直してください。管理者権限や`sudo`を使ってエラーを回避しないでください。

## アンインストール

Lumen CLIを削除するには、次のコマンドを実行します。

```console
npm uninstall --global @lumen/cli
```

CLIを削除しても、すでに作成したプロジェクトは削除されません。