# Blocked start playbook

## Brief incomplete

- Stop execution skills.
- Hand off to `intent-to-3d-brief-writer` with missing slots listed.

## Runtime unknown but mutation requested

- Require explicit path selection via `runtime-path-picker`.
- Then `runtime-setup` + `runtime-readiness`.

## Asset licenses unknown

- Hand off to `asset-license-checker` after discovery list exists.

## Conflicting outputs

- Force prioritization using `scope-guard`.

## Bridge conflict suspected

- `bridge-conflicts` before any MCP instructions.

Never bypass Blocked rows by assuming upstream success.
