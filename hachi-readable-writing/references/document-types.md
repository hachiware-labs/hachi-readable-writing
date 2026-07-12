# Document-type guidance

Use only the relevant section.

## Technical explanation and API guide

Follow the reader's implementation path: purpose, request or operation, accepted result, important constraints, uncertain outcome, and failure handling. Explain why a rule matters near the rule. Keep examples internally consistent and distinguish illustrative values.

Do not repeat the same constraints in prose, a field list, a table, and a final checklist. Use a table when readers will repeatedly look up fields or status codes.

## Architecture and design

Center the document on design decisions rather than components.

For each important decision, connect:

1. the requirement or pressure;
2. the chosen design;
3. why it answers that pressure;
4. the cost or unresolved consequence.

Use a diagram or table only when relationships are hard to hold in prose. Keep proposed extensions separate from decisions already supplied. End with the small set of decisions the review must make, not every imaginable future question.

## Manual and tutorial

Put prerequisites and irreversible consequences before the action. Keep one operational action per numbered step, with expected results near the step. Explain completion and failure exits when known.

A tutorial must also teach the mental model: introduce the reason for a sensitive step before presenting code that depends on it.

## Software development guide

Explain the architecture and the boundaries between modules before showing code. When the user asks for code examples, select representative seams such as the domain type, one state transition, a persistence boundary, and one test. Do not turn the guide into a complete application, file dump, or scaffold unless the user explicitly asks for an implementation.

Every code block must teach a decision stated in the surrounding prose. Omit routine UI wiring and repeated variants when they do not introduce a new idea. If complete code would dominate the document, show a smaller internally consistent excerpt and state what the reader implements analogously.

## Incident and security runbook

Make the first safe action unmistakable. Preserve this sequence unless the supplied facts require another. Explicit source priorities override this template:

1. immediate containment;
2. minimal evidence preservation required before destructive cleanup;
3. service restoration;
4. scoped investigation;
5. communication and ownership;
6. explicit exit conditions.

Keep background reasoning short enough that an on-call reader can act. Separate “do now” from “understand later.”

## Email, notice, and request

Lead with the event or request. Then give the minimum reason, relevant evidence, recipient action, timing, and contact or alternative. Use ordinary sentences unless a list materially helps scanning.

Do not turn a short message into a miniature policy document.

## Daily report and activity report

Connect result, exception, investigation, judgment, collaboration, and next action. A daily report is not a completed-task inventory. Show why unfinished work remains and what the next person needs to know.

Use bullets for tomorrow's independent actions, not for breaking the day's causal account into fragments.

## Essay, reflection, and growth record

Choose a concrete recurring observation, scene, or contrast. Let its meaning change as the document proceeds. Select details that earn the final reflection.

Avoid a forced lesson, inflated emotion, generic inspiration, and a chronological diary with no change in understanding. Preserve mixed feelings when the source contains them.

## Presentation script

Design for one hearing, not later reference.

Interpret “presentation script” or “talk” as spoken material unless the user explicitly asks for slide copy, speaker notes, or both. Do not produce slide text plus a second, repetitive narration by default. When slide structure is useful, use short slide titles as navigation and write one spoken passage for each; do not duplicate the passage as bullets.

- Give each slide one job in the argument.
- Put only the claim, evidence, contrast, or action the audience needs to see on the slide.
- Keep speaker notes complementary to the slide instead of repeating it verbatim.
- Begin with the audience's problem and the decision or understanding sought.
- Move through evidence and consequences toward one explicit request or takeaway.
- State limitations where they affect the decision; do not bury them at the end.
- Reserve time for demonstrations, transitions, and pauses.

At the end, test the spoken word count against the requested duration. Cut material before compressing delivery speed.

Treat the time budget as a hard limit. Reserve at least 15 percent for transitions, pauses, and demonstrations. If the draft is over budget, remove repeated evidence, recaps, and secondary detail rather than adding a note that the speaker should talk faster.
