# Changelog

All notable changes to BlendOps are documented here. BlendOps is a **Draft v0**
content layer (docs + skills + laws + packs); it does not own runtime execution,
which is redirected to upstream (Blender Lab MCP, Anthropic Connector,
community `mcp-for-blender`, Blender CLI).

## [v0.8.0-draft] — 2026-10-16

Skills-layer review hardening + runtime consistency. `npm run ci` green
(`docs:check` 344 files, `skills:export` 48 skills).

### Changed
- All 48 skills hardened through external review packets: role boundaries,
  truth-state discipline (`Not Run` runtime / `Not Produced` artifact,
  downgrade-only), cross-skill handoff wiring.
- Runtime docs swept to the 2-path + CLI appendix model (Path 1 Lab MCP in
  Blender 5.1+ via Anthropic Connector or manual host; Path 2 community
  `mcp-for-blender`; CLI appendix-only, never a peer path).
- Review gates, acceptance criteria, and verification skills aligned with the
  2-path model; nonexistent MCP tool names fixed.
- Brand: logo mark + auto dark/light README header + social preview theme.
- Fixed stale baseline-16 counts to the 48-skill inventory across docs.

### Notes
- Runtime status stays `Not Run`; artifacts stay `Not Produced` — no runtime
  execution or artifact claims in this repo.

## [v0.7.0-draft]
- 26 install targets.

## [v0.6.0-draft]
- 20 install targets.

## [v0.5.0-draft]
- 48 skills.

## [v0.4.0-draft]
- 40 skills.

## [v0.3.0-draft]
- 32 skills.

## [v0.2.0-draft]
- 24 skills.

## [v0.1.0-draft]
- 16 baseline skills.
