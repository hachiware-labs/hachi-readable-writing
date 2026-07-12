# Relay Runner v1 to v2 Configuration Migration Guide

This guide covers only the known configuration changes. Do not assume that unlisted v1 keys remain valid in v2: v2 refuses to start if it encounters unknown configuration keys.

## Configuration conversion

### Before: v1

```yaml
workers: 8

retry:
  count: 3
  delay_seconds: 10
```

### After: v2

```yaml
concurrency: 8

retry:
  max_attempts: 4
  initial_delay: 10s

queue: default
```

Apply these conversions:

| v1 | v2 | Conversion |
|---|---|---|
| `workers` | `concurrency` | Keep the same value. |
| `retry.count` | `retry.max_attempts` | Add 1 because v2 includes the first attempt. |
| `retry.delay_seconds` | `retry.initial_delay` | Convert the number of seconds to a duration string, such as `10` → `10s`. |
| — | `queue` | Add `queue: default`. |

For example, `retry.count: 3` means one initial attempt plus three retries. Its v2 equivalent is therefore `retry.max_attempts: 4`.

## Validation

Validate the converted file before starting Relay Runner v2:

```sh
relay validate --config relay.yml
```

Successful validation prints:

```text
configuration valid
```

Do not proceed unless validation succeeds. Because v2 rejects unknown keys, any remaining unsupported v1 key must be resolved before rollout. No migration behavior for keys beyond those listed above is established by this guide.

## Staged rollout

1. Convert the v1 configuration to v2.
2. Validate it with `relay validate --config relay.yml`.
3. Run v2 with the converted configuration in the validation environment for one day.
4. Move 10% of production traffic or capacity to v2.
5. Observe error rate and processing time for two hours.
6. If the observed results are acceptable under your operational criteria, expand v2 to all production.

Keep the v1 executable and its original configuration available throughout the rollout.

## Rollback

Rollback must restore these two artifacts together:

- The v1 executable
- The corresponding v1 configuration file

Do not pass a v2 configuration directly to the v1 executable. In particular, v1 should not be expected to understand `concurrency`, `retry.max_attempts`, `retry.initial_delay`, or the v2 configuration’s other semantics.