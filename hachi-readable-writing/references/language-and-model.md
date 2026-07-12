# Language and model adaptation

Use these as diagnostic priors, not stereotypes. Correct the draft that exists. Do not mention the model diagnosis in the finished document.

## Japanese

Japanese technical prose often degrades through excessive noun phrases, English terms, short labeled fragments, and implied relationships.

- Prefer an established Japanese word when an English or katakana term adds no precision.
- Keep identifiers, commands, API field names, product labels, and genuinely established technical terms unchanged.
- On first use, connect an unfamiliar term to its role in the sentence instead of adding a glossary fragment.
- Use a verb to show who acts, what changes, and why. Do not stack nouns such as “方針確認・影響整理・対応実施.”
- Let subjects remain implicit when clear, but restore them when actors or responsibilities could be confused.
- Join cause, contrast, and consequence explicitly. Avoid making the reader infer the relationship between adjacent bullets.
- Vary sentence length naturally. A run of uniformly short declarative sentences sounds mechanical; one long sentence containing three decisions is hard to retain.
- Match social distance to the actual relationship. Avoid automatic business phrases when a direct sentence is more natural.

For Japanese technical documents, inspect heading and bullet density before finalizing. If the document has more labels than explanatory paragraphs, merge related items and explain the decision in prose.

## English

English drafts often remain locally fluent while becoming globally repetitive or too long.

- Do not explain the same point in the opening, body, recap, and checklist.
- Prefer one strong example over several equivalent examples.
- Remove generic safety or implementation advice that is not needed for this reader's task.
- Treat “comprehensive” as coverage of necessary decisions, not maximum length.
- For a spoken presentation, budget roughly 110–140 spoken words per minute, leaving time for transitions, demonstrations, and pauses.
- Cut repeated signposting such as “First I will explain,” “As noted earlier,” and “To summarize” when the order is already visible.

## Sol-family prior

Observed Sol drafts tend to optimize for coverage. Look especially for:

- many headings, nested bullets, checklists, and repeated summaries;
- technical guides expanding into near-complete implementations;
- runbooks whose first action disappears among exhaustive cases;
- English presentations that exceed the speaking time;
- added best practices presented too close to supplied facts.

Correct by identifying the primary reader path, cutting secondary coverage, converting related bullets into causal paragraphs, and enforcing a length budget.

## Luna-family prior

Observed Luna drafts often preserve the main action path and control length better, but may confuse document creation with workspace operations. Look especially for:

- statements that the workspace is empty, read-only, or could not be written;
- offers to provide the document instead of simply providing it;
- an outer `markdown` code fence around the entire deliverable;
- undocumented details introduced with confident wording;
- an otherwise good document preceded or followed by agent commentary.

Remove the execution narrative and deliver the document directly. Keep code fences only around actual code or literal data inside the document.

## Terra-family prior

Observed Terra drafts often preserve the main line, control formatting, and write natural Japanese without help. Treat these strengths as the default state to preserve. Do not apply Sol-style compression or restructuring unless the actual draft shows fragmentation or excessive coverage.

Look especially for a small number of high-impact failures:

- answering an English request in Japanese or otherwise switching the dominant language;
- inventing prices, schedules, URLs, product behavior, forms, or operational promises to make a document feel complete;
- expanding a request for representative code into a near-complete implementation;
- repeating evidence and responsibilities across presentation sections until the spoken time no longer fits;
- changing an explicit source priority, such as placing evidence capture before an immediately required containment action;
- removing useful document identity or lookup structure, such as a daily report's date or a notice's actionable label.

Use conservative intervention:

1. Check requested language and unsupported claims first; correct them even if the prose is otherwise strong.
2. If the throughline, length, and format already fit, preserve the section order and most sentences.
3. Make local deletions or corrections instead of rebuilding the document.
4. Preserve supplied priorities over generic document-type templates.
5. For code-heavy guides, choose the minimum representative code needed to explain boundaries and data flow. Do not complete the application or add files merely because implementation details are available.
6. For presentations, keep one spoken argument and enforce the time limit without manufacturing slide-by-slide repetition.

Do not lower specificity that the reader needs merely to make the output shorter. Terra's main correction target is a consequential defect, not stylistic difference from the skill examples.

## Unknown or future models

Do not guess a family. Diagnose observable symptoms:

| Symptom | Correction |
|---|---|
| Excessive fragmentation | Merge related labels; restore paragraph relationships |
| Long but locally fluent | Cut repeated purposes, examples, recaps, and generic advice |
| Flat list without movement | Choose a governing question and reorder by causality or time |
| Meta-commentary around output | Remove it and return the deliverable alone |
| Overconfident additions | Mark as example, recommendation, assumption, or unknown |
| Artificially literary prose | Restore specific observation and restrained interpretation |
