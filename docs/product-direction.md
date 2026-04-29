# BlendOps Product Direction

BlendOps is being rebuilt as an **AI-native workflow/product layer** for people who do not know Blender.

Before using BlendOps workflow specs, complete [External runtime setup](./external-runtime-setup.md).

## What BlendOps is not

BlendOps is not another Blender CLI.

BlendOps is not another raw Blender MCP.

BlendOps is not a custom runtime implementation project.

## What BlendOps is

BlendOps is a workflow/product layer above runtime primitives, designed for non-Blender users and AI tool orchestration.

Its value is in:

- translating creative intent into safe workflow plans
- structuring execution and validation criteria
- producing understandable outputs for web/app/game usage

## Runtime assumptions

- Official Blender MCP Server is the preferred Blender-side runtime target when available.
- Official Claude Blender Connector is the preferred Claude-side connector path.
- Official Blender CLI remains the low-level runtime/process reference.

BlendOps should reference official runtime sources as external dependencies instead of rebuilding runtime surfaces by default.

Runtime setup sequence is documented in [External runtime setup](./external-runtime-setup.md). Product docs should link there instead of duplicating detailed setup steps.

## Non-goals for this reset

- Do not clone or vendor external runtime implementations into active BlendOps runtime scope.
- Do not copy large sections of upstream docs.
- Do not expose arbitrary Python as the final BlendOps product interface.

## Reset status

Old custom runtime implementation (BlendOps-owned CLI/MCP/addon/runtime operation surface) has been removed from the active codebase.

Historical artifacts remain recoverable from git history and are preserved in `docs/archive/` where helpful for context.

## Implementation principle going forward

Future implementation must be driven by **product workflow requirements** (non-Blender-user outcomes), not by low-level tool copying inertia.
