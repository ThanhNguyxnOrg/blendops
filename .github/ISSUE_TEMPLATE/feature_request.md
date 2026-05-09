---
name: Feature request
about: Propose a new skill / law / install target / adapter / docs improvement.
title: "[feat] "
labels: enhancement
assignees: ''
---

## What you're trying to do

<!-- The non-Blender-user workflow this change would enable or improve. -->

## What current docs / flow are missing

<!-- Why the existing skills / docs / install flow are not enough. Cite paths. -->

## Proposed minimal change

<!-- Smallest possible change that addresses the gap. -->

## Type of contribution

- [ ] New skill (`skills/<name>/SKILL.md` + `EVAL.md`)
- [ ] New law (`laws/<name>.md`)
- [ ] New install target (`docs/install/<target>.md`)
- [ ] New adapter (`docs/adapters/<target>.md`)
- [ ] New bundle fixture (`bundles/<name>/`)
- [ ] Docs improvement (clarification / restructure)
- [ ] Tooling improvement (`scripts/` / CI)
- [ ] Other

## Safety / scope implications

- Affects which laws (`laws/*`)?
- Does it touch the runtime model? (Path 1 / Path 2 / CLI fallback)
- Does it require runtime evidence to land?
- Does it change CI guards in `scripts/check-docs.mjs`?

## Acceptance check

- [ ] No new BlendOps-owned CLI / MCP / addon runtime surface
- [ ] No arbitrary Python as user-facing surface
- [ ] Runtime claims (if any) backed by an evidence file under `docs/evals/`
- [ ] Anthropic Skills frontmatter spec compliant (if adding a skill)

## Pre-flight checklist

- [ ] I searched existing issues / PRs for duplicates.
- [ ] I read [`docs/README.md`](../../docs/README.md) and the relevant section.
- [ ] I read [`CONTRIBUTING.md`](../../CONTRIBUTING.md) before opening.
