# Sol, Terra, and Luna comparison

This document puts the three model evaluations on one scale. Each model generated the same 30 topics in Japanese and English, with 10 technical documents, 15 everyday documents, and 5 presentations. Every run used Codex CLI 0.144.1 and `high` reasoning. Scores are editorial judgments of human readability and comprehensibility, not general model benchmarks or a human-participant study.

## Overall result

| Model | Without skill | With `hachi-readable-writing` | Difference | Improved / same / worsened |
|---|---:|---:|---:|---:|
| Sol | 84.2 | **88.9** | +4.6 | 37 / 12 / 11 |
| Terra | **89.8** | 89.1 | −0.7 | 8 / 11 / 41 |
| Luna | 88.4 | **90.4** | +2.1 | 41 / 8 / 11 |

Terra had the highest baseline score, while Luna had the highest score after the skill. Terra is therefore the clearest warning against treating one writing correction as universally beneficial: its baseline already avoided several Sol-like problems, and the skill often restructured documents that were adequate as written.

## By document group

| Group | Sol before | Sol after | Terra before | Terra after | Luna before | Luna after |
|---|---:|---:|---:|---:|---:|---:|
| Japanese | 84.9 | 89.1 | **92.0** | 88.9 | 88.1 | 89.6 |
| English | 83.6 | 88.7 | 87.6 | 89.4 | 88.7 | **91.3** |
| Technical | 79.8 | 85.0 | **90.5** | 86.3 | 85.6 | 89.0 |
| Everyday | 87.9 | 91.0 | 89.8 | **92.4** | 89.8 | 91.9 |
| Presentations | 82.1 | **90.4** | 88.5 | 85.1 | 89.5 | 88.9 |

## What the comparison suggests

- Sol benefits most from restoring the main line in long and fragmented technical documents. Its baseline weakness was over-expansion and excessive sectioning.
- Terra was strongest without the skill in this set, particularly in Japanese and technical documents. The skill should intervene conservatively when Terra already has a coherent structure.
- Luna gained most in English and in complex operational documents, but can mix file-operation commentary into the deliverable and can lose quality when a polished presentation is rewritten.
- The skill should therefore diagnose the draft first and choose a model-specific intervention level instead of applying the same rewrite rules to every model.

## Detailed records

- Sol baseline and skill comparison: [`benchmarks/NATURAL_EVALUATION.md`](benchmarks/NATURAL_EVALUATION.md), [`benchmarks/SKILL_EVALUATION.md`](benchmarks/SKILL_EVALUATION.md)
- Terra baseline comparison: [`benchmarks/TERRA_EVALUATION.md`](benchmarks/TERRA_EVALUATION.md)
- Terra skill comparison: [`benchmarks/TERRA_SKILL_EVALUATION.md`](benchmarks/TERRA_SKILL_EVALUATION.md)
- Luna comparison: [`benchmarks/LUNA_EVALUATION.md`](benchmarks/LUNA_EVALUATION.md)
