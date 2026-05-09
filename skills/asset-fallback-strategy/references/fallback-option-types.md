# Fallback option types

## Type A: Replace from open-license source

Find a CC0 / MIT / similar-permission alternative.

**Pros**: cheapest, no legal friction.
**Cons**: brief match may be approximate.

Sources: polyhaven.com, ambientcg.com, free Sketchfab CC0 tag, BlendSwap CC0 tag.

## Type B: Replace from paid licensed source

Buy a commercial license that fits the brief.

**Pros**: exact brief match; clear license.
**Cons**: cost; takes time to source.

Sources: TurboSquid, CGTrader, Sketchfab Store, brand-specific stock.

## Type C: Procedural / Geometry Nodes / shader-based

Build the asset programmatically inside Blender.

**Pros**: free, brand-aligned, fully controlled.
**Cons**: requires modeling skill; takes time.

Best for: textures (procedural noise), repeating geometry (Geometry Nodes), simple shapes.

## Type D: Generative (AI / photogrammetry service)

Use a service to generate / capture the asset.

**Pros**: novel; can match brief precisely.
**Cons**: license terms vary; quality varies; time varies.

Sources: Meshy, Luma AI, Polycam, Photogrammetry pipelines.

**Always run the AI-generated output through `asset-license-checker`** to verify the tool's commercial-use terms.

## Type E: Drop with caveat

Remove the asset; document the visual change.

**Pros**: zero time / cost.
**Cons**: deliverable changes; brief may be diluted.

Use when: deadline-critical, no budget for paid, no time for procedural / generative.

## Combination

Sometimes the best fallback combines types (e.g., Type A texture + Type C procedural displacement).

## Related skill
`../SKILL.md`
