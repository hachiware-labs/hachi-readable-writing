# Hachi Readable Writing Document Generation and Evaluation Report

Evaluation date: July 12, 2026

## What This Study Examined

Some AI-generated writing is factually correct and grammatically sound yet difficult for humans to read. In technical documentation in particular, headings and bullet points can fragment explanations into small pieces. Readers may understand each individual item but struggle to see why one part of the document leads to the next. In English, explanations within individual paragraphs may sound natural, but the same content is often repeated in the introduction, body, and conclusion, making documents and presentation scripts longer than necessary.

This study isolated whether these problems arise from the prompt, language, document type, or model. Based on the findings, we created `hachi-readable-writing`, a skill for producing documents whose flow human readers can follow, and compared GPT-5.6 Sol and GPT-5.6 Luna before and after introducing the skill.

In summary, the skill improved Sol’s average score from 84.2 to 88.9 and Luna’s from 88.4 to 90.4. The 4.2-point gap between the two models before the skill was introduced narrowed to 1.5 points afterward. However, not every document improved: Luna’s presentation scripts, which were already strong, declined by an average of 0.6 points.

## Why We Changed the Testing Method

The initial prompts specified the target audience, required sections, cautions, and even the desired length in detail. This approach produced high-quality documents, but left little room for the models to design the documents themselves. In fact, the first four documents received Fable-5 scores of 82, 87, 92, and 88, with most deductions relating to the addition of tables and bullet points or omitted information. Rather than measuring “unnaturally AI-like writing,” the test had become a measure of compliance with detailed specifications.

We therefore changed to a format closer to an actual input field. Each prompt consisted only of a two- or three-line user request and a bulleted list of available background information. We did not specify headings, tables, the order of explanation, writing style, or how cautions should be emphasized. This format required the models themselves to determine the intended audience, select information, connect paragraphs, and choose appropriate formats.

## Topics and Generation Conditions

There were 30 topics, generated separately in Japanese and English. They comprised 10 technical documents, 15 everyday documents, and 5 presentation documents.

The technical documents covered an API explanation, offline design, a recovery manual, CLI setup, software development, a Webhook tutorial, incident response, configuration migration, security procedures, and monorepo onboarding. The everyday documents covered a notification, email, travel plan, recipe, repair request, school announcement, exchange inquiry, household budget memo, listing description, and recruitment notice, as well as an essay, daily report, growth record, travelogue, and activity report. The presentations were divided into an executive proposal, technical migration, resident briefing, product demonstration, and internal study session.

All generation used Codex CLI 0.144.1, with the reasoning setting standardized to `high`. An independent temporary session was created for each document, without loading user settings, project rules, or conversation history from other documents. Sol and Luna each generated 60 documents without the skill and another 60 with the skill, resulting in a total of 240 documents for evaluation.

## Scoring Method

Each document was scored out of 100 points. The score comprised four 25-point categories: “flow,” which assessed the overall document order and relationships between paragraphs; “comprehension,” which assessed whether readers might misunderstand constraints or next actions; “language,” which assessed whether the vocabulary, style, and technical terminology suited the reader; and “format,” which assessed whether headings, bullet points, tables, and code supported comprehension.

For presentations, the mere presence of bullet points did not result in deductions. Instead, we assessed whether the amount of information could be understood on first hearing, whether the presentation would fit within the specified time, and whether each slide’s role contributed to a single overall claim. For incident response documents, we emphasized whether the first safe action was clear. For essays, we emphasized whether they showed a change in understanding and had a conclusion rather than merely listing events.

These scores are not the results of an experiment involving human participants. They are editorial evaluations conducted by Codex. To reduce variation in scoring standards between evaluation runs, the post-introduction documents were assessed relative to the scores of the existing documents. The scores should therefore be treated not as an absolute guarantee of quality, but as indicators for comparing tendencies across models and the skill.

## Model Characteristics Observed Without the Skill

### Sol

Sol produced natural writing for everyday emails, notifications, and essays. The deadline-extension email and travelogue each scored 95 points. When the purpose and recipient were specific, Sol converged on concise prose.

Its weakness was complex technical documentation. The Japanese version of the offline design reached 24 headings and 104 bullet points and scored 62. The Japanese token-leak procedure also had the correct execution order but was divided into 16 headings and 64 bullet points, resulting in a score of 60. In response to a request for representative code examples, the development guide expanded into an approximately 20 KB, partially completed implementation in English and scored 50.

In English, explanations at the paragraph level were relatively natural, but there was a strong tendency to make the overall document too long. Presentations intended to last 10–15 minutes were approximately 6,800–11,000 characters long. Although logically ordered, some could not realistically be delivered within the allotted time.

### Luna

Luna’s average score without the skill was 88.4, 4.2 points higher than Sol’s. It preserved the primary course of action in incident response and security procedures, and tended to make English presentations shorter than Sol’s. Luna’s English documents averaged approximately 3,399 characters, compared with approximately 4,344 for Sol.

However, Luna sometimes interpreted requests as file-creation tasks rather than requests for document content. It would incorporate a work report stating that it could not save the file because the environment was read-only, or wrap the entire document in a Markdown code fence. Even when the content was good, this created a different kind of problem: the output could not be used as-is.

## The Skill We Created

`hachi-readable-writing` does not operate solely through fixed instructions for each model name. Model characteristics are used as advance cautions, while corrections prioritize symptoms that actually appear in the draft.

Before writing, it determines the reader, the action the reader should take afterward, the single question supporting the document, what is known and unknown, and whether the document is intended to be read continuously or used as a reference. During writing, it first explains causality, time, contrast, and the reasons behind decisions in prose, using bullet points only for information that is genuinely parallel. After writing, it checks paragraph transitions, repetition, additions not found in the input, length, output language, and the accidental inclusion of work reports or outer code fences.

In Japanese, it avoids merely lining up noun phrases or English terms and instead states in sentences who does what and why. In English, it avoids repeating the same explanation in the introduction, body, conclusion, and checklist. For Sol, it focuses on excessive comprehensiveness and fragmentation; for Luna, it focuses on confusion between work reports and completed documents.

The presentation rules were revised during testing. Initially, the skill produced both slide text and a spoken script simultaneously, making Sol’s documents even longer. We therefore changed it so that it would not produce both unless explicitly requested by the user, and would treat a “presentation script” as the content to be spoken. We also added a requirement to reserve 15% of the presentation time for transitions, pauses, and demonstrations.

## Results After Introducing the Skill

| Category | Without skill | With skill | Difference |
|---|---:|---:|---:|
| Sol · All 60 documents | 84.2 | **88.9** | +4.6 |
| Sol · Japanese | 84.9 | **89.1** | +4.2 |
| Sol · English | 83.6 | **88.7** | +5.1 |
| Sol · Technical documents | 79.8 | **85.0** | +5.1 |
| Sol · Everyday documents | 87.9 | **91.0** | +3.1 |
| Sol · Presentations | 82.1 | **90.4** | +8.3 |
| Luna · All 60 documents | 88.4 | **90.4** | +2.1 |
| Luna · Japanese | 88.1 | **89.6** | +1.5 |
| Luna · English | 88.7 | **91.3** | +2.6 |
| Luna · Technical documents | 85.6 | **89.0** | +3.4 |
| Luna · Everyday documents | 89.8 | **91.9** | +2.1 |
| Luna · Presentations | 89.5 | **88.9** | −0.6 |

For Sol, 37 documents improved, 12 were unchanged, and 11 worsened. For Luna, 41 documents improved, 8 were unchanged, and 11 worsened.

The largest improvements were Luna’s English development guide, which rose from 52 to 83; Sol’s Japanese token-leak procedure, from 60 to 88; the Japanese connection-exhaustion response, from 64 to 87; the Japanese offline design, from 62 to 84; and the English token-leak procedure, from 68 to 90. As intended, the skill had a particularly strong effect on restoring the primary narrative thread in Sol’s complex technical documents.

Some documents still worsened. Luna’s English authentication-migration presentation fell from 92 to 87, Sol’s English development guide from 50 to 45, and Luna’s English construction briefing presentation from 91 to 87. With Luna in particular, the skill sometimes intervened too heavily in documents that were already concise and highly polished.

## What We Learned from the Results

First, the problems in AI-generated writing are not determined by language alone. Their manifestations vary depending on the combination of model, language, and document type. Japanese technical documents become fragmented, English presentations become overly long, and Luna mixes in work reports: although all of these can be described as “difficult to read,” they have different causes.

Second, making writing feel more human does not require uniformly prohibiting bullet points or adding emotional language. What matters is defining a single question for the document to answer, explicitly connecting causal and temporal relationships between paragraphs, and keeping the amount of content appropriate to the medium.

Third, a mechanism is needed to decide when not to change a good draft. The skill raised average scores and narrowed the gap between models, but it also had adverse effects on Luna’s presentations. In the future, when a draft already satisfies the requirements for its primary narrative thread, length, language, and format, the system should more strongly favor localized edits over complete restructuring.

## Records and Reproducibility

The skill itself is located at [`hachi-readable-writing/SKILL.md`](hachi-readable-writing/SKILL.md). The definitions of the 30 topics and the generation environment are documented in [`benchmarks/README.md`](benchmarks/README.md), and all 120 before-and-after comparisons are recorded in [`benchmarks/SKILL_EVALUATION.md`](benchmarks/SKILL_EVALUATION.md). Generated results are stored separately by model, language, and whether the skill was used, and the SHA-256 hash of each series has been cataloged.

The detailed initial investigation and references are available in [`RESEARCH.md`](RESEARCH.md), the evaluation of Sol without the skill in [`benchmarks/NATURAL_EVALUATION.md`](benchmarks/NATURAL_EVALUATION.md), and the baseline comparison of Sol and Luna in [`benchmarks/LUNA_EVALUATION.md`](benchmarks/LUNA_EVALUATION.md). These are retained as supporting materials for the consolidated report.