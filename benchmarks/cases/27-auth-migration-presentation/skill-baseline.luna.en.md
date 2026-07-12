# Authentication Platform Migration

## Slide 1 — Why we are changing

Today we are aligning on how we will move our internal system from its current authentication platform to company SSO with multifactor authentication.

The current system uses an in-house username-and-password implementation for approximately 8,000 users. It is still operating, but its support ends in March 2027. We therefore need to complete the migration before that deadline while keeping access reliable throughout the transition.

This migration is also an opportunity to reduce a recurring support burden. Password-reset requests average 190 per month and represent 18 percent of all support inquiries. Moving password management to company SSO should remove much of that work, while multifactor authentication will strengthen account protection.

The decision we need from this meeting is practical: do we agree on the rollout order, the conditions for advancing each stage, and the preparation owners for development, operations, and support?

## Slide 2 — What will change for users

Users’ IDs will not change. They will continue to identify themselves with the same user ID after migration.

The authentication experience will change. Instead of entering a password managed by the internal system, users will sign in through company SSO and complete multifactor authentication according to the company’s standard process.

Accounts will be linked to the new authentication platform at the user’s first login. This means the migration does not require us to copy or recreate passwords. Passwords will never be copied between the two systems.

For most users, the expected result is a more consistent sign-in experience and fewer password-reset problems. However, first login is a meaningful transition point. If account linking fails, or if a user cannot complete SSO or multifactor authentication, they must still be able to receive help and regain access safely.

## Slide 3 — Migration principles

The migration is designed around three principles.

First, we will migrate in stages rather than switching all 8,000 users at once. Each stage gives us evidence about reliability, support impact, and operational visibility before we expand the user population.

Second, both authentication systems will run during the migration. The current system remains available as a controlled fallback for affected users when a rollout stage does not meet its advancement conditions.

Third, we will protect credentials throughout the process. The systems may coexist, but passwords will not be transferred between them. The new platform will establish the user’s authentication path through SSO and multifactor authentication, while the application handles the account link using the unchanged user ID.

This approach separates authentication from application identity. It also gives us a clear way to pause if the migration creates unacceptable disruption.

## Slide 4 — Proposed rollout order

The proposed rollout has four stages.

In October 2026, we will start with 100 employees. This initial group gives us a small, observable population for validating the login flow, account linking, logs, support procedures, and user guidance.

In November, we will expand to 10 percent of users. With approximately 8,000 users, that represents about 800 users.

In December, we will expand to 50 percent, or about 4,000 users.

In January 2027, we will migrate everyone. This completes the rollout two months before support for the current platform ends in March.

The order is intentionally gradual. The October group is small enough to investigate individual failures closely. November and December then test the process at increasing scale. January is the final transition, but it should not be treated as the first time we learn whether the migration works.

## Slide 5 — When a stage may advance

A stage advances only when all three conditions are met.

The login success rate must be at least 99.5 percent. This measures whether users can complete the authentication path successfully, including the new login experience and the account-linking process where applicable.

There must be no critical incidents associated with the stage. A high aggregate success rate is not sufficient if a critical failure affects security, availability, or a material group of users.

Support volume must be no more than 1.5 times normal. This condition ensures that a technically successful rollout has not created an unsustainable support burden. The comparison should use the established normal support volume for the relevant period.

These are gates, not targets that can be traded against one another. A stage that meets the login rate but produces a critical incident does not advance. A stage without critical incidents still pauses if support volume exceeds the limit.

## Slide 6 — What happens when a gate is missed

If any advancement condition is missed, the rollout pauses.

Affected users can return to the current authentication system while the issue is investigated. This fallback is possible because both systems run during the migration. It is not a reason to copy passwords or to bypass the new authentication controls.

The pause should give the teams time to determine whether the problem is isolated or systemic. We need to identify the affected users, preserve the relevant evidence, correct the issue, and confirm that the fallback and recovery procedures work as expected.

The important point is that the schedule does not override the gates. If a stage misses the conditions, we pause the expansion rather than moving more users into an unresolved problem. The January completion date remains the objective, but safe advancement is the controlling rule.

## Slide 7 — Development responsibilities

Development owns the application changes required to support the new authentication flow.

The login screen must direct users through the new sign-in experience and clearly explain what they need to do. The screen should also provide a useful path for users who encounter an error, rather than leaving them with an ambiguous failure.

Session handling must be updated so that sessions created through the new platform have the correct lifetime, refresh behavior, and logout behavior. The application must continue to recognize the user correctly after authentication is complete.

Account linking is the other central responsibility. On first login, the application must associate the authenticated SSO identity with the existing user ID. The linking behavior must be safe to retry and must not create duplicate accounts or attach one identity to the wrong user.

Development should also provide enough diagnostic information for operations and support to distinguish authentication failures, session failures, and account-linking failures. Those categories lead to different responses, so they cannot be treated as one generic login error.

## Slide 8 — Operations responsibilities

Operations owns visibility and operational control across both systems.

During migration, operations must monitor logs from the current authentication platform and the new platform. Monitoring must include login outcomes, authentication errors, fallback activity, and account-linking failures.

Account-linking failures deserve particular attention because the user may successfully authenticate with SSO but still be unable to access the application. That failure would be easy to miss if monitoring stopped at the identity provider.

Operations also needs a stage-level view of the three advancement conditions: login success rate, critical incidents, and support volume as reported by the support team. The rollout decision should be based on a shared view of those signals and on a clearly defined measurement period for each stage.

Finally, operations must be ready to pause the rollout and support the return of affected users to the current authentication system. The fallback path is part of the migration design, not an emergency procedure to be invented after a failure.

## Slide 9 — Support responsibilities

Support owns the user-facing part of the transition.

Identity-verification procedures must be updated for the new authentication model. Support needs a reliable way to verify a user before helping with access, especially when the issue involves SSO, multifactor authentication, or a request to use the fallback system.

User guidance must explain the first-login experience in plain language: the user ID remains the same, authentication moves to company SSO, multifactor authentication may be required, and the account is linked during the first login.

The guidance should also explain what users should do if they cannot sign in and what information they should provide when contacting support. At the same time, support instructions must not ask users to share passwords. There is no password migration between the systems.

Support will also provide an important signal for the advancement gates. A rise in inquiries may reveal a problem that the technical success rate does not show, so support volume and issue themes must be reviewed together.

## Slide 10 — How the teams work together at each stage

Each stage should follow the same operating pattern.

Before the stage begins, development confirms that the relevant application changes are ready, operations confirms monitoring and fallback readiness, and support confirms identity-verification procedures and user guidance.

During the stage, development watches application behavior and linking errors, operations watches both authentication systems and the migration signals, and support handles user impact while classifying the reasons for inquiries.

After the stage, the teams review the same evidence. We ask: did at least 99.5 percent of logins succeed, did any critical incident occur, and did support volume remain at or below 1.5 times normal?

Only after all three answers are acceptable do we advance to the next user population. If any answer is not acceptable, the rollout pauses, affected users may return to the current authentication system, and the teams agree on the corrective action before resuming.

## Slide 11 — Decisions and owners

Today, we need agreement on three points.

First, we need to confirm the rollout order: 100 employees in October 2026, 10 percent of users in November, 50 percent in December, and everyone in January 2027.

Second, we need to confirm the advancement gates: at least a 99.5 percent login success rate, no critical incidents, and support volume no greater than 1.5 times normal. We also need agreement that missing any one of these conditions pauses the rollout.

Third, each team must name its preparation owner.

Development’s owner will coordinate the login screen, session handling, account linking, and diagnostic behavior.

Operations’ owner will coordinate monitoring for both systems, account-linking failures, stage metrics, and the fallback path.

Support’s owner will coordinate identity-verification procedures, user guidance, inquiry classification, and support-volume reporting.

The migration is complete when all users are using the new authentication platform and the current platform is no longer needed for authentication. Until then, both systems remain part of the operating plan.

## Slide 12 — Closing

This migration has a fixed external deadline, but the rollout itself is controlled by evidence.

We are preserving user IDs, avoiding password transfer, introducing company SSO and multifactor authentication, and expanding the user population only when reliability, incident, and support conditions are acceptable.

If we agree on the four-stage order, the three advancement gates, and one preparation owner in each team, we have the basis for a coordinated October start and a safe path to full migration in January 2027.

That is the decision requested today. We can now take questions and resolve any remaining ownership or measurement details.