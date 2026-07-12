# Restore a deleted workspace

Deleted workspaces can be restored within 30 days of deletion. After 30 days, restoration is unavailable.

Only an organization owner can perform the restoration.

## Before you begin

- Confirm that the workspace was deleted less than 30 days ago.
- Check whether another workspace is using the deleted workspace’s URL slug. If so, change that workspace’s slug before continuing.
- Allow up to 20 minutes for restoration. Workspace files remain read-only while restoration is in progress.

## Restore the workspace

1. Sign in to the administration console as an organization owner.
2. Open `Settings`.
3. Open `Deleted workspaces`.
4. Select the workspace you want to restore.
5. Select `Review restore`.
6. Confirm the workspace name and URL slug.
7. Select `Restore workspace`.
8. Wait for the restoration to complete.

Restoration recovers the workspace’s members, settings, and files.

## After restoration

1. Verify that the expected members and files are present.
2. Re-enable each required external integration individually. Integrations disabled during deletion are not re-enabled automatically.
3. Inspect the workspace’s scheduled jobs.
4. Restart each scheduled job that should run. Scheduled jobs do not restart automatically.