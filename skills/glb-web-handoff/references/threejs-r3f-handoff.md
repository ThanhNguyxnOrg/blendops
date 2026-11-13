# Three.js / R3F Handoff Notes

## Purpose
Provide concrete integration conventions and verification boundaries for Three.js (`r155+`) and React Three Fiber (`@react-three/fiber` + `@react-three/drei`) web delivery planning.

## When to use
Whenever a user requests GLB web handoff notes, `<Canvas>` setup defaults, or viewer integration references for Three.js or React Three Fiber.

## Integration & Color-Parity Contract
1. **Coordinate, Scale & Origin**: Document explicit glTF convention (`+Y up, +Z forward, -X right`), metric scale (`1 unit = 1 meter`), and pivot origin (base center `y = 0` after Blender `+Z → +Y` export transform).
2. **Color-Management Parity**: Match Blender `Khronos PBR Neutral` / `AgX` expectations explicitly using `gl={{ toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0, outputColorSpace: THREE.SRGBColorSpace }}` (`ACESFilmicToneMapping` shifts vivid saturated hues unless intended).
3. **Canonical Viewer Modules**: Reference [`../../../docs/examples/glb-web-handoff/README.md`](../../../docs/examples/glb-web-handoff/README.md) (`threejs-glb-viewer.mjs` and `r3f-glb-viewer.tsx`) rather than inventing ad-hoc snippet patterns.
4. **Decoder Pairing Rules**:
   - `EXT_meshopt_compression` → wire `GLTFLoader.setMeshoptDecoder(MeshoptDecoder)` (preferred fast web decompression).
   - `KHR_draco_mesh_compression` → wire `DRACOLoader` with pinned CDN or local `/draco/` WASM path.
   - `KHR_texture_basisu` → wire `KTX2Loader.detectSupport(renderer)` with `/basis/` transcoder path.
5. **Lifecycle & Disposal Guard**: Preload via `useGLTF.preload(url)` (`drei`) or dispose geometries/materials/textures on unmount so SPA route changes never leak GPU buffers.
6. **Caveat-First Truthfulness**: Client-side parsing in Three.js or R3F checks **container structure only (`Tier 1/2`)** — it does **not** verify visual fidelity (`Tier 3`) or live Blender runtime (`Tier 4`).

## Good example
Lists scale/origin/toneMapping/decoder assumptions, references `blendops glb-handoff`, and states next verification checks cleanly (`Artifact status: Not Produced` until `.glb` exists).

## Bad example
Claims guaranteed web look-dev parity without matching tone mapping, decoder setup, or visual browser inspection.

## Related skill
- [`../SKILL.md`](../SKILL.md)
- [`../../../docs/examples/glb-web-handoff/README.md`](../../../docs/examples/glb-web-handoff/README.md)
