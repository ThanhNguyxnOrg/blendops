---
name: official-runtime-setup-guide
description: Guide the user/agent to official Blender runtime prerequisites without installing or running runtime.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# official-runtime-setup-guide

## Purpose
Guide official runtime prerequisite understanding before any runtime execution claim.

## When to use
- beginning of workflow
- runtime assumptions unclear
- setup confidence must be recorded

## When not to use
- to perform runtime installation automatically
- to claim runtime is working without evidence

## Inputs
- target environment/tool
- known runtime context
- user preference (project-local/global attachment for docs only)

## Outputs
- official runtime path summary
- source confidence labels
- setup prerequisite checklist
- next-step links

## Required laws
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md

## Official runtime boundary
Use official references only:
1. https://www.blender.org/lab/mcp-server/
2. https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
3. https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

This skill does not install Blender and does not run Blender.

## Workflow steps
1. Identify environment and known runtime state.
2. Present official runtime hierarchy.
3. Mark confidence (`verified-read` / `linked-only` / `mixed`).
4. Direct to upstream official docs for exact/current setup.

## Validation checklist
- [ ] official links included
- [ ] confidence labels included
- [ ] no non-official runtime setup path used

## Failure handling
If details are unverified, mark linked-only and avoid procedural specifics.

## User-facing response template
- Runtime options
- Confidence per source
- What is verified
- What to do next

## Non-goals
- runtime install automation
- runtime execution
- custom CLI/MCP/addon ownership

## References
- ../../laws/official-runtime-only.md
- ../../references/official-runtime.md (if present in attached collection)
