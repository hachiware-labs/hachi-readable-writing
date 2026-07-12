# Authentication-Platform Migration  
## 15-minute presentation script

### Slide 1 — Purpose and decisions needed  
**Time: 1 minute**

“Today I’ll explain our migration from the current in-house username-and-password system to company SSO with multifactor authentication.

The goal is to align development, operations, and support on how the migration will work, what risks we need to control, and what each team must prepare.

By the end of this meeting, we need agreement on three things:

1. The rollout order and timing.
2. The criteria required to advance each stage.
3. Preparation owners and deliverables for each team.

Questions and discussion can follow the 15-minute overview.”

---

### Slide 2 — Why we are migrating  
**Time: 1.5 minutes**

“Our current authentication platform is an in-house username-and-password implementation serving approximately 8,000 users.

It creates a significant support burden. We receive about 190 password-reset requests each month, representing 18 percent of all support inquiries.

More importantly, support for the current platform ends in March 2027. That gives us a firm deadline: the migration must be complete, stable, and supported before then.

The replacement platform provides company SSO and multifactor authentication. This should reduce password-related support work, improve security, and give users a more consistent sign-in experience.”

---

### Slide 3 — What changes for users  
**Time: 1.5 minutes**

“For users, the most visible change is the login experience.

They will sign in through company SSO and complete multifactor authentication when required. Their user IDs will not change.

Accounts will be linked to the new authentication platform the first time each user signs in after being included in the rollout.

There are two important points to emphasize:

First, users are not being issued new IDs.

Second, passwords will never be copied from the current system to the new one. The two systems will coexist during migration, but credentials will remain separate.”

---

### Slide 4 — Migration approach and coexistence  
**Time: 2 minutes**

“We will use a staged rollout rather than moving all 8,000 users at once.

Both authentication systems will run during the migration period. This gives us a controlled fallback if a rollout stage produces unacceptable problems.

The planned exposure is:

- October 2026: 100 employees.
- November 2026: 10 percent of users, approximately 800 people.
- December 2026: 50 percent of users, approximately 4,000 people.
- January 2027: all users, approximately 8,000 people.

For planning purposes, these percentages are treated as cumulative exposure targets. We should confirm that interpretation before finalizing the schedule.

At each stage, users in the new cohort will be directed through SSO and multifactor authentication. Users who have not yet been migrated will continue using the current authentication system.

If we pause the rollout, affected users can return to the current authentication system. The fallback does not copy passwords or merge credentials; it simply allows authentication through the existing path while we investigate and correct the issue.”

---

### Slide 5 — Stage advancement criteria  
**Time: 2 minutes**

“A stage advances only when all three conditions are met.

The first is a login success rate of at least 99.5 percent.

The second is no critical incidents attributable to the migration.

The third is support volume no higher than 1.5 times normal.

All three conditions must be satisfied. Meeting two out of three is not sufficient to advance.

We also need to define the measurement details before the pilot begins. For example:

- What time window determines the login success rate?
- Which login failures count in the denominator?
- What qualifies as a critical incident?
- What baseline defines normal support volume?
- How long must the criteria remain stable before advancement?

My recommendation is that operations own the measurement dashboard and publish a stage-readiness report, with development and support validating the data for their areas.”

---

### Slide 6 — What happens if a stage fails  
**Time: 1.5 minutes**

“If any advancement condition is missed, the rollout pauses.

The immediate priorities are to protect users, understand the cause, and prevent the same issue from spreading to the next cohort.

Affected users can return to the current authentication system while the issue is investigated. We should communicate that fallback clearly so users and support staff know it is an expected safety mechanism, not an exception requiring improvisation.

Before restarting, the responsible teams must agree that the issue is understood, the corrective action is in place, and the stage criteria have been met again.

The restart decision should be recorded with the incident summary, evidence, and approval from the designated owners.”

---

### Slide 7 — Development responsibilities  
**Time: 1.5 minutes**

“Development has three primary areas of work.

First, the login screen must support the new SSO flow and clearly distinguish the new experience from the legacy path during coexistence.

Second, session handling must be updated. This includes creating, validating, expiring, and terminating sessions correctly under the new authentication model.

Third, account linking must be implemented safely. At first login, the system must associate the existing user ID with the new authentication identity.

Development should also provide diagnostics for failed account linking, clear error handling, and a reliable way to determine whether a user is currently using the new or legacy authentication path.

The key preparation question for development is: who owns each change, and what evidence will demonstrate that the changes are ready for the October pilot?”

---

### Slide 8 — Operations responsibilities  
**Time: 1.5 minutes**

“Operations will need visibility across both systems during the migration.

That means monitoring both sets of authentication logs, login success and failure rates, SSO and multifactor errors, session problems, and account-linking failures.

Operations should establish alerts for conditions that could threaten the stage gates, especially sudden increases in failed logins or linking errors.

The operational dashboard should show results by rollout cohort so that we can distinguish a migration problem from an unrelated issue affecting existing users.

Operations will also coordinate the stage-readiness report: whether the 99.5 percent login target was met, whether any critical incidents occurred, and whether support volume remained within the allowed limit.”

---

### Slide 9 — Support responsibilities  
**Time: 1.5 minutes**

“Support will be central to making the user transition understandable and manageable.

Support procedures must be updated for identity verification. Existing password-reset procedures cannot simply be reused because the new platform uses company SSO and multifactor authentication.

Support guidance should cover:

- How users start the new login flow.
- What to do when multifactor authentication fails.
- How to recognize an account-linking problem.
- When to direct a user to the legacy path.
- How to verify identity without relying on information that should no longer be treated as proof.
- How to categorize migration-related tickets for reporting.

Support should also prepare user-facing guidance before each rollout stage, including concise instructions, fallback information, and escalation routes.

Because support volume is one of the advancement criteria, support’s ticket categorization and reporting need to be ready before the pilot.”

---

### Slide 10 — Proposed ownership and decisions  
**Time: 1 minute**

“To close, here is the ownership model I propose.

Development owns the login experience, session handling, account linking, and technical defect resolution.

Operations owns dual-system monitoring, dashboards, alerting, and stage-readiness measurement.

Support owns identity-verification procedures, user guidance, ticket categorization, and frontline communications.

Together, the teams own the rollout decision. No stage advances until the agreed criteria are met and the owners confirm readiness.

The decisions we need today are:

1. Do we approve the October-to-January rollout order?
2. Do we agree that the November, December, and January percentages are cumulative targets?
3. What exact definitions and measurement windows will we use for the three advancement criteria?
4. Who are the named preparation owners in development, operations, and support?
5. What date will each team use as its readiness checkpoint for the October pilot?

If we leave with those decisions, we will have a shared plan for completing the migration before current-platform support ends in March 2027.”

