# Three.js / R3F Handoff Notes

## Purpose
Provide concise assumptions and integration references for Three.js (`r150+`) and React Three Fiber (`@react-three/fiber` + `@react-three/drei`) web delivery planning.

## When to use
When a user requests GLB web handoff notes or viewer integration snippets for Three.js or React Three Fiber.

## Notes
- State coordinate (`+Y up, +Z forward, -X right`), unit scale (`1 unit = 1 meter`), and origin assumptions explicitly.
- Reference the canonical integration modules in [`../../../docs/examples/glb-web-handoff/README.md`](../../../docs/examples/glb-web-handoff/README.md) (`threejs-glb-viewer.mjs` and `r3f-glb-viewer.tsx`).
- Document required compression decoders (`DRACOLoader` for `KHR_draco_mesh_compression`, `MeshoptDecoder` for `EXT_meshopt_compression`, `KTX2Loader` for `KHR_texture_basisu`).
- Include caveat-first language: loading a `.glb` in Three.js or R3F verifies client-side parsing only and does not replace visual quality review (`Tier 3`) or live Blender runtime verification (`Tier 4`).

## Good example
Lists scale/origin/decoder assumptions, references `blendops glb-handoff`, and states next verification tests.

## Bad example
Claims guaranteed visual or production compatibility without testing in the target viewer.

## Related skill
- [`../SKILL.md`](../SKILL.md)
- [`../../../docs/examples/glb-web-handoff/README.md`](../../../docs/examples/glb-web-handoff/README.md)
