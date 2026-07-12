# Relay Runner v1 to v2 Configuration Migration Guide

This guide describes how to convert a Relay Runner v1 configuration, validate it with v2, and roll out v2 in stages.

## Configuration changes

| v1 | v2 | Migration rule |
|---|---|---|
| `workers` | `concurrency` | Rename the key. The meaning is unchanged. |
| `retry.count` | `retry.max_attempts` | Add 1 because v1 excludes the first attempt and v2 includes it. |
| `retry.delay_seconds` | `retry.initial_delay` | Rename the key and express the value as a duration string. |
| — | `queue` | Required in v2. Set it to `default` for this migration. |

v2 refuses to start when it finds unknown configuration keys. v1 only warned about them, so review the complete configuration and remove or update any keys that v2 does not recognize. No migration rule for other keys is defined here.

## Before and after

Example v1 configuration:

```yaml
workers: 3

retry:
  count: 3
  delay_seconds: 10
```

Equivalent v2 configuration:

```yaml
concurrency: 3

retry:
  max_attempts: 4
  initial_delay: 10s

queue: default
```

The retry value changes from `3` to `4` because:

- v1 `retry.count: 3` means three retries after the initial attempt.
- v2 `retry.max_attempts: 4` means four attempts in total.

For example, a v1 value of `retry.count: 0` becomes `retry.max_attempts: 1`.

## Migration procedure

1. Create a copy of the v1 configuration file and convert the copy to the v2 format.

2. Rename `workers` to `concurrency` without changing its value.

3. Rename `retry.count` to `retry.max_attempts` and add 1 to its value.

4. Rename `retry.delay_seconds` to `retry.initial_delay`, expressing the duration as a string such as `10s`.

5. Add the required queue setting:

   ```yaml
   queue: default
   ```

6. Review the converted file for unknown keys. v2 will refuse to start if any are present.

7. Validate the converted configuration:

   ```text
   relay validate --config relay.yml
   ```

   Continue only when validation succeeds and prints:

   ```text
   configuration valid
   ```

8. Run the validated v2 configuration in the validation environment for one day.

9. Move 10 percent of production processing to v2. Observe the error rate and processing time for two hours.

10. If the staged rollout meets the established rollout criteria, expand v2 to all production.

## Rollback

Rollback requires restoring both components from the same v1 release:

- the v1 configuration file; and
- the v1 executable.

Do not pass a v2 configuration directly to the v1 executable. Restore the v1 configuration before restarting Relay Runner with v1.