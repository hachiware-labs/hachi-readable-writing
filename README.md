# hachi-readable-writing

Recent AI agents increasingly produce documents that list facts and processing results without giving the reader a clear line of thought. Such documents may be grammatically correct and factually accurate, yet remain difficult for people to understand because the relationships between the facts, the reasons for decisions, and the next action are left implicit. This skill addresses that problem by helping agents write documents that human readers can follow from beginning to end. It was designed from the research and benchmark results described below.

## Purpose

This repository studies how AI models, including GPT-5.6 Sol and Luna, write Japanese and English technical documents, everyday documents, essays, daily reports, and presentation scripts. It focuses on problems that ordinary grammar and fact checks miss:

- Japanese drafts that break explanations into too many headings and bullets
- English drafts that repeat themselves and exceed the useful length or speaking time
- Model-specific habits such as fragmentation, over-expansion, or agent process commentary
- Documents whose facts are correct but whose overall meaning is hard to follow

The research is implemented as the `hachi-readable-writing` skill.

## Start here

Read the [integrated document generation and evaluation report](REPORT.md) for the research question, test design, model comparison, and before/after results.

Read [Hachi Readable Writing](hachi-readable-writing/SKILL.md) to use or inspect the skill. Language- and model-specific guidance is in [language-and-model.md](hachi-readable-writing/references/language-and-model.md).

## Install with Vercel Skills

With Node.js and npm available, run:

```bash
npx skills add https://github.com/hachiware-labs/hachi-readable-writing.git --skill hachi-readable-writing
```

Then invoke `$hachi-readable-writing` in a supported agent, or use an ordinary request for a natural, reader-oriented document. List installed skills with `npx skills ls` and update this skill with:

```bash
npx skills ls
npx skills update hachi-readable-writing
```

See the [Skills CLI documentation](https://www.skills.sh/docs/cli) for the current CLI reference. The CLI collects anonymous telemetry by default; set `DISABLE_TELEMETRY=1` to opt out.

## Benchmark

The `benchmarks/` directory contains 30 natural-input cases. Each case has a short user request and background notes, followed by Japanese and English outputs from Sol, Terra, and Luna with and without the skill. The cases cover 10 technical documents, 15 everyday documents, and 5 presentations.

The four output families are:

| Family | Meaning |
|---|---|
| `natural-baseline.*` | Sol output without the skill |
| `luna-baseline.*` | Luna output without the skill |
| `terra-baseline.*` | Terra output without the skill |
| `skill-baseline.sol.*` | Sol output with the skill |
| `skill-baseline.luna.*` | Luna output with the skill |
| `skill-baseline.terra.*` | Terra output with the skill |

See the [benchmark README](benchmarks/README.md) for the environment and file conventions. The 120 before/after comparisons are in [SKILL_EVALUATION.md](benchmarks/SKILL_EVALUATION.md). The initial research is in [RESEARCH.md](RESEARCH.md).
