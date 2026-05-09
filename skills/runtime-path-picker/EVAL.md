# EVAL — runtime-path-picker

## Text-only eval prompt

User has Blender 4.2 LTS, wants MCP steering from Cursor. Pick path.

## Expected behavior

- Path 1 unavailable (needs Blender 5.1+ for Lab add-on); explain succinctly
- Path 2 likely fit if user accepts community bridge caveats
- CLI appendix optional note for batch exports only
- Hand off to setup guide + unofficial bridges doc awareness

## Pass / Warn / Fail criteria

- Pass: primary path + version gating explained
- Warn: user vague on headless vs interactive — ask one clarifier
- Fail: recommends Path 1 without 5.1+ guard

## Sample passing response outline

- Conditional matrix + pick

## Sample failing response outline

- "Install Connector" for Blender 4.2 without caveat
