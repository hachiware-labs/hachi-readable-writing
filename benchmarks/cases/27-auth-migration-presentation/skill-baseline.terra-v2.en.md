# Authentication-Platform Migration: Coordination Meeting

## 1. Why we are changing

Today’s goal is to agree on the rollout order, the conditions for moving from one stage to the next, and the preparation owners in Development, Operations, and Support.

Our current authentication system is an in-house username-and-password implementation serving about 8,000 users. It has supported the product, but its platform support ends in March 2027. We need to complete this migration before that deadline while keeping login reliable for users and manageable for the teams supporting them.

The new platform will use company single sign-on and multifactor authentication. This is a change to how users authenticate, not a change to who they are in our system. User IDs will remain the same. At a user’s first login through the new platform, their existing account will be linked to it.

The migration is therefore not simply a login-screen release. For a period, we will operate two authentication paths, connect existing accounts safely, observe real user behavior, and only widen the rollout when the evidence supports doing so.

## 2. What problem this solves

The immediate reason is the March 2027 end of support for the current platform. But the migration also removes a recurring support burden.

Password-reset requests currently average 190 per month. They represent 18 percent of all support inquiries. Under the new model, users authenticate through company SSO with multifactor authentication rather than relying on the application’s in-house password flow. That changes the support experience and should reduce the application-specific password-reset workload, although we should not assume a support reduction until we see the actual results.

The change also concentrates responsibility differently. The application will still need to recognize users, create sessions, and link accounts correctly. At the same time, authentication issues may now involve the company identity environment, multifactor authentication, or the connection between that environment and our application. Our operational and support procedures need to reflect that shared boundary.

## 3. What will and will not change for users

For users, the important message is straightforward: their user ID does not change, and their account remains the same account.

At first login with the new authentication platform, the system will link the existing account to the new platform. We will run both authentication systems during the migration so that the rollout can be gradual and reversible.

One boundary is especially important: passwords will never be copied from the current system to the new platform. The new platform authenticates users through company SSO and multifactor authentication. The old password remains within the current system only for as long as that system is available during migration.

This means our guidance must avoid implying that a password is being transferred, converted, or reused. The transition is account linking, not password migration.

## 4. Rollout order

The rollout is intentionally staged.

In October 2026, the first group will be 100 employees. This is our pilot. It gives us a controlled opportunity to verify the full path: the updated login experience, SSO and multifactor authentication, session creation, account linking, logging, support handling, and the ability to return affected users to the current authentication system if needed.

In November, the rollout expands to 10 percent of users.

In December, it expands to 50 percent of users.

In January 2027, it expands to all remaining users.

This sequence gives us time between larger stages to learn from production behavior. It also leaves a margin before the current platform’s support ends in March 2027. That margin is valuable only if we treat the stage gates seriously rather than treating the dates as automatic release commitments.

## 5. Advancement criteria

Each stage advances only when all three conditions are met.

First, the login success rate must be at least 99.5 percent.

Second, there must be no critical incidents.

Third, support volume must be no more than 1.5 times normal.

These are joint conditions. A high login-success rate does not offset a critical incident. A quiet support queue does not offset unreliable linking. We advance only when the service is both technically stable and supportable in practice.

The purpose of these criteria is to make the decision visible and shared. Development can see whether the product behavior is healthy. Operations can see whether the authentication and linking paths are stable in the logs. Support can see whether users are succeeding without an unsustainable increase in assistance.

Before each expansion, the three teams should review the same evidence and explicitly decide whether the gate has been met.

## 6. What happens if a stage does not meet the gate

Missing a condition is not a reason to push harder. It is a reason to pause.

If a stage does not meet the advancement conditions, the rollout pauses. Affected users can return to the current authentication system while we investigate and correct the issue. This rollback path is why both systems remain available during migration.

A pause should produce a clear operational decision: which users remain on the new platform, which affected users return to the current system, what evidence is needed to understand the problem, and who owns the next update.

We should not wait for a broad failure to define this process. The teams need a common understanding before the October pilot: how to identify an affected user, how Support routes the case, what Operations checks, what Development changes, and who authorizes resuming the rollout.

## 7. Development preparation

Development owns the application changes that make the new authentication path work correctly.

The first responsibility is the login screen. It needs to present the new company SSO path clearly for users included in the rollout while preserving the current path for users who remain on the existing system or need to return to it.

The second responsibility is session handling. Authentication will come from the new platform, but the application still needs to create and manage sessions correctly. Session behavior must be consistent enough that the migration does not create avoidable sign-in loops, unexpected sign-outs, or ambiguous states between the two systems.

The third responsibility is account linking. The first new-platform login must connect the user’s unchanged application user ID to the new authentication platform reliably. Linking failures are not a minor edge case; they are one of the main risks of the migration, because a successful SSO authentication is not sufficient if the application cannot connect it to the correct existing account.

Development should enter the pilot with clear ownership for defects in these three areas and a defined way to distinguish login, session, and account-linking failures in the information available to Operations and Support.

## 8. Operations preparation

Operations will operate two authentication systems during the migration. That means monitoring cannot focus only on the new platform or only on the application’s existing signals.

Operations must monitor both sets of logs, with particular attention to account-linking failures. The key question is not simply whether an authentication request occurred. It is whether the user successfully completed the path into the application.

For the rollout gate, Operations needs a trustworthy view of login success rate and critical incidents. For diagnosis, the team needs to be able to correlate failures across the old system, the new authentication path, application sessions, and account linking.

The October pilot is the first real test of that visibility. Before then, Operations should confirm that the relevant logs can be monitored during the pilot and that the team can identify an account-linking failure quickly enough to support a pause or a return to the current system.

During each stage, Operations should provide the evidence needed for the go-or-pause decision and clearly flag conditions that could affect the next expansion.

## 9. Support preparation

Support is central to this migration because password-reset requests already average 190 per month and account for 18 percent of all inquiries.

The new platform changes the questions users will ask and the information Support needs before acting. Support must update identity-verification procedures and user guidance before the pilot begins.

The revised guidance should explain, in plain language, that users now sign in through company SSO and multifactor authentication, that their user ID remains unchanged, and that their account is linked at first login. It should also make clear that application passwords are not copied to the new platform.

The updated identity-verification procedure must support the new kinds of assistance without weakening verification. Support needs a reliable route for users who cannot complete the new sign-in flow, users whose account cannot be linked, and users who need to return temporarily to the current authentication system after a paused stage.

Support volume is also one of the rollout gates. That makes issue categorization important. We need to distinguish normal inquiry volume from migration-related contacts and identify the pattern early: SSO access, multifactor authentication, account linking, login-screen confusion, session behavior, or another issue. This is not just reporting; it tells us whether users can complete the migration without excessive assistance.

## 10. Working model during the migration

The teams will succeed if we treat the user’s login as one journey across team boundaries.

A user may start at the login screen built by Development, authenticate through company SSO and multifactor authentication, receive an application session, and have their existing account linked. If that journey fails, Operations needs evidence across both systems, Support needs a safe way to assist the user, and Development may need to correct the application behavior.

No single team can judge readiness alone. Development can confirm the intended behavior, Operations can confirm what is happening in production, and Support can confirm whether the experience is understandable and sustainable for users.

The shared question at every stage is: can the users in this rollout group sign in successfully, without critical incidents and without creating more than 1.5 times the normal support demand?

## 11. Decisions requested today

We need agreement on three things.

First, confirm the rollout order: 100 employees in October 2026, 10 percent of users in November, 50 percent in December, and all users in January 2027.

Second, confirm that advancement requires all three conditions: at least a 99.5 percent login success rate, no critical incidents, and support volume no more than 1.5 times normal. If any condition is missed, rollout pauses and affected users can return to the current authentication system.

Third, assign preparation ownership.

Development owns the login-screen changes, session handling, and account linking.

Operations owns monitoring both sets of logs and account-linking failures, along with the production evidence used at each stage gate.

Support owns the updated identity-verification procedures and user guidance, as well as the operational handling of migration-related user contacts.

If we make these agreements now and complete the preparation before the October pilot, we can migrate in measured stages, learn from each stage, and complete the transition before the current platform reaches end of support in March 2027.