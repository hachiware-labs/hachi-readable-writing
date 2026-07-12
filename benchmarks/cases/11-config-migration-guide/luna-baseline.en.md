I couldn’t create the file because the workspace is read-only. The guide content is ready to save as `RELAY_RUNNER_V1_TO_V2.md`:

```markdown
# Relay Runner v1 to v2 configuration migration

## Configuration changes

| v1 | v2 | Migration rule |
|---|---|---|
| `workers` | `concurrency` | Rename; meaning is unchanged. |
| `retry.count` | `retry.max_attempts` | Add one. v1 excludes the first attempt; v2 includes it. |
| `retry.delay_seconds` | `retry.initial_delay` | Rename and use a duration string, such as `10s`. |
| — | `queue` | Required in v2. Use `queue: default`. |

v2 refuses to start when it finds unknown configuration keys. Remove unsupported keys before rollout.

## Before: v1

```yaml
workers: 8
retry:
  count: 3
  delay_seconds: 10
```

## After: v2

```yaml
concurrency: 8
retry:
  max_attempts: 4
  initial_delay: 10s
queue: default
```

`retry.count: 3` becomes `retry.max_attempts: 4` because v2 includes the initial attempt.

## Staged rollout

1. Convert the v1 configuration into a separate v2 file. Keep the original v1 file unchanged.
2. Validate the v2 configuration:

   ```text
   relay validate --config relay.yml
   ```

   Proceed only when it prints:

   ```text
   configuration valid
   ```

3. Run v2 in the validation environment for one day.
4. Move 10% of production to v2.
5. Observe error rate and processing time for two hours.
6. Expand v2 to all production if the results are acceptable.

## Rollback

Restore the v1 configuration file and v1 executable together. Do not pass a v2 configuration directly to v1.

1. Stop or remove the v2 instances.
2. Restore the original v1 configuration.
3. Restore the v1 executable.
4. Start Relay Runner v1 with the restored v1 configuration.

Keep the v1 configuration and executable available until migration is complete.
```