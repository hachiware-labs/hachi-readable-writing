# Lumen CLI 3.2.0のインストール方法

対象環境は以下です。

- Windows 11
- macOS 13以降
- Ubuntu 22.04以降

インストール前に、Node.js 22とnpm 10を利用できる状態にしてください。

## 1. ターミナルを開く

- Windows：通常のPowerShellまたはターミナル
- macOS：ターミナル
- Ubuntu：端末

Windowsでも管理者権限で起動する必要はありません。

## 2. Lumen CLIをインストールする

次のコマンドを実行します。

```bash
npm install --global @lumen/cli@3.2.0
```

`sudo npm install` は使用しないでください。

## 3. インストールを確認する

```bash
lumen --version
```

正常にインストールされていれば、次のように表示されます。

```text
3.2.0
```

## 4. プロジェクトを作成して起動する

次のコマンドを順番に実行します。

```bash
lumen init hello-site
cd hello-site
lumen dev
```

開発用画面をブラウザーで開きます。

```text
http://localhost:4173
```

## `lumen` が見つからない場合

`lumen --version` の実行時に、`lumen` が見つからないというエラーが表示される場合は、npmのグローバルインストール先を確認します。

```bash
npm prefix --global
```

表示されたnpmのグローバル先を確認し、Lumenの実行ファイル用ディレクトリがPATHに含まれているか確認してください。PATHを修正した場合は、ターミナルを開き直してから、もう一度確認します。

```bash
lumen --version
```

## 権限エラーが表示される場合

管理者権限や`sudo`で回避しないでください。

Node.jsとnpmが、現在の利用者向けにインストールされているかを見直してください。見直した後、通常の権限で次のコマンドを再実行します。

```bash
npm install --global @lumen/cli@3.2.0
```

## Lumen CLIを削除する場合

```bash
npm uninstall --global @lumen/cli
```

この操作でLumen CLIは削除されますが、作成済みのプロジェクトは削除されません。