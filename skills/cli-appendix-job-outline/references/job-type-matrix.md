# Job type matrix

| Job pattern | Outline focus | Typical evidence |
|---|---|---|
| Batch still render | Camera + samples + output path naming | Render files + stderr |
| Batch GLB export | Export opts + collection visibility | GLB sizes + validator script output |
| Scripted scene gen | Factory startup vs user prefs caveats | `.blend` hash / timestamp |
| Hygiene pass | Purge orphan data before export | File diff metrics |

Always instruct operators to confirm flags against the Blender manual version matching their executable.
