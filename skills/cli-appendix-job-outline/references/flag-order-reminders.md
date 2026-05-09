# Flag order reminders

Research exact syntax in the upstream Blender CLI manual for the user's version. Conceptual cautions BlendOps tracks:

- Output-related flags and argument ordering are version-sensitive — verify per manual section for command-line rendering and Python scripts.
- Python scripts often follow `--python` with optional `--` separator before script arguments — verify per manual; incorrect splitting loses arguments silently.
- Background mode suppresses UI — do not expect viewport captures without explicit render-to-file steps.

These are **check prompts**, not copy-paste prescriptions.
