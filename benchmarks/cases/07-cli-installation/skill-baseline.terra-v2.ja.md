# Lumen CLI 3.2.0 をインストールする

Lumen CLI 3.2.0 は、Windows 11、macOS 13 以降、Ubuntu 22.04 以降で利用できます。開始前に、Node.js 22 と npm 10 が利用できる状態にしてください。

ターミナルを開き、次のコマンドを実行します。

```sh
npm install --global @lumen/cli@3.2.0
```

`sudo npm install` は使用しないでください。Windows でも、管理者として PowerShell を起動する必要はありません。

インストール後、次のコマンドで確認します。

```sh
lumen --version
```

正常にインストールされていれば、次のように表示されます。

```text
3.2.0
```

## 最初のプロジェクトを起動する

次の順に実行します。

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

npm のグローバルインストール先を確認します。

```sh
npm prefix --global
```

表示された場所に対応する実行ファイル用ディレクトリが `PATH` に含まれているか確認してください。設定後はターミナルを開き直してから、もう一度 `lumen --version` を実行します。

## 権限エラーが出る場合

Node.js と npm が利用者向けにインストールされているかを見直してください。管理者権限や `sudo` で回避せず、利用者が書き込める環境に直してから再度インストールします。

## Lumen CLI を削除する

CLI だけを削除するには、次を実行します。

```sh
npm uninstall --global @lumen/cli
```

この操作で、すでに作成したプロジェクトは削除されません。