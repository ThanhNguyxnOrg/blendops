<!--
Thank you for contributing to BlendOps. Please fill in the sections below.
For full contributing guidelines, see CONTRIBUTING.md.
-->

## Summary

<!-- One or two sentences describing what this PR changes and why. -->

## Type of change

- [ ] Docs only (clarification / typo / link fix)
- [ ] New skill, law, pack, adapter, or install target
- [ ] Runtime evidence record under `docs/evals/`
- [ ] CI / tooling change (`scripts/`, `.github/`, `package.json`)
- [ ] Bundle change (`bundles/skill-package/`, `bundles/claude-desktop-manual/`, `bundles/generic-project-local/`)
- [ ] Other (please describe)

## Pre-PR checks

- [ ] `npm run docs:check` passes locally
- [ ] `npm run skills:export` passes locally and produces one ZIP + one Claude Code folder per `skills/*/SKILL.md` (currently 48)
- [ ] No BlendOps-owned CLI / MCP / addon runtime surface reintroduced
- [ ] No arbitrary Python presented as user-facing surface
- [ ] Runtime references use the **2-path + CLI appendix** model (Path 1 = Lab MCP with hosts a/b; Path 2 = community `ahujasid/blender-mcp`; CLI fallback = appendix, documented upstream as first-class Blender CLI surface; no in-repo evidence file yet). See [`docs/runtime-stack-strategy.md`](../docs/runtime-stack-strategy.md).
- [ ] Anthropic Connector is **not** described as standalone (it requires the Lab add-on inside Blender)
- [ ] Blender 5.1+ floor is applied **only** to Path 1 (not Path 2 or CLI fallback)
- [ ] No new claim of runtime / artifact success without an evidence file under `docs/evals/`
- [ ] Anthropic Skills frontmatter spec compliance preserved (`name` + `description` only, no `version`/`status`/`tags`; description ≤ 200 chars; name ≤ 64 chars, kebab-case)
- [ ] Docs updated for any user-facing contract change

## Related issue

<!-- Link any related issue (Closes #X / Refs #X). -->

## Additional notes for reviewers

<!-- Anything special, risk areas, or follow-up items. -->
