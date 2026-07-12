# hachi-writing

AIエージェントが、事実を並べるだけでなく、人間が流れを追って理解できる文書を書くための調査とスキルです。

## このリポジトリの目的

GPT-5.6系のSolとLunaを含むAIモデルについて、日本語・英語の技術文書、日常文書、エッセイ、日報、プレゼン原稿を実際に生成し、次の問題を調べています。

- 日本語で見出しや箇条書きが増え、説明のつながりが切れる
- 英語で説明や反復が増え、文書や発表が長くなる
- モデルによって、細切れ化、長文化、作業報告の混入などの癖が異なる
- 文法や事実が正しくても、読者が全体の意味をつかめない

この調査結果をもとに、`hachi-readable-writing` というSkills互換の文書作成スキルを作っています。

## まず読むもの

全体の結論、試験方法、モデル比較、スキル導入前後の結果は[文書生成・評価レポート](REPORT.md)にまとめています。

スキルを使う場合は[Hachi Readable Writing](hachi-readable-writing/SKILL.md)を参照してください。言語とモデルごとの補正は、スキル内の[language-and-model.md](hachi-readable-writing/references/language-and-model.md)にあります。

## Vercel Skillsからインストール

Node.jsとnpmが使える環境で、次を実行してください。

```bash
npx skills add https://github.com/hachiware-labs/hachi-readable-writing.git --skill hachi-readable-writing
```

インストール後は、対応するAIエージェントで `$hachi-readable-writing` を指定するか、自然な文書作成の依頼として呼び出せます。インストール済みスキルの一覧は `npx skills ls`、更新は `npx skills update hachi-readable-writing` で行えます。

```bash
npx skills ls
npx skills update hachi-readable-writing
```

`skills` CLIの詳細は[Skills CLI documentation](https://www.skills.sh/docs/cli)を参照してください。CLIは匿名テレメトリを収集するため、無効にする場合は環境変数 `DISABLE_TELEMETRY=1` を設定します。

## ベンチマーク

`benchmarks/`には、自然な短い依頼と背景知識だけで構成した30題の日英プロンプト、スキルなしのSol/Luna出力、スキルありのSol/Luna出力、個別評価、ハッシュ目録を収録しています。

同じ題材を次の4条件で比較できます。

| 条件 | 用途 |
|---|---|
| `natural-baseline.*` | スキルなしのSol基準文書 |
| `luna-baseline.*` | スキルなしのLuna基準文書 |
| `skill-baseline.sol.*` | スキルありのSol出力 |
| `skill-baseline.luna.*` | スキルありのLuna出力 |

詳細な題材、生成環境、ファイル規約は[ベンチマークREADME](benchmarks/README.md)にあります。全120件の導入前後評価は[SKILL_EVALUATION.md](benchmarks/SKILL_EVALUATION.md)、Lunaの基準評価は[LUNA_EVALUATION.md](benchmarks/LUNA_EVALUATION.md)に記録しています。

## 初期調査

モデルの文章傾向、技術文書で流れが失われる理由、スキルに必要な設計原則、参考資料は[初期調査](RESEARCH.md)にまとめています。
