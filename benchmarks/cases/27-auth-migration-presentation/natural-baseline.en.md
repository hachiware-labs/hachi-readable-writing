# Authentication Platform Migration — 15-Minute Presentation Script

## 1. Opening and meeting outcome — 1 minute

“Thanks, everyone. Today we need to align development, operations, and support on the migration from our in-house authentication system to company single sign-on and multifactor authentication.

This change affects about 8,000 users. It is both a necessary platform transition and an opportunity to improve security and reduce support demand.

By the end of this meeting, I’d like us to agree on three things: the rollout order, the conditions for advancing each stage, and the preparation owner in each team.

I’ll first explain why we’re migrating, then walk through the user experience, rollout controls, rollback approach, and team responsibilities. Questions will follow the presentation.”

## 2. Why we are migrating — 1 minute 15 seconds

“Our current system uses an internally developed username-and-password implementation. Support for the platform ends in March 2027, so continuing with it beyond that point would create operational and security risk.

It also generates significant support work. We receive an average of 190 password-reset requests per month. That represents 18 percent of all support inquiries—nearly one in five.

The new platform replaces application-specific passwords with company SSO and multifactor authentication. Users will authenticate through a company-managed service instead of maintaining a separate password for this system.

The migration therefore has three goals: complete the transition before support ends, strengthen authentication through SSO and MFA, and reduce password-related support demand.”

## 3. What changes for users — 1 minute 15 seconds

“The most important point for users is that their user IDs will not change.

When a user signs in through the new platform for the first time, we will link their existing system account to their company SSO identity. After linking, the application will continue to recognize them as the same user, with the same user ID.

Users will see a changed login screen and will complete authentication through company SSO, including MFA when required.

They will not be asked to transfer their current application password. Passwords will never be copied from the current system to the new platform.

Our guidance must make that distinction very clear: this is an account-linking process, not a password migration and not the creation of a new application account.”

## 4. What happens behind the login screen — 1 minute 15 seconds

“During the migration, both authentication systems will operate in parallel.

The current platform remains available while cohorts move to the new platform. On the new path, the application accepts the identity supplied by company SSO, links it to the existing user record at first login, and then establishes the user’s application session.

That creates three areas requiring particular attention.

First, the login screen must direct each user to the correct authentication path. Second, session handling must work correctly with the new identity provider. Third, account linking must reliably match the SSO identity with the correct existing user ID.

Account-linking failures are especially important because a successful SSO login does not necessarily mean the user successfully reached their application account.”

## 5. Proposed rollout order — 1 minute 30 seconds

“The proposed rollout has four stages.

In October 2026, we begin with 100 employees. This is the controlled pilot, allowing us to test the full user journey with a small, reachable group.

In November, we expand to 10 percent of users—approximately 800 people in total.

In December, we expand to 50 percent—approximately 4,000 people in total.

In January 2027, we migrate everyone who remains.

The dates and cohort sizes give us two months of margin before current-platform support ends in March 2027. That margin is important. It gives us time to pause, correct problems, and resume without turning the platform-support deadline into an emergency.

Today, we need to confirm not only these percentages but also the order of users within them. My recommendation is that the October pilot use employees who are easy to contact and represent common roles and workflows. Later cohorts should broaden that coverage before we include users with the most operationally sensitive access.”

## 6. Advancement criteria — 1 minute 30 seconds

“A rollout stage advances only when all three agreed conditions are satisfied.

First, login success must be at least 99.5 percent.

Second, there must be no critical incidents.

Third, support volume must be no more than one and a half times its normal level.

These are gates, not general targets. Missing any one condition means the next stage does not begin.

Before the pilot, we must make the measurements unambiguous. For login success, we need to define the measurement window and distinguish platform failures from user-cancelled or invalid attempts. For critical incidents, we need a shared severity definition and a clear authority for declaring and closing an incident.

For support volume, we need an agreed baseline, reporting window, and classification method. In particular, we should decide whether the threshold applies to all inquiries or specifically to authentication-related inquiries. Those definitions must be fixed before October so that we are not debating the meaning of a gate during the rollout.”

## 7. Pause and return path — 1 minute 15 seconds

“If a stage misses any advancement condition, the rollout pauses.

No additional cohort moves to the new platform while development and operations investigate the cause and support assesses the user impact. A pause is a planned safety control, not an indication that the migration has failed.

Affected users can return to the current authentication system while the issue is being corrected. Because both systems remain available during migration, we can restore access without copying or synchronizing passwords.

The return procedure still needs to be operationally precise. We need to know who can make the decision, how users are routed back, how support is notified, and what evidence is required before the new path is enabled again.

We should rehearse this process before the October pilot.”

## 8. Development responsibilities — 1 minute 15 seconds

“Development owns the application changes needed to make the new authentication path work.

That includes updating the login screen, adapting session creation and termination, and implementing first-login account linking.

Development also needs to make failures diagnosable. The system should distinguish an SSO authentication failure, an MFA issue, an account-linking failure, and an application-session failure. Operations and support cannot respond effectively if all of those appear as a generic login error.

Before the pilot, development should provide tested success and failure paths, useful error messages, the controls needed to return affected users to the current system, and technical guidance for the other teams.

Development should nominate one preparation owner and a backup.”

## 9. Operations responsibilities — 1 minute 15 seconds

“Operations must run both authentication paths throughout the migration.

That means monitoring the current platform and the new platform, correlating both sets of logs, and watching account-linking failures separately from general login failures.

Operations should produce a rollout view that shows login attempts, successful application access, the calculated success rate, linking failures, and active incidents. The view needs to support a clear advance, pause, or return decision for each stage.

Alerting and escalation paths should be tested before the pilot. Operations should also participate in a rollback rehearsal so that returning affected users to the current path is a known procedure rather than an improvised response.

Operations should nominate one preparation owner and a backup.”

## 10. Support responsibilities — 1 minute 15 seconds

“Support will be the closest team to the user experience.

Before rollout, support must update identity-verification procedures. The current process may rely on information connected to an application password reset, but the new process involves company identity, SSO, MFA, and account linking. Support agents need a safe method for verifying the user without weakening those controls.

User guidance must explain what is changing, what is staying the same, and what users should do when first-login linking fails. It should clearly state that user IDs do not change and passwords are not copied.

Support also needs issue categories that separate SSO, MFA, linking, session, and legacy-login problems. Accurate classification is necessary to enforce the support-volume gate and identify recurring failures.

Support should nominate one preparation owner and a backup.”

## 11. Cross-team operating model — 1 minute

“This migration cannot be run as three separate workstreams.

For each stage, development confirms application readiness, operations reports the technical measures, and support reports user impact and inquiry volume. Together, those inputs determine whether the stage advances.

I propose a named cross-team rollout lead who records the decision, with each team owner confirming their part of the evidence. Any critical incident automatically blocks advancement.

We also need one shared status channel, one incident process, and one source of truth for cohort membership and rollout state. Support must be able to see whether a user is on the current path, the new path, or has been returned after a pause.”

## 12. Decisions and close — 1 minute 15 seconds

“To close, I’m asking us to agree on the following.

First, the rollout order: 100 employees in October, approximately 10 percent in November, 50 percent in December, and all remaining users in January—along with the method for selecting users within each cohort.

Second, the advancement gates: at least 99.5 percent login success, no critical incidents, and support volume no higher than 1.5 times normal. We must assign owners to finalize the exact measurement definitions before the pilot.

Third, preparation ownership: one accountable owner and one backup from development, operations, and support, plus a cross-team rollout decision owner.

Our immediate readiness work is to complete the authentication changes, establish dual-platform monitoring, update support verification and guidance, and rehearse both account-linking failures and the return path.

If we agree on those points, we will have a controlled migration plan with measurable gates, a safe pause mechanism, and clear accountability—while retaining enough time before platform support ends in March 2027.

That concludes the presentation. Let’s use the discussion now to confirm the decisions and owners.”