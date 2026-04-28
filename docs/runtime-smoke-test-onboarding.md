# 🧪 Runtime Smoke Test: Onboarding Validation

Date: 2026-04-28

## Scope

Validated BlendOps onboarding from a fresh-user perspective, including install, build, docs checks, operations checks, and automated UAT.

## Fresh clone environment

- Clone URL: `https://github.com/ThanhNguyxnOrg/blendops.git`
- Fresh clone path: `D:\Code\blendops-onboarding-smoke`

## Fresh clone results

- `npm install`: ✅ pass
- `npm run build`: ✅ pass
- `npm run docs:check`: ✅ pass
- `npm run operations:check`: ✅ pass
- `npm run uat`: ✅ pass

UAT summary source:
- `D:\Code\blendops-onboarding-smoke\.tmp\uat-full\summary.json`

UAT summary:
- `total_steps`: 12
- `passed`: 12
- `failed`: 0
- `all_passed`: true
- `bridge-start elapsed_ms`: 5184

## Onboarding docs checklist

Checklist validated against:
- `README.md`
- `docs/install.md`
- `docs/ai-agent-usage.md`
- `docs/manual-test.md`
- `docs/observability.md`
- `docs/README.md`
- `examples/prompts/README.md`
- `package.json`

Validated topics:
- What BlendOps is
- Requirements
- Quick install and build
- `npm run uat`
- CLI examples
- MCP setup pointer
- Addon fallback pointer
- Known limitations
- Guidance that `bridge start` may return `ok: true` while Blender GUI remains open (expected)

## Main repo verification results

In `D:\Code\blendops`:
- `npm run docs:check`: ✅ pass
- `npm run operations:check`: ✅ pass
- `npm run clean`: ✅ pass
- `npm run typecheck`: ✅ pass
- `npm run build`: ✅ pass
- `npm run uat`: ✅ pass

Main UAT summary source:
- `D:\Code\blendops\.tmp\uat-full\summary.json`

Main UAT highlights:
- 12/12 steps passed
- no hang/timeout observed
- `bridge-start elapsed_ms`: 4167

## Limitations observed

- Blender 4.2 GLB/GLTF export still requires GUI bridge mode.
- Background mode remains limited/unvalidated for persistent bridge runtime.
- Successful `undo.last` runtime path remains pending explicit validation (safe-failure path already validated).

## Docs updates made

- No onboarding gaps required additional doc edits in this validation pass.
- Runtime evidence doc added: `docs/runtime-smoke-test-onboarding.md`.
