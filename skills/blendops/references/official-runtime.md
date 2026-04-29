# Reference: Official Runtime

Status: Draft v0 reference

## Official runtime hierarchy

1. Official Blender MCP Server
   - https://www.blender.org/lab/mcp-server/
2. Official Claude Blender Connector tutorial
   - https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
3. Official Blender CLI docs
   - https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## Source confidence labels

- `verified-read`: source page was fetched/read in this environment
- `linked-only`: source link confirmed, page not fully fetched/read in this environment
- `mixed`: combination of both in one output

## Current known confidence snapshot

- Blender MCP page — linked-only; confidence: medium
- Claude Blender Connector tutorial — fetched/read; confidence: high
- Blender CLI docs — linked-only; confidence: medium

## Policy

- linked-only sources may be referenced, but setup details must remain high-level
- do not invent commands/details for linked-only sources
- direct users to official upstream docs for exact/current setup
