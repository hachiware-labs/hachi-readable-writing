---
name: hachi-readable-writing
description: Create or revise readable, coherent, audience-appropriate documents in Japanese or English from short requests, rough notes, source material, or existing drafts. Use for technical documentation, API guides, architecture and incident documents, manuals, reports, emails, notices, essays, narrative records, and presentation scripts when document-level flow, natural wording, restrained formatting, factual boundaries, or model-specific writing defects matter.
---

# Hachi Readable Writing

Write a document a person can follow from beginning to end. Optimize for the reader's understanding, not for the appearance of completeness.

## Runtime policy

Keep the skill portable through Vercel Skills installations. The current skill uses no executable helpers. If a helper is added later, implement it only as JavaScript that runs with Node.js and npm. Do not add Python, PowerShell, Bash, Ruby, or other runtime dependencies. Prefer dependency-free JavaScript; when a package is genuinely necessary, declare it in `package.json` and use npm.

## Work from the reader's situation

Before drafting, determine silently:

1. Who will read or hear this?
2. What should they understand, decide, feel, or do afterward?
3. What single question holds the document together?
4. Which facts are supplied, which are uncertain, and which would be inventions?
5. Is the document mainly for continuous reading, later reference, live action, or oral delivery?

When purpose, constraints, or output format are unspecified, infer only what the request and source material reasonably support. If one conservative, low-impact choice is apparent, use it. If several plausible choices would materially change the document, briefly state the proposed direction or assumptions and ask for confirmation before drafting. When the user requests an immediate deliverable, proceed with conservative defaults unless the unknown concerns facts, authority, safety, or a hard requirement. Never present an inference as a supplied requirement or invent specifics to fill a gap.

Write in the language requested by the user. When the request does not name a language, use the language of the request and source notes. Never copy the language of this skill or its reference files merely because they were loaded into context. Preserve source-language quotations, identifiers, commands, and interface labels only where the document needs them.

## Build the throughline

Write a one-sentence internal throughline before writing the document. Do not print it as meta-commentary.

Arrange the material by the relationship the reader must understand:

- time for procedures, incidents, reports, and stories;
- cause and consequence for diagnosis and explanation;
- question, evidence, choice, and consequence for proposals;
- known state, design decision, reason, and trade-off for technical design;
- situation, request, reason, and next step for correspondence;
- tension, change, and earned reflection for essays;
- audience problem, evidence, proposal, limits, and decision for presentations.

Each section or paragraph must advance that throughline. Remove information that is merely adjacent to the subject.

## Draft prose before formatting

Explain relationships in sentences before converting material to headings, lists, tables, or code.

- Use paragraphs for reasoning, context, change, causality, contrast, and interpretation.
- Use bullets for genuinely parallel items that readers may scan independently.
- Use numbered steps only when order is operationally required.
- Use tables for repeated fields or exact comparisons, not as a substitute for explaining a decision.
- Use headings only when they divide meaningful reader tasks or changes of subject.
- Avoid one-sentence sections, nested lists, noun-fragment inventories, and a checklist that merely repeats the document.

Formatting is successful only when removing it would make a real relationship harder to see.

## Preserve factual boundaries

Separate facts, examples, recommendations, assumptions, and open questions.

- Do not turn an optional or merely possible field into a requirement.
- Do not invent product behavior, commands, URLs, prices, schedules, guarantees, or completion signals.
- Label illustrative values as examples.
- State an unknown briefly when the reader needs it; do not fill the document with disclaimers.
- Add general advice only when it is necessary for safe use and clearly distinguish it from supplied specifications.

## Adapt and revise

Read [language-and-model.md](references/language-and-model.md) when writing in Japanese, when the model family is known, or when the draft shows excessive fragmentation, repetition, verbosity, meta-commentary, or outer code fences.

Read [document-types.md](references/document-types.md) for technical documents, emergency runbooks, essays and reports, or presentation scripts.

Treat the first coherent draft as an asset. The skill is not a request to make it longer, more formal, more comprehensive, or more visibly structured. Before revising, apply a preservation gate: if the draft already has one clear throughline, fits its length and format, stays within the supplied facts, and uses the requested language, keep its structure and make only local corrections. Rebuild the document only when one of those conditions fails.

After drafting, revise once at the smallest effective scope:

1. State the document's main movement in one sentence. If this is difficult, reorder or cut sections.
2. Check that every paragraph has a reason to follow the previous one.
3. Merge headings or bullets that fragment one explanation.
4. Remove repeated facts, conclusions, summaries, and ceremonial openings.
5. Check length against reading purpose or speaking time.
6. Verify that supplied facts remain accurate and unknowns remain unknown.
7. Remove all agent process language, file-creation commentary, offers to continue, and wrappers around the deliverable.
8. Compare the finished document's dominant language with the user's requested language. If they differ, rewrite the document in the requested language before returning it. Reference-file language never overrides the request.

Do not add headings, examples, implementation detail, recaps, or transitions merely to demonstrate that the skill was applied. A good unchanged passage is a successful result.

Return only the finished document unless the user requests commentary, alternatives, or an explanation of edits. Never say that a file could not be created when the requested deliverable can be returned directly. Never wrap an entire Markdown document in a Markdown code fence.

## Final reading test

Read the result as its intended reader, not as its author.

- Can the reader tell why the document exists from the opening?
- Does the middle develop one understandable line rather than accumulate coverage?
- Does the ending provide the promised decision, action, resolution, or reflection?
- Can urgent readers find the first action?
- Can continuous readers move without decoding a sequence of labels?
- Can a listener understand a presentation once, at the requested pace?
- Is the document written in the user's requested language rather than the skill's language?

If not, revise the structure rather than adding another summary.
