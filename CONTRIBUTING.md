# Contributing to BlendOps

Thanks for contributing ❤️

BlendOps is currently MVP-stage and optimized for **safe, inspectable Blender automation**.

## Ground Rules

1. **No arbitrary Python execution paths** by default.
2. Keep changes **small and vertical-slice oriented**.
3. Preserve structured JSON response envelope:
   - `ok`, `operation`, `message`, `data`, `warnings`, `next_steps`
4. Update docs when behavior changes.

## Local Setup

```bash
git clone https://github.com/ThanhNguyxnOrg/blendops.git
cd blendops
npm install
npm run typecheck
npm run build
```

## Branching

- Create feature branches from `main`
- Suggested naming:
  - `feat/object-transform`
  - `fix/bridge-timeout-message`
  - `docs/manual-test-update`

## Pull Request Checklist

Before opening PR:

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] No arbitrary execution exposure introduced
- [ ] README/docs updated if command/tool surface changed
- [ ] Changes are scoped and reversible

## Commit Guidance

Prefer focused commits by concern:

- schemas/core changes
- bridge/addon changes
- cli/mcp wiring
- docs updates

## Reporting Bugs

Please include:

- OS + Node version
- Blender version
- Command/tool invoked
- Full JSON output (including `warnings`)
- Expected vs actual behavior

Open an issue in this repo with reproducible steps.

## Feature Requests

When proposing features, include:

- user workflow
- safety considerations
- command/tool contract shape
- minimal vertical slice proposal

---

Questions? See [SUPPORT.md](./SUPPORT.md).
