# Authentication Platform Migration

## Slide 1 — The decision we need today

**On screen**

- Confirm rollout order
- Confirm advancement and rollback criteria
- Assign preparation owners

**Speaker script**

Today we need to align on how we will move approximately 8,000 users from our in-house username-and-password system to company single sign-on with multifactor authentication.

This migration affects all three teams represented here. Development must change the authentication flow. Operations must run and observe two authentication systems during the transition. Support must prepare users and update identity-verification procedures.

By the end of this meeting, we should agree on three things: the rollout order, the conditions for advancing or pausing each stage, and the preparation owner in each team. We are not trying to settle every implementation detail today. We are establishing the shared operating plan that those details must support.

---

## Slide 2 — Why we are migrating

**On screen**

> The current platform reaches end of support in March 2027.

- About 8,000 users
- 190 password-reset requests per month
- 18% of all support inquiries

**Speaker script**

The immediate reason for the migration is that support for the current authentication platform ends in March 2027. We therefore need to complete the transition before that deadline, with enough time to stabilize the new platform.

The migration also addresses a persistent support burden. We receive an average of 190 password-reset requests each month. Those requests account for 18 percent of all support inquiries. Moving to company SSO should remove our internal password-reset path and place authentication within the company’s established identity system.

The new platform also requires multifactor authentication. That changes the security model as well as the user experience, so this is not simply a replacement login screen. It changes how users prove their identity, how sessions are managed, and how authentication failures are investigated.

---

## Slide 3 — What users will experience

**On screen**

1. Open the updated login screen  
2. Authenticate through company SSO and MFA  
3. Link the existing account at first login  
4. Continue with the same user ID  

**Speaker script**

The central promise to users is continuity: their user IDs will not change.

At first login through the new platform, the system will link the company identity to the user’s existing account. After that link is established, future authentication will use company SSO and multifactor authentication.

Passwords will never be copied from the current system to the new platform. Both authentication systems will run during the migration, but they remain separate. The new platform verifies the company identity and links it to the existing application account; it does not import or reproduce the old password.

That distinction needs to be clear in both the implementation and the user guidance. Users should understand that they are keeping their application identity while changing how they authenticate.

---

## Slide 4 — The rollout sequence

**On screen**

| Stage | Planned coverage |
|---|---:|
| October 2026 | 100 employees |
| November 2026 | 10% of users |
| December 2026 | 50% of users |
| January 2027 | All users |

**Speaker script**

The proposed rollout has four stages.

In October 2026, we begin with 100 employees. This gives us a controlled group in which to validate the login flow, account linking, session behavior, monitoring, and support procedures.

In November, coverage expands to 10 percent of users. With a population of about 8,000, that is approximately 800 users if the percentage is treated as total coverage.

In December, coverage increases to 50 percent, or approximately 4,000 users on the same basis. In January 2027, the new platform becomes available to everyone.

Today, we need to confirm this sequence and confirm that the percentage stages describe cumulative coverage. We also need to agree on how users will be selected within each stage. The cohorts should give us enough variety to expose problems before the next expansion, while remaining small enough to support safely.

---

## Slide 5 — Advancement is based on evidence

**On screen**

A stage advances only when all three conditions are met:

- Login success rate: at least 99.5%
- Critical incidents: none
- Support volume: no more than 1.5× normal

**Speaker script**

The calendar tells us when a stage may begin, but it does not automatically authorize expansion. Each stage advances only when all three conditions are satisfied.

First, the login success rate must be at least 99.5 percent. We need a shared definition of which attempts are included in that calculation so that development and operations report the same number.

Second, there must be no critical incidents. The teams must use an agreed incident classification and ensure that any unresolved critical incident blocks advancement.

Third, support volume must remain no more than one and a half times normal. Support will need an agreed baseline and a way to distinguish migration-related contacts from unrelated inquiries.

These are gates, not aspirations. Meeting two of the three is not sufficient. The decision to expand should be based on the same evidence at every stage.

---

## Slide 6 — What happens when a stage misses the gate

**On screen**

> Pause expansion. Preserve the current stage. Return affected users when necessary.

**Speaker script**

If any advancement condition is missed, the rollout pauses. We do not add the next cohort while the problem is being investigated.

Because both authentication systems remain available during the migration, affected users can return to the current authentication system. This provides a recovery path without copying passwords or changing user IDs.

A pause is not the same as abandoning the migration. It creates time to identify whether the failure comes from the login screen, SSO, multifactor authentication, account linking, session handling, operational configuration, or user guidance.

Before rollout begins, we need an executable return procedure: who authorizes it, how affected users are identified, how routing changes, what evidence is preserved, and how users and support staff are informed. The exact procedure remains preparation work, but its ownership must be assigned today.

---

## Slide 7 — Development preparation

**On screen**

**Development owns the application transition**

- Login screen
- Session handling
- Account linking

**Speaker script**

Development has three primary areas of responsibility.

The first is the login screen. It must direct users into the correct authentication path for their rollout stage and make the available recovery path understandable.

The second is session handling. Sessions created through the new platform must behave correctly throughout the application, including transitions such as sign-in, sign-out, expiration, and reauthentication.

The third is account linking. At first login, the authenticated company identity must be connected to the correct existing account without changing the user ID. Linking failures must be detectable and must not leave the account in an ambiguous state.

Development also needs to provide operations and support with enough diagnostic information to distinguish authentication failure from account-linking failure. Today’s decision is to name one development owner accountable for coordinating these changes and confirming readiness before each stage.

---

## Slide 8 — Operations preparation

**On screen**

**Operations owns visibility and controlled recovery**

- Monitor both authentication systems
- Detect account-linking failures
- Supply evidence for stage decisions

**Speaker script**

Operations must maintain visibility across both systems for the duration of the migration.

Monitoring only the new SSO flow would leave gaps because users may still authenticate through the current system, especially during a pause or return. Operations therefore needs to monitor both sets of logs and make the relationship between them usable during investigation.

Account-linking failures need specific attention. A user may successfully authenticate with company SSO but still be unable to enter the application because linking failed. If we report only SSO success, we could overstate the actual login success rate.

Operations should produce the evidence used at each advancement review: login success, critical incidents, support-volume input, and unresolved linking failures. We need one operations owner responsible for monitoring readiness, stage reporting, and coordination of the return procedure.

---

## Slide 9 — Support preparation

**On screen**

**Support owns a safe, consistent user path**

- Revised identity verification
- Updated user guidance
- Migration-related inquiry tracking

**Speaker script**

Support will be the first team to see patterns that metrics alone may not reveal.

Identity-verification procedures must be updated because the new platform uses company SSO and multifactor authentication, and internal passwords are not transferred. Support staff need a clear process for determining whether a user has an SSO problem, an MFA problem, an account-linking problem, or an application problem.

User guidance must explain what will change and what will remain the same. Users keep their current user IDs, authenticate through company SSO, complete MFA, and link their account at first login. The guidance should also explain where to seek help if linking does not complete.

Support must track migration-related contacts so that we can compare volume with the agreed normal baseline. Today, we need one support owner accountable for procedures, guidance, staff readiness, and support-volume reporting.

---

## Slide 10 — How the teams work as one migration group

**On screen**

| Signal | Primary lead | Required partners |
|---|---|---|
| Login or session failure | Development | Operations, Support |
| Monitoring or log gap | Operations | Development |
| Account-linking failure | Development | Operations, Support |
| User confusion or verification issue | Support | Development, Operations |
| Stage advancement decision | Joint review | All three teams |

**Speaker script**

The responsibilities are distinct, but the migration cannot be operated through isolated handoffs.

Support may be the first to recognize a recurring user problem. Operations may then confirm the pattern in logs, while development identifies whether the cause lies in account linking or session handling. Conversely, operations may detect a failure-rate increase before users contact support.

For that reason, each stage needs a joint readiness review before launch and a joint advancement review before expansion. Each team owner should bring the evidence from their area, identify unresolved risks, and state whether their team is ready to proceed.

The decision should be recorded against the three agreed gates. If the evidence is incomplete, the stage should not advance until the missing evidence is available.

---

## Slide 11 — Decisions for today

**On screen**

1. Approve or revise the four-stage rollout  
2. Confirm the three advancement gates  
3. Name one preparation owner per team  
4. Assign ownership of cohort selection, metrics, and return execution  

**Speaker script**

To close, the migration gives us a controlled path away from an authentication platform that reaches end of support in March 2027. It also moves authentication to company SSO and multifactor authentication while preserving existing user IDs.

The proposed sequence is 100 employees in October, 10 percent of users in November, 50 percent in December, and everyone in January. No stage advances unless login success is at least 99.5 percent, there are no critical incidents, and support volume is no more than one and a half times normal. If a condition is missed, expansion pauses and affected users can return to the current authentication system.

We now need to record the decisions: whether we accept the rollout sequence, whether we accept the gates as stated, and who owns preparation in development, operations, and support. We also need named ownership for cohort selection, metric definitions and reporting, and execution of the return path.

Once those decisions are made, each team can turn this shared plan into its detailed readiness work.