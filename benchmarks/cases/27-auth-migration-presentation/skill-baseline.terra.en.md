# Authentication-Platform Migration: Readiness and Rollout Agreement

## Slide 1 — Why we are changing authentication

Today we need agreement on three things: the rollout order, the criteria for moving between stages, and the preparation owner in Development, Operations, and Support.

Our current system uses an in-house username-and-password implementation for about 8,000 users. It is still operating, but support for the platform ends in March 2027. Continuing beyond that point would leave us dependent on an unsupported authentication component.

The replacement uses company single sign-on and multifactor authentication. This is a migration of the authentication platform, not a change to user identity: user IDs will remain the same.

The goal is to move everyone before the current platform reaches end of support, while keeping login access dependable and ensuring that a failed rollout stage can be safely paused.

## Slide 2 — The user and support problem we need to reduce

Password reset is currently a significant support burden. We average 190 password-reset requests each month, representing 18 percent of all support inquiries.

That does not mean every password-reset request disappears automatically after migration, but it does show why authentication is not just a technical dependency. It is a frequent user-facing support path.

The new platform moves authentication to company SSO with multifactor authentication. Users will sign in through the company identity platform rather than through a password maintained by this system.

For users, the important continuity is simple: their user ID does not change. On their first login through the new path, their existing account is linked to the new platform.

## Slide 3 — The migration model: two systems, one user identity

During migration, both authentication systems will run. This gives us a controlled transition rather than a single cutover for all 8,000 users.

The systems have separate password stores. Passwords are never copied from the current system to the new platform. This is an intentional boundary: account linkage connects the existing account to the new authentication platform, but it does not transfer credentials.

The first-login flow is therefore central to the migration. A user authenticates through company SSO and multifactor authentication, and the system links that sign-in to the existing account while preserving the same user ID.

For the teams in this meeting, the practical implication is that we must be ready to support both paths until the rollout is complete—and to understand clearly which path a user is currently using.

## Slide 4 — Proposed rollout sequence

The rollout begins with 100 employees in October 2026.

In November, we expand to 10 percent of users. In December, we expand to 50 percent. In January 2027, we migrate everyone.

This sequence is designed to expose issues while the affected population is still limited, then to increase scale only after evidence shows that the new experience is working.

The first group should be treated as an operational learning stage, not merely a technical test. It should help us validate the login screen, session behavior, account linking, monitoring, user guidance, and the support verification process under real usage.

The meeting needs to confirm that this order is acceptable and identify any constraints that would require a different employee cohort or timing within these stages.

## Slide 5 — Advancement is evidence-based

A stage advances only when all three conditions are met.

First, login success must be at least 99.5 percent.

Second, there must be no critical incidents.

Third, support volume must be no more than 1.5 times normal.

These are not independent preferences. Together, they test whether users can access the system, whether there has been serious operational harm, and whether the support burden remains manageable.

A strong login-success rate alone is not enough if critical incidents occur. Likewise, a quiet incident record is not enough if users are generating support demand beyond the team’s sustainable capacity.

Before October, we need a shared definition of the measurement window, the source of truth for login success, how critical incidents are classified, and what baseline defines “normal” support volume. Those details are not yet specified here, so they must be agreed before the first stage begins.

## Slide 6 — What happens when a stage does not qualify

If a stage misses any advancement condition, rollout pauses.

Affected users can return to the current authentication system. Because both systems run during migration, this gives us a recovery path while the issue is investigated and corrected.

The purpose of this fallback is to protect access, not to hide problems. A paused stage should produce a clear operational decision: what condition was missed, which users are returning to the current system, who is investigating, and what evidence is required before the stage can resume.

We should not treat the calendar as the reason to advance. The January 2027 target matters because the current platform’s support ends in March, but the decision to move from one stage to the next must be based on the agreed conditions.

## Slide 7 — Development preparation

Development owns the product changes required for the new authentication path.

This includes changing the login screen so users enter through company SSO and multifactor authentication, updating session handling for the new platform, and implementing account linking at first login.

The account-linking flow deserves particular attention because it is the point where an existing system identity is connected to the new platform. Development should make failure states understandable to Operations and Support: what a linking failure looks like, what information is available for diagnosis, and what action is safe for a user to take.

Development should also provide a clear description of the expected login and fallback behavior. That shared understanding will allow Support to write accurate guidance and Operations to distinguish ordinary activity from migration failures.

The preparation owner from Development should leave this meeting responsible for confirming readiness of the login screen, session handling, account linking, and the information needed by the other teams.

## Slide 8 — Operations preparation

Operations must monitor both sets of logs throughout the migration. We need visibility into the current authentication system and the new platform at the same time, because users may be on different paths during each stage.

Operations must also monitor account-linking failures. This is essential to detecting a migration issue that may not appear as a general login failure.

The operational view should answer practical questions quickly: Are users successfully logging in? Is account linking failing? Is an issue concentrated in the current or new authentication path? Is there evidence that supports pausing the rollout or returning affected users to the current system?

The Operations owner should establish how the advancement criteria will be observed and reported during each stage. The team also needs an escalation path for suspected critical incidents, so that a decision to pause is timely and based on shared evidence.

## Slide 9 — Support preparation

Support must update identity-verification procedures and user guidance.

This is necessary because the authentication experience changes from an in-house username-and-password process to company SSO with multifactor authentication. Support needs procedures that remain appropriate for the new identity model, particularly when helping a user who cannot sign in or whose account has not linked correctly.

User guidance should explain the migration in plain language: user IDs remain unchanged; the account is linked at first login; users authenticate through company SSO and multifactor authentication; and, during migration, some users may still be using the current authentication system.

Support also needs a clear route for cases it cannot resolve directly. In particular, it needs to know what information to collect for suspected account-linking failures and when to involve Operations or Development.

The Support owner should be accountable for updated verification procedures, user guidance, and a support workflow that can identify migration-related issues early.

## Slide 10 — How the teams work together during each stage

Each rollout stage should follow the same operating rhythm.

Before a stage begins, Development confirms that the planned authentication experience is ready, Operations confirms monitoring coverage, and Support confirms that procedures and guidance are ready for the affected users.

During the stage, Operations observes login outcomes and account-linking failures across both systems. Support tracks inquiry volume and the nature of user problems. Development investigates product behavior when the evidence points to login, session, or linking issues.

At the end of the stage, the teams make one decision together: advance, pause, or return affected users to the current authentication system.

This structure keeps ownership clear while avoiding a handoff model where one team discovers an issue and the others learn about it too late.

## Slide 11 — Decisions required today

We are asking this meeting to make three agreements.

First, confirm the rollout order: 100 employees in October 2026, 10 percent in November, 50 percent in December, and all users in January 2027.

Second, confirm that every stage requires all three conditions: at least 99.5 percent login success, no critical incidents, and support volume no more than 1.5 times normal. We also need owners to define the measurement and decision details before the October stage.

Third, name one preparation owner from each team.

Development’s owner will prepare the login-screen, session-handling, and account-linking changes and the information needed to support them.

Operations’ owner will prepare dual-system monitoring, account-linking failure monitoring, and the rollout decision view.

Support’s owner will prepare revised identity verification, user guidance, and the migration support workflow.

## Slide 12 — Closing

This migration replaces an authentication platform that will lose support in March 2027. The path to that outcome is deliberately staged: protect user access, learn from each cohort, and advance only when the evidence supports it.

Success is not simply reaching the January rollout. Success is reaching it with stable login access, manageable support demand, clear operational visibility, and a reliable way to pause when the conditions are not met.

Today’s outcome should be a confirmed rollout sequence, agreed advancement criteria, and accountable preparation owners for Development, Operations, and Support.