# CLI Appendix Job Type Matrix

Choose headless Blender CLI jobs whenever repeatability, CI automation, or batch export matters more than conversational inspection. Always cross-check exact flags against the upstream Blender Command Line manual matching the user's binary version.

| Job Type | Planning Focus | Critical Manual Checks | Required Verification Evidence |
|---|---|---|---|
| **Batch still / turntable render** | Camera name, resolution, Color Management (`AgX` / `Khronos PBR Neutral`), engine (`CYCLES` / `EEVEE`), frame range | Frame `-f` / `-a` vs output `-o` placement; GPU device fallback if headless | Rendered frame paths on disk, non-zero byte sizes, exit code `0`, clean `stderr` |
| **Headless GLB export** | Applied transforms (`Location/Rotation/Scale`), `Z=0` floor, modifier bake state, texture packing / compression settings | Extension flags per glTF 2.0 exporter version in target Blender release | Output `.glb` byte size, `blendops glb-inspect` / `gltf-validator` report, triangle/texture budget match |
| **Scene hygiene / purge pass** | Orphan data cleanup (`outliner.orphans_purge`), missing texture check, color space audit | Confirm `--factory-startup` does not strip required project add-ons or OCIO config | Before/after triangle, material, and orphan-block counts + saved `.blend` SHA-256 |
| **Deterministic scene build script** | Read inputs from JSON (`SceneSpec`), log structured JSON summary, never paste raw Python as final user chat output | Keep user script args strictly **after `--`** separator | Execution log, stdout JSON summary, explicit `Not Produced` for any skipped outputs |

## Related skill
- [SKILL.md](../SKILL.md)
