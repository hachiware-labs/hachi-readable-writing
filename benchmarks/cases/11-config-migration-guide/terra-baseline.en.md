# Relay Runner v1 to v2 configuration migration

This guide covers the known configuration changes required to move Relay Runner from v1 to v2. Convert and validate the configuration before each rollout stage; v2 will not start if the file contains unknown keys.

## Configuration changes

| v1 | v2 | Migration rule |
|---|---|---|
| `workers` | `concurrency` | Rename; value keeps the same meaning. |
| `retry.count` | `retry.max_attempts` | Add one: v1 excludes the initial attempt, while v2 includes it. |
| `retry.delay_seconds` | `retry.initial_delay` | Rename and use a duration string, such as `10s`. |
| Not required | `queue` | Required in v2. Set `queue: default` for this migration. |

## Example conversion

Before: Relay Runner v1

```yaml
workers: 8
retry:
  count: 3
  delay_seconds: 10
```

After: Relay Runner v2

```yaml
concurrency: 8
queue: default
retry:
  max_attempts: 4
  initial_delay: 10s
```

In this example, `count: 3` becomes `max_attempts: 4`: the v1 value represents three retries after the first attempt, while the v2 value represents all four attempts.

## Staged migration procedure

1. Convert the v1 configuration to the v2 form. Rename the known keys, add `queue: default`, and adjust each retry count as described above.

2. Review the full file for keys that are not supported by v2. v1 only warned about unknown configuration keys; v2 refuses to start when it finds them. We do not have compatibility information for any keys beyond those listed in this guide.

3. Validate the converted configuration:

   ```sh
   relay validate --config relay.yml
   ```

   Continue only when the command prints:

   ```text
   configuration valid
   ```

4. Run Relay Runner v2 with the converted and validated configuration in the validation environment for one day.

5. Move 10 percent of production traffic or workload to v2. Observe error rate and processing time for two hours.

6. If the two-hour observation is acceptable, expand v2 to all production.

## Rollback

Rollback must restore the v1 configuration file and the v1 executable together. Do not pass a v2 configuration file directly to a v1 executable.