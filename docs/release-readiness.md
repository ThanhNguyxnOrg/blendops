# Release Readiness

Status: Draft v0 (not production)
Date: 2026-04-29

## Current status

BlendOps is a Draft v0 official-runtime Blender workflow/skill collection.

## What is ready

- Official-runtime-only boundaries are active across skills/laws/packs.
- Root collection exists: `skills/`, `laws/`, `packs/`.
- Skill depth enrichment and gate review reports exist.
- Adapter architecture and dry-run install eval are complete.
- Docs CI (`npm run docs:check`) is passing.

## What is not ready

- Official runtime manual eval is blocked/not executed in a runtime-available environment.
- Claude Code native install path confidence remains environment-dependent.
- Product-hero v0 pack remains Draft v0.
- No fresh BlendOps runtime artifact evidence (preview/render/GLB) has been produced in official-runtime manual eval.

## Open warnings

1. Claude Code native path confidence is not universal across environments.
2. Official runtime manual execution evidence is missing.
3. Adapter install dry-run ended with Warn, not full Pass.

## Required before v0.1.0 draft tag

- run manual install beta in disposable repos and resolve adapter friction
- run official-runtime manual eval with evidence capture
- verify rollback procedures end-to-end
- resolve or explicitly accept remaining warnings

## Required before public stable claim

- multiple successful runtime eval runs with evidence
- artifact-truth reporting validated repeatedly
- install adapters validated across at least two environments
- no unresolved high-risk warnings

## Release blockers

- missing official runtime manual eval evidence
- adapter install dry-run still warns on native-path certainty

## Non-blocking warnings

- some skill examples can still be expanded for edge audiences
- confidence labels may require tighter environment scoping

## Manual beta checklist

- [ ] generic-root install dry-run in disposable repo
- [ ] Claude Code project-local install dry-run in disposable repo
- [ ] Claude app/Desktop setup text-only walkthrough
- [ ] verify no runtime installed/run during install tests
- [ ] verify rollback instructions are executable
- [ ] update install docs from beta findings
