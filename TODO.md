# BlendOps Roadmap (Pivoted)

_Last updated: 2026-04-28_

This roadmap replaces broad-feature framing with a staged product path centered on safe AI-native workflows.

## Phase 0 — Prune / Recenter Foundation

- [ ] Recenter product messaging around minimal safe runtime foundation
- [ ] Classify repo areas into KEEP/FREEZE/ARCHIVE/DELETE
- [ ] De-emphasize broad low-level tooling in primary docs
- [ ] Remove clearly stale/misleading artifacts

## Phase 1 — Runtime Parity Baseline

Goal: stable runtime parity baseline with official Blender CLI behavior + proven prior-art communication patterns.

- [ ] Maintain reliable managed bridge lifecycle (`start/status/logs/stop`)
- [ ] Keep typed MCP + CLI entrypoints aligned
- [ ] Preserve request correlation (`request_id`, `receipt`)
- [ ] Keep doctor/UAT/check scripts passing in supported environments

## Phase 2 — First Non-Blender-User Golden Path

Goal: one end-to-end flow a non-Blender user can complete through an AI client.

- [ ] Prompt intent → safe operation sequence
- [ ] Dry-run + explicit execution gate
- [ ] Deterministic, non-Blender-language outcome summary
- [ ] Minimal troubleshooting path for failures

## Phase 3 — Prompt-to-Scene Recipes

Goal: reusable safe scene plans for common intents.

- [ ] Curated recipe templates (typed operations only)
- [ ] Safety and validation overlays for each recipe
- [ ] Repeatable dry-run-first execution loop

## Phase 4 — Prompt-to-Web-3D Output

Goal: bridge authored 3D output toward web consumption workflows.

- [ ] Asset/output handoff conventions
- [ ] Validation hints for downstream web pipelines
- [ ] Human-readable instructions for non-Blender users

## Phase 5 — Packaging & Product Hardening

Goal: production-readiness and maintainability.

- [ ] Stability hardening for runtime lifecycle paths
- [ ] Compatibility matrix and upgrade guidance
- [ ] Better operational telemetry/diagnostics docs
- [ ] Release-quality docs and support paths

## Safety Invariants (all phases)

- No arbitrary Python endpoint
- No raw shell exposure to AI surface
- No unrestricted Blender flag passthrough
- No unverifiable runtime claims
