# Law: official-runtime-only

Status: Draft v0

## Purpose

Ensure active BlendOps workflows use official runtime references only:
- Official Blender MCP Server: https://www.blender.org/lab/mcp-server/
- Official Claude Blender Connector: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Official Blender CLI docs: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## When to use

Use this law for every active setup guide, skill, workflow, recipe, pack, and user-facing runtime explanation.

## Must do

- Prefer official runtime references in active docs.
- Keep setup details high-level when source access is limited.
- Use explicit wording: “Follow upstream official docs for exact/current setup.”
- Keep BlendOps scoped as workflow/product layer above runtime execution.

## Must not do

- Must not route users to non-official MCP runtimes as active setup paths.
- Must not claim BlendOps owns runtime execution.
- Must not invent setup details that were not verified from official docs.

## Blocking conditions

Block completion if any active artifact:
- lacks official runtime references,
- contains non-official MCP setup instructions,
- or claims runtime behavior without confidence labeling.

## Validation

- Official links present in active artifact.
- No non-official MCP setup references in active artifact.
- Source confidence label present (`verified-read` or `linked-only`).

## Failure handling

If official source access is limited:
- keep the official link,
- label source as `linked-only`,
- and avoid procedural details.

## Example language

“BlendOps uses official runtime references only in active guidance. Follow upstream official docs for exact/current setup details.”

## Related skills/workflows

- [../skills/official-runtime-setup-guide.md](../skills/official-runtime-setup-guide.md)
- [../workflows/product-hero-workflow.md](../workflows/product-hero-workflow.md)
