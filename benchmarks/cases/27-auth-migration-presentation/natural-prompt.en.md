Create a presentation script explaining our internal system's authentication-platform migration to development, operations, and support teams.
It should take about 15 minutes excluding questions.

What we know:

- The current system uses an in-house username-and-password implementation and has about 8,000 users.
- Password-reset requests average 190 per month, 18 percent of all support inquiries.
- Support for the current platform ends in March 2027.
- The new platform uses company SSO and multifactor authentication.
- User IDs will not change. Accounts will be linked to the new platform at first login.
- The rollout is 100 employees in October 2026, 10 percent of users in November, 50 percent in December, and everyone in January 2027.
- Each stage advances only with at least a 99.5 percent login success rate, no critical incidents, and support volume no more than 1.5 times normal.
- If a stage misses those conditions, rollout pauses and affected users can return to the current authentication system.
- Both systems run during migration, but passwords are never copied between them.
- Support must update identity-verification procedures and user guidance.
- Operations must monitor both sets of logs and account-linking failures.
- Development must change the login screen, session handling, and account linking.
- The meeting should agree on rollout order, advancement criteria, and preparation owners in each team.

