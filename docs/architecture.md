# Architecture

## Target architecture (product-layer direction)

Non-Blender user
→ AI coding tool
→ BlendOps workflow/product layer
→ external Blender MCP/runtime adapter
→ Blender
→ preview/export/artifacts
→ web/app/game usage guidance

## Layer responsibilities

### Non-Blender user
- expresses creative intent in natural language
- cares about outcome, not Blender internals

### AI coding tool
- orchestrates prompts, calls tools, and synthesizes outputs

### BlendOps workflow/product layer
- translates intent into safe structured workflow
- defines validation criteria and output expectations
- returns plain-language handoff guidance

### External runtime layer
- uses official Blender runtime behavior and reference MCP bridge patterns
- executes low-level scene operations outside BlendOps core product abstraction

### Blender
- performs scene mutation, rendering, and export

## Reset note

The old internal custom CLI/MCP/addon implementation was removed from active codebase in this reset.

A new internal adapter should only be rebuilt later if product requirements explicitly justify it.
