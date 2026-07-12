# Lumen CLI 3.2.0のインストール

Windows、macOS、UbuntuでLumen CLI 3.2.0を初めて使う開発者向けの手順です。

## 事前準備

次の環境を用意してください。

- Windows 11
- macOS 13以降
- Ubuntu 22.04以降
- Node.js 22
- npm 10

Node.jsとnpmは、利用者向けのインストール状態にしてください。管理者権限や`sudo`で権限エラーを回避する方法は使用しません。

## Lumen CLIをインストールする

### Windows

通常のPowerShellを開き、次のコマンドを実行します。管理者PowerShellは前提にしません。

```powershell
npm install --global @lumen/cli@3.2.0
```

### macOS

ターミナルを開き、次のコマンドを実行します。

```bash
npm install --global @lumen/cli@3.2.0
```

`sudo npm install`は使用しないでください。

### Ubuntu

ターミナルを開き、次のコマンドを実行します。

```bash
npm install --global @lumen/cli@3.2.0
```

`sudo npm install`は使用しないでください。

## インストールを確認する

次のコマンドを実行します。

```bash
lumen --version
```

正常にインストールできていれば、次のように表示されます。

```text
3.2.0
```

## 最初のプロジェクトを起動する

プロジェクトを作成し、開発用画面を起動します。

```bash
lumen init hello-site
cd hello-site
lumen dev
```

開発用画面をブラウザーで開きます。

```text
http://localhost:4173
```

## `lumen`が見つからない場合

`lumen --version`で`lumen`が見つからないというエラーが表示された場合は、まずnpmのグローバルインストール先を確認します。

```bash
npm prefix --global
```

表示されたnpmのグローバルインストール先を確認し、Lumen CLIの実行ファイルが置かれるディレクトリがPATHに含まれているか確認してください。PATHを変更した場合は、ターミナルを開き直してから、もう一度確認します。

```bash
lumen --version
```

## 権限エラーが表示された場合

管理者権限や`sudo`でインストールをやり直さないでください。Node.jsとnpmが利用者向けにインストールされているかを見直し、利用者の権限でnpmのグローバルインストールを実行できる環境にしてください。

## Lumen CLIを削除する

Lumen CLIが不要になった場合は、次のコマンドで削除できます。

```bash
npm uninstall --global @lumen/cli
```

このコマンドでLumen CLIは削除されますが、作成済みのプロジェクトは削除されません。