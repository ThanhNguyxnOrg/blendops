# Attempt record template

Use this template with `verifying-before-handoff` to record chronological, secret-free provenance for Path 1 (Lab MCP), Path 2 (`mcp-for-blender`), or CLI fallback runs. Save completed reports under `docs/evals/` and link them in `docs/evals/README.md`.

```md
# <Path> Runtime Attempt Record — <Host or Runner> — YYYY-MM-DD

## A. Summary
Path: Path 1 Lab MCP (Blender 5.1+) | Path 2 community mcp-for-blender (Blender 3.0+, non-release) | CLI fallback appendix
Host: <Claude Desktop (a) Connector | Claude Desktop (b) manual | Cursor | Codex | Headless shell>
Goal: <read-only smoke | scene mutation | render preview | GLB export | batch CLI>
Date/time (UTC): <YYYY-MM-DDTHH:MM:SSZ>
Operator: <name or handle>

## B. Versions & config provenance
Blender (`blender --version`): <exact version string or unrecorded>
Add-on / bridge package: <Lab MCP add-on version (min 5.1.0) | mcp-for-blender version/commit | N/A>
MCP server / launcher: <`.mcpb` filename or commit | `uvx mcp-for-blender` version | `blender --background`>
MCP host / client version: <product + version>
Bridge listener port check (`localhost:9876`): <single active bridge confirmed | conflict noted | N/A>

## C. Actions chronology (secrets & private paths redacted)
1. <HH:MM:SSZ — exact read-only preflight or command attempted>
2. <HH:MM:SSZ — MCP tool name or CLI command called with redacted workspace paths>
3. <HH:MM:SSZ — observed completion, timeout, or termination point>

## D. Signals observed
- Expected: <e.g., `get_blendfile_summary_path_info` returned scene name, or exit code 0>
- Unexpected: <e.g., connection refused on `localhost:9876`, add-on disabled, or `none`>
- Redacted log snippet: <short error/stdout excerpt with home paths, tokens, and env vars removed>

## E. Truth labels (downgrade-only)
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed
Evidence pointers: <redacted repo-relative or sanitized file paths, or `none`>

## F. Limitations, redactions & next routing
Secrets removed: Yes (trusted sandbox hygiene verified; no API keys, bearer tokens, or private home paths)
Constraints / caveats:
- <If Path 1 host (a): Connector is not standalone; requires Lab MCP add-on in Blender 5.1+>
- <If Path 2: third-party maintainer stack (`mcp-for-blender`); never treated as official Anthropic/Blender release evidence>
- <If CLI appendix: batch/stateless execution record only>
Next routing: <verifying-before-handoff | troubleshooting-blender-output | setting-up-blender-runtime | verifying-before-handoff>
```

## Redaction & downgrade checklist
- Never upgrade `Runtime status` to `Verified` from partial logs or memory without observed read-only/execution proof.
- Always default `Artifact status` to `Not Produced`; never assign `Attempted` to artifacts (use `Not Produced` or `Failed`), and route any output files on disk through `verifying-before-handoff`.
- Strip OS home directories, user tokens, license keys, and `.mcp` auth headers before saving under `docs/evals/`.
