# Skill: official-runtime-setup-guide

Status: Draft v0

## Purpose

Guide users through official runtime prerequisites before using BlendOps workflows.

## When to use

- first-time setup
- runtime prerequisites unclear
- user asks how to prepare official runtime paths

## Inputs

- user environment (OS/toolchain)
- selected runtime path preference
- current setup status

## Outputs

- official runtime setup options summary
- required prerequisite checklist
- source-confidence note (`verified-read` or `linked-only`)

## Official runtime assumptions

- Official Blender MCP Server: https://www.blender.org/lab/mcp-server/
- Official Claude Blender Connector: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Official Blender CLI docs: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## Workflow steps

1. Confirm user goals and runtime context.
2. Present official runtime hierarchy.
3. Provide high-level path selection guidance.
4. Direct user to official upstream docs for exact/current setup.
5. Record source confidence and unresolved setup uncertainty.

## Safety rules

- Must keep runtime guidance official-only.
- Must avoid invented setup commands/details.
- Must state BlendOps is workflow layer, not runtime provider.

## Validation checklist

- [ ] Official runtime links included.
- [ ] No non-official MCP setup paths referenced.
- [ ] Source confidence label included.
- [ ] User-facing next steps are clear.

## Failure handling

If official source details are inaccessible in-session:
- keep links,
- label as `linked-only`,
- and tell users to follow upstream docs for exact/current steps.

## User-facing response template

- Selected official runtime path
- Why this path fits your context
- What to do next in official docs
- What BlendOps will do after setup is ready

## Examples

Example (high confidence):
- “Use the official Claude Blender Connector tutorial for Claude-side setup, then return with confirmation.”

Example (linked-only):
- “Official Blender MCP page is linked; follow the upstream page for exact/current setup details.”

## Non-goals

- no runtime code implementation
- no installer creation
- no runtime ownership claims

## Verification

- Runtime path documented
- Official links present
- Confidence label present
- No prohibited references detected
