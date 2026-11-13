# GLB Handoff Checklist

## Purpose
Define minimum checks before GLB/web handoff claims, pairing `scripts/inspect-glb.mjs` and `scripts/generate-glb-handoff-report.mjs` with `schemas/glb-web-handoff-manifest.schema.json`.

## When to use
In the GLB web handoff reporting stage (`blendops glb-inspect` / `blendops glb-handoff` / `blendops glb-validate-manifest`).

## Checklist
- Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) explicit
- GLB and preview status (`Not Produced | Produced | Verified | Failed`, default `Not Produced`) explicit
- 4-tier validation summary explicit (Container Structural, glTF 2.0 Specification, Visual Quality, Live Runtime)
- Transform, scale (`1 unit = 1m`, `+Y up`), and origin placement assumptions explicit
- Material, texture storage (`bufferView` vs external URI), and compression decoder (`DRACOLoader`, `MeshoptDecoder`, `KTX2Loader`) caveats explicit
- Next verification actions explicit

- Web compression & budget hints explicit: prefer `EXT_meshopt_compression` + WebP (`q85`) or KTX2/Basis (`--texture-compress ktx2`), or `Draco` when decoding speed allows; target `<= 2–5 MB` per hero GLB (`<= 10–20 MB` scene, `<= 50–100` draw calls on mobile web)
- Tone-mapping parity documented: match Blender `Khronos PBR Neutral` with Three.js `NeutralToneMapping` + `SRGBColorSpace`
- Non-web engine hints (if multi-target delivery requested alongside GLB): Godot import suffixes (`-col`, `-colonly`, `-convcolonly`, `-loop`); Unreal FBX/Interchange (`UCX_` collisions, DirectX `-Y` normal, ORM packing); Unity FBX (`Humanoid` root at world origin facing `-Y`)

## Good example
Includes `Runtime status: Not Run` and `Artifact status: Not Produced` (or current-run evidence-backed status) alongside the 4-tier validation summary and decoder setup notes.

## Bad example
Claims handoff complete or marks `Artifact status: Not Run` / `Verified` without artifact evidence.

## Related skill
- [`../SKILL.md`](../SKILL.md)
- [`../../../schemas/glb-web-handoff-manifest.schema.json`](../../../schemas/glb-web-handoff-manifest.schema.json)
- [`../../../docs/examples/glb-web-handoff/README.md`](../../../docs/examples/glb-web-handoff/README.md)
