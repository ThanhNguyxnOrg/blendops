# Law: official-runtime-only

Status: Draft v0

## Purpose
Ensure active skill outputs reference well-defined Blender runtime routes only and never invent or imply a route that does not exist.

## "Official" definition for this law

This law uses the term **"official"** to mean: the runtime route is documented by either Anthropic, the Blender Foundation, or its mature published upstream maintainer; the source URL/repo can be linked; and the route is one of the four routes listed in [`docs/runtime-stack-strategy.md`](../docs/runtime-stack-strategy.md).

The four currently recognized routes are:

| Route | Provenance | "Official" status for this law |
|---|---|---|
| **Route A** Anthropic Blender Connector | Anthropic | Official — endorsed by Anthropic. |
| **Route B** Blender Foundation MCP Server (`bpype/blender_mcp`) | Blender Foundation Lab | Official — endorsed by the Blender Foundation. |
| **Route C** Community Blender MCP (`ahujasid/blender-mcp`) | Community / `ahujasid` (21K+ stars, prior art) | Third-party but **mature and recognized**; treated as a supported route in BlendOps with extra caveats in [`docs/unofficial-runtime-bridges.md`](../docs/unofficial-runtime-bridges.md). |
| **Route D** Official Blender CLI | Blender Foundation | Official — direct Blender executable. |

What this law forbids:

- Inventing a runtime route that is not one of these four.
- Linking to non-public, non-listed, or speculative MCP forks.
- Implying that BlendOps owns or ships a runtime.
- Describing one route's properties (e.g., min Blender version) as if they applied to a different route.

What this law permits (clarified 2026-05-08):

- Documenting Route C with full setup instructions and tool surface, because it is the only currently user-verified BlendOps runtime route and the de facto standard for many non-Claude MCP clients.
- Listing all four routes side-by-side in user-facing docs.
- Recording per-route verification status (`Not Verified`, `Ambiguous`, `User-reported verified`, `Verified`, `Not Run`).

## Applies to
All files under `skills/` and `packs/`.

## Must do
- name the runtime route explicitly when discussing runtime steps (Route A, Route B, Route C, or Route D)
- include source confidence (`verified-read`, `linked-only`, `unknown`) per claim
- defer exact setup details to the upstream tutorial when unverified

## Must not do
- must not invent a runtime route outside the four listed above
- must not imply BlendOps owns a runtime
- must not invent setup commands/details
- must not apply Route B's Blender 5.1+ requirement to Routes A, C, or D
- must not call Route C "experimental" in a way that implies engineering immaturity (it is a 21K+ star prior-art project; the caveat is provenance, not maturity)

## Blocking conditions
- runtime setup instruction references a route outside the four listed above
- runtime setup claim lacks confidence/caveat
- a per-route property is mis-attributed (e.g., 5.1+ requirement applied to Route A)

## Validation
- official source links present per route mentioned
- no invented runtime route references
- confidence labels used when needed
- per-route Blender-version requirement is correctly attributed

## Good example
"Route A (Anthropic Blender Connector) requires Blender 4.2+ per Anthropic's tutorial; that is different from Route B which requires 5.1+. Source confidence: linked-only for Route A, linked-only for Route B."

## Bad example
"Use the official Blender Connector path; it requires Blender 5.1+." (conflates Route A and Route B; mis-attributes the 5.1+ requirement)
