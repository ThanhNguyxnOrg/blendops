

# Law: official-runtime-only

Status: Draft v0

## Purpose

Ensure active skill outputs reference well-defined Blender runtime paths only and never invent or imply a runtime path that does not exist.

## "Official" definition for this law

This law uses the term **"official"** to mean: the runtime path is documented by Anthropic, the Blender Foundation, or its mature published upstream maintainer; the source URL/repo can be linked; and the path is one of the two MCP paths (or the CLI appendix) listed in [`docs/runtime-stack-strategy.md`](../docs/runtime-stack-strategy.md).

The currently recognized paths are:

| Path | Provenance | "Official" status for this law |
|---|---|---|
| **Path 1** Official Blender Lab MCP (Lab add-on + Lab server in Blender; host = Anthropic Blender Connector OR manual MCP client) | Blender Foundation Lab (`bpype/blender_mcp`) for the Blender-side stack; Anthropic for host option (a) | Official — endorsed by Blender Foundation for the Blender side, and by Anthropic for host option (a). Anthropic Connector is **not** a separate runtime; it is one MCP host on top of Lab MCP. |
| **Path 2** Community `ahujasid/blender-mcp` | Community / `ahujasid` (21K+ stars, prior art) | Third-party but **mature and recognized**; treated as a supported path in BlendOps with extra caveats in [`docs/unofficial-runtime-bridges.md`](../docs/unofficial-runtime-bridges.md). |
| **CLI fallback (appendix)** | Blender Foundation | Official source for `blender` CLI, but **BlendOps publisher has not verified this path in-repo** — documented for completeness only, not presented as a peer execution path. |

What this law forbids:

- Inventing a runtime path that is not one of the above.
- Linking to non-public, non-listed, or speculative MCP forks.
- Implying that BlendOps owns or ships a runtime.
- Describing the Anthropic Connector as if it were standalone or as if it bypassed the Blender Lab MCP add-on. (It does not — Anthropic's tutorial step 2 explicitly tells you to install the Lab add-on inside Blender.)
- Applying a Blender version floor incorrectly across paths (the 5.1+ floor is bound to Path 1 because of the Lab add-on manifest; Path 2 is 3.0+; CLI is 4.2+ recommended).
- Presenting CLI fallback as a publisher-verified peer of Path 1 / Path 2.

What this law permits (clarified 2026-05-08, updated for the 2-path model):

- Documenting Path 2 with full setup instructions and tool surface, because it is the only currently user-verified BlendOps runtime path and the de facto standard for many MCP clients on older Blender.
- Listing both Path 1 (with both host options a/b) and Path 2 side-by-side in user-facing docs.
- Recording per-path verification status (`Not Verified`, `Read-only smoke`, `User-reported verified`, `Verified`, `Not Run`).

## Applies to

All files under `skills/` and `packs/`.

## Must do

- name the runtime path explicitly (Path 1 or Path 2) when discussing runtime steps; for Path 1 also name the host option (a — Anthropic Connector, b — manual MCP client) when relevant
- include source confidence (`verified-read`, `linked-only`, `unknown`) per claim
- defer exact setup details to the upstream tutorials when unverified
- treat CLI fallback as appendix, not peer

## Must not do

- must not invent a runtime path outside the recognized set
- must not imply BlendOps owns a runtime
- must not invent setup commands/details
- must not describe Anthropic Connector as standalone or as not requiring the Lab add-on inside Blender
- must not loosen the Blender 5.1+ floor for Path 1 (regardless of host option)
- must not call Path 2 "experimental" in a way that implies engineering immaturity (it is a 21K+ star prior-art project; the caveat is provenance, not maturity)
- must not present CLI fallback as publisher-verified

## Blocking conditions

- runtime setup instruction references a path outside the recognized set
- runtime setup claim lacks confidence/caveat
- a per-path property is mis-attributed (e.g., Anthropic Connector framed as Blender-4.2+-enough)

## Validation

- official source links present per path mentioned (Anthropic tutorial + Lab MCP for Path 1; `ahujasid/blender-mcp` for Path 2; Blender CLI docs for CLI appendix)
- no invented runtime path references
- confidence labels used when needed
- per-path Blender-version requirement is correctly attributed (Path 1 → 5.1+; Path 2 → 3.0+; CLI → 4.2+ recommended, not verified)

## Good example

"Path 1 with host option (a) Anthropic Connector requires Blender 5.1+ because the Lab MCP add-on it depends on declares `blender_version_min = 5.1.0`. Source confidence: linked-only for Anthropic tutorial, linked-only for Lab MCP page."

## Bad example

"Use the Anthropic Connector path; Blender 4.2+ is enough." (mis-attributes the version floor; ignores that Anthropic's own tutorial tells you to install the Lab add-on which requires 5.1+)
