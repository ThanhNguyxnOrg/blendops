# Blocked start playbook

## Brief incomplete

- Stop execution skills.
- Hand off to `intent-to-3d-brief-writer` with missing slots listed.

## Runtime unknown but mutation requested

- Require explicit path selection via `runtime-path-picker`.
- Then `official-runtime-setup-guide` + `official-runtime-readiness-checker`.

## Asset licenses unknown

- Hand off to `asset-license-checker` after discovery list exists.

## Conflicting outputs

- Force prioritization using `blender-scope-boundary-enforcer`.

## Bridge conflict suspected

- `runtime-bridge-conflict-resolver` before any MCP instructions.

Never bypass Blocked rows by assuming upstream success.
