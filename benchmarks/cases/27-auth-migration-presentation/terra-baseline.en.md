# Authentication Platform Migration — Presentation Script

## 1. Why we are changing now

Today, we need agreement on three things: the rollout order, the criteria for advancing between stages, and the preparation owner in each team.

Our current authentication system is an in-house username-and-password implementation serving about 8,000 users. It remains functional today, but its platform support ends in March 2027. Continuing with it beyond that point would create an avoidable operational risk.

There is also a clear support burden. We receive an average of 190 password-reset requests each month. That is 18 percent of all support inquiries. The new platform will use company single sign-on and multifactor authentication, which reduces our dependence on this separate password system while aligning the application with the company’s identity standard.

The goal is not simply to replace a login page. It is to make the change safely, preserve user access, and leave every team prepared to operate the new model.

## 2. What will change for users

The most important reassurance is that user IDs will not change.

When a user first signs in through the new platform, we will link their existing application account to their company identity. Their account, history, and application access remain associated with the same user ID.

The authentication experience does change. Instead of entering an application-specific username and password, users will sign in through company SSO and complete multifactor authentication.

We will run both authentication systems during the migration. However, we will never copy passwords from the current system to the new platform. This is an intentional security boundary: the new platform relies on company identity, not on a migrated copy of the old password database.

## 3. What this means operationally

Running both systems gives us a safe transition path, but it also means we need discipline during the migration.

For development, the work is the login screen, session handling, and account linking. The login flow must clearly direct the right users to the right authentication method, establish sessions correctly after SSO, and handle linking failures safely.

For operations, the work is visibility. Operations must monitor logs from both authentication systems and specifically watch account-linking failures. A successful SSO event is not enough if the application account cannot be linked or a session cannot be created.

For support, the work is user readiness and identity safety. Support must update identity-verification procedures and user guidance before each rollout stage. The support team should be able to explain what has changed, help users identify the correct login route, and handle cases where a user cannot complete the new flow.

## 4. Proposed rollout order

The proposed rollout is deliberately staged.

In October 2026, we begin with 100 employees. This is our controlled first production group: large enough to expose real behavior, but small enough to resolve issues without broad user impact.

In November, we expand to 10 percent of users.

In December, we expand to 50 percent of users.

In January 2027, we complete the rollout for all users.

This sequence gives us several checkpoints before the March 2027 end of support for the current platform. It also gives each team time to learn from actual user behavior before the next increase in volume.

Today, I am asking the group to approve this order as the baseline plan, subject to the advancement criteria on the next slide.

## 5. Advancement is earned, not scheduled

A calendar date alone does not move us to the next stage. Each stage advances only when all three conditions are met.

First, the login success rate must be at least 99.5 percent.

Second, there must be no critical incidents.

Third, support volume must be no more than 1.5 times normal.

These criteria work together. Login success measures the user outcome directly. Critical-incident review prevents us from overlooking a serious issue that may be rare but unacceptable. Support volume is an early signal that users are confused or that failures are not fully visible in the login metric.

The decision is therefore simple: if all three conditions are met, we advance. If any one is missed, we pause.

## 6. What happens if a stage does not meet the conditions

A pause is part of the plan, not a failure of the plan.

If a rollout stage misses any advancement condition, we stop further expansion. We investigate the issue, correct it, and reassess the stage against the same criteria.

Affected users must also be able to return to the current authentication system while the issue is being addressed. Because both systems run during migration, we have that safety path without needing to copy passwords or force an emergency account conversion.

The practical implication is that every team needs a clear handoff during a pause. Development diagnoses and corrects product behavior. Operations verifies the scope through logs and monitors recovery. Support provides consistent user guidance and follows the updated identity-verification procedure.

## 7. Development preparation

Development owns the application changes required for the new authentication path.

The first responsibility is the login screen. It must make the company SSO path understandable and avoid sending users into an ambiguous or unsupported flow during the staged rollout.

The second is session handling. A successful authentication event must result in a secure, reliable application session. Session failures can look to users like login failures, so they belong in the rollout success rate and operational review.

The third is account linking. At first login, the system must connect the user’s existing account to the new platform without changing the user ID. Linking failures need a clear outcome for users and useful diagnostic information for operations and support.

The development preparation owner should confirm readiness before the October employee rollout and remain accountable for defect resolution throughout the staged expansion.

## 8. Operations preparation

Operations owns the ability to see whether the migration is healthy in real time.

During the migration, operations must monitor both sets of logs: the current authentication system and the new SSO-based platform. This is necessary because some users will remain on the current system while others use the new one.

Operations must also monitor account-linking failures as a distinct signal. A login may fail because the identity provider rejected authentication, because the application could not link an account, or because the application session could not be established. Those are different problems and require different owners.

Before October, operations should define how login success rate, critical incidents, support-volume signals, and linking failures are reviewed for each stage. The outcome we need is a reliable go-or-pause decision, not just a dashboard.

## 9. Support preparation

Support owns the experience users receive when they need help.

The current system generates roughly 190 password-reset requests per month. With company SSO and multifactor authentication, some existing support patterns will change, but we should not assume support demand disappears immediately. Users may need help understanding the new sign-in route, resolving an account-linking issue, or determining where company identity support begins.

Before the first rollout, support must update identity-verification procedures and user guidance. The procedure needs to fit a world where the application no longer owns a copied password. Guidance should clearly distinguish application account issues from company SSO or multifactor-authentication issues, while still giving the user a coherent path to resolution.

Support should also be ready to report unusual contact patterns quickly. The stage criterion is no more than 1.5 times normal support volume, so timely and consistent categorization matters.

## 10. How teams work together during a rollout stage

Each stage should operate as one shared feedback loop.

A user signs in through company SSO. Development owns the application behavior after that sign-in. Operations observes success, failures, and linking signals across both platforms. Support captures user impact and applies the updated verification and guidance process.

At the stage review, we combine those views. We ask: did at least 99.5 percent of login attempts succeed? Were there any critical incidents? Did support remain at or below 1.5 times normal volume?

If the answer is yes to all three, we advance to the next group. If not, we pause expansion and ensure affected users can use the current authentication system while the issue is resolved.

That shared view prevents a local success from being mistaken for a system-wide success.

## 11. Decisions requested today

I am asking this meeting to make three concrete agreements.

First, approve the rollout order: 100 employees in October 2026, 10 percent of users in November, 50 percent in December, and all users in January 2027.

Second, approve the advancement criteria as mandatory gates: at least 99.5 percent login success, no critical incidents, and support volume no higher than 1.5 times normal. A missed condition pauses rollout.

Third, assign a preparation owner in development, operations, and support. Each owner should confirm readiness for their area before the October stage and provide the evidence needed at every stage review.

## 12. Closing

This migration gives us a supported authentication path before March 2027, brings the application onto company SSO with multifactor authentication, and preserves existing user IDs.

The safety of the migration comes from the staged rollout, the ability to pause, and the temporary availability of both systems. The success of the migration depends on the three teams operating it as one process.

If we agree on the rollout order, the advancement gates, and the preparation owners today, we can begin October with a controlled first stage and a clear way to decide every step after it.