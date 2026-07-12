# Restore a deleted workspace

Only the organization owner can restore a deleted workspace. A workspace can be restored only within 30 days of deletion.

Before you begin:

- Confirm that you are the organization owner.
- If another workspace now uses the deleted workspace’s URL slug, change the current workspace’s slug before restoring.
- Plan for up to 20 minutes for the restoration. Files remain read-only during this time.

## Restore the workspace

1. Sign in to the administration console.
2. Open **Settings**.
3. Select **Deleted workspaces**.
4. Select the workspace you want to restore.
5. Select **Review restore**.
6. Confirm the workspace name and URL slug.
7. Select **Restore workspace**.
8. Wait for the restoration to complete.

Restoration recovers the workspace’s members, settings, and files. A workspace cannot be restored after 30 days.

## After restoration

1. Verify that the expected members and files are available.
2. Re-enable any required external integrations individually. Integrations that stopped during deletion remain disabled.
3. Inspect the workspace’s scheduled jobs.
4. Restart the jobs that should run. Scheduled jobs do not restart automatically.