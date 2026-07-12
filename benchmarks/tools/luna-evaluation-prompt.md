Read every `benchmarks/cases/*/luna-baseline.ja.md` and `luna-baseline.en.md`, the corresponding `natural-prompt.ja.md` or `natural-prompt.en.md`, the Sol output `natural-baseline.ja.md` or `natural-baseline.en.md`, and the existing calibrated Sol scores in `benchmarks/NATURAL_EVALUATION.md`.

Evaluate all 60 Luna documents from the perspective of a human reader. This is an editorial readability and comprehensibility evaluation, not a factual benchmark and not praise of the model. The existing Sol score for the same case is a calibration anchor, not a score to copy. A Luna document with the same strengths and defects should receive a similar score. Do not move ordinary competent documents into the high 90s merely because they are usable. Scores above 95 require nearly no meaningful defect; long, repetitive, invented, meta-wrapped, or poorly scoped outputs cannot receive them. Apply the same rubric to every document:

- Flow, 0-25: purposeful order and understandable relationships across paragraphs or slides.
- Comprehension, 0-25: content, constraints, decisions, and next action are clear; inventions or framing do not mislead.
- Language, 0-25: natural diction, sentence rhythm, register, and terminology for the audience and language.
- Format, 0-25: headings, lists, tables, code, and presentation structure help rather than replace the explanation. Penalize model meta-commentary, failed file-creation commentary, or wrapping the whole deliverable in an outer code fence when it makes the result less directly usable.

For presentations, do not penalize bullets merely for existing. Judge whether the spoken material fits the requested duration and whether the slide sequence supports a single argument. For essays and narrative documents, judge continuity and earned closure. For urgent runbooks, judge whether the primary action path remains visible.

Return exactly 60 Markdown table rows and nothing else. Score only the overall result after applying the four equally weighted criteria internally. Use this shape:

`| ID | language | sol_score | luna_score | one concise comparative finding in Japanese |`

Use two-digit IDs, `ja` or `en`, and integer scores. Sort by ID and put `ja` before `en` within each ID. Copy the Sol score accurately from the existing evaluation. Keep each finding to one Japanese sentence without a pipe character and state the most important reason Luna differs from or resembles Sol.
