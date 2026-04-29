# 🔄 Reset Audit (Product-Layer Transition)

_Date: 2026-04-28_  
_Baseline reference: `04c70db`_

## What this document is

This is a concise transition log for the reset from runtime-era implementation work to a product/workflow-layer direction.

## Why the reset happened

BlendOps was previously exploring low-level runtime implementation surfaces.

The project direction is now intentionally focused on:

- non-Blender-user workflow design
- intent → plan → validation → handoff product flow
- external runtime dependency assumptions (official Blender MCP Server, official Claude Blender Connector, official Blender CLI reference)

## What changed

- runtime-era implementation was removed from active product direction
- active docs were rewritten around product/workflow outcomes
- historical runtime-era materials were moved under `docs/archive/`

## Boundary after reset

BlendOps does **not** currently ship its own custom CLI/MCP/addon runtime.

BlendOps is the workflow/product layer above external runtime tooling.

## Historical detail policy

Detailed runtime-era command docs, smoke tests, and prior implementation notes remain in `docs/archive/` for historical context only.
They are not active setup or usage guidance.
