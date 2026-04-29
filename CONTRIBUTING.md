# Contributing to BlendOps

Thanks for contributing ❤️

BlendOps is currently focused on a **product/workflow layer** for non-Blender users.

## Scope

Contributions should improve one or more of:

- product/workflow docs clarity
- scene/workflow planning contracts
- validation and handoff guidance
- safety boundaries for user-facing AI workflows

## Ground rules

1. Do not reintroduce old BlendOps-owned CLI/MCP/addon runtime surfaces; only official Blender CLI (runtime reference) and GitHub CLI (`gh`) may be referenced where relevant.
2. Do not expose arbitrary Python as the final BlendOps user-facing interface.
3. Keep changes small, reviewable, and reversible.
4. Update docs whenever behavior or contracts change.

## Local setup

```bash
git clone https://github.com/ThanhNguyxnOrg/blendops.git
cd blendops
npm install
```

If your change includes code, run relevant project checks before opening PR.

## Branching

- branch from `main`
- use descriptive names (e.g., `docs/cleanup-readme`, `docs/workflow-contract-polish`)

## Pull request checklist

- [ ] change is aligned with product/workflow direction
- [ ] no runtime-era command surface reintroduced
- [ ] docs updated for user-facing contract changes
- [ ] scope is focused and clearly explained

## Reporting bugs

Please include:

- environment (OS, Node, Blender)
- affected docs/feature
- repro steps
- expected vs actual behavior

## Feature requests

Please include:

- target user workflow
- why current docs/flow are insufficient
- proposed minimal change
- safety implications

Questions? See [SUPPORT.md](./SUPPORT.md).
