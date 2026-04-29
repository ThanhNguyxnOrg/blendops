# Reference Runtime

> This file summarizes runtime boundaries. For concise prerequisite setup flow, see [External runtime setup](./external-runtime-setup.md).

BlendOps uses external runtime primitives rather than shipping a duplicate low-level runtime.

## How official Blender CLI fits

Official Blender CLI provides the process/runtime execution layer:

- process launch and runtime behavior
- command-line automation modes (GUI/background and ordered arguments)
- render/export and Python startup hooks as Blender-native capabilities

Upstream docs:
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## How `ahujasid/blender-mcp` fits

`ahujasid/blender-mcp` is a proven reference pattern for AI ↔ Blender MCP bridging (MCP server + Blender addon bridge model).

Upstream repository:
- https://github.com/ahujasid/blender-mcp

BlendOps references this prior art and does not vendor or clone it into active runtime code.

## Important interface boundary

`ahujasid/blender-mcp` exposes arbitrary Python execution capabilities.

BlendOps should avoid arbitrary Python as its final user-facing product interface, and instead focus on constrained workflow-level intent and safe structured execution design.

## Setup path (authoritative)

Use [External runtime setup](./external-runtime-setup.md) as the BlendOps setup overview.

- This repo summarizes prerequisites and boundaries only.
- Exact/current install and configuration details should be followed from upstream docs.

## BlendOps role

BlendOps should summarize runtime assumptions and redirect to upstream setup docs, while focusing its own implementation on the product/workflow layer above runtime.
