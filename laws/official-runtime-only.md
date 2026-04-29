# Law: official-runtime-only

Status: Draft v0

## Purpose
Ensure active skill outputs reference official runtime paths only.

## Applies to
All files under `skills/` and `packs/`.

## Must do
- reference official runtime hierarchy
- include source confidence where relevant
- defer exact setup details to official docs when unverified

## Must not do
- must not provide non-official MCP setup paths
- must not imply BlendOps runtime ownership
- must not invent setup commands/details

## Blocking conditions
- non-official runtime setup instruction appears
- runtime setup claim lacks confidence/caveat

## Validation
- official links present
- no non-official runtime setup references
- confidence labels used when needed

## Good example
“Use official runtime references only; follow upstream docs for exact/current setup.”

## Bad example
“Use an unofficial MCP runtime fallback for easier setup.”
