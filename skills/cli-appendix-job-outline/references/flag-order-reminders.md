# CLI Flag Ordering & Upstream Manual Checkpoints

Blender evaluates CLI arguments **left-to-right sequentially**. Wrong ordering silently skips renders or drops script parameters without raising an error. Always verify exact flags against the upstream Blender Command Line Arguments manual matching the operator's binary version.

| Checkpoint | Failure mode if misplaced | Planning check rule |
|---|---|---|
| **`--background` (`-b`) position** | Loading `.blend` before `-b` opens GUI window; `-b` must precede scene file path. | `blender -b <scene.blend> ...` |
| **Output `-o` & format `-F` before `-f` / `-a`** | Placing `-o //out/frame_` *after* `-f 1` renders frame 1 to default `/tmp` before `-o` is read. | Put `-E`, `-o`, `-F` strictly *before* `-f` or `-a`. |
| **`--python` with `--` argument barrier** | Blender consumes flags (`-i`, `-o`, `--help`) unless separated by `--`. | Always pass custom parameters after `--`: `-P script.py -- --spec plan.json`. |
| **Python Exit Code (`--python-exit-code 1`)** | By default Blender exits `0` even when Python raises an unhandled traceback. | Explicitly require `--python-exit-code 1` in automation outlines so failures fail closed. |
| **`--factory-startup` add-on assumptions** | Skips user preferences and custom OCIO / extension state. | Note explicitly whether batch job requires `--factory-startup` or clean project profile. |

*Scope rule*: Use these as verification prompts inside plans and outlines — never present copy-paste Python snippets as the primary user-facing BlendOps interface (`no-arbitrary-python-interface.md`).

## Related skill
- [SKILL.md](../SKILL.md)
