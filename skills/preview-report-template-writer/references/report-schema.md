# Canonical preview-report schema

Downstream skills parse this layout. Do not deviate.

## File header (required)

```md
# Preview report (kind: <preview | render | export | full>)
Date: <YYYY-MM-DD>
Operator: <name or unknown>
Runtime path: <Path 1 host a Anthropic Connector | Path 1 host b manual MCP | Path 2 ahujasid/blender-mcp | CLI fallback>
Tool versions: <blender X.Y | lab-mcp-addon vN | mcp-host product+build | uvx blender-mcp vN | unknown>
```

## Artifacts section (required)

One row per artifact. Keep the column order verbatim.

```md
## Artifacts
- preview: <path> | <resolution> | truth: Not Run | Produced | Verified | Failed | validation: <notes or "none">
- render: <path> | <resolution> + <samples + engine> + <render time> | truth: <label> | validation: <notes>
- export: <path> | <size MB> + <Draco yes/no> + <animation channels> + <texture count> | truth: <label> | validation: <notes>
```

If an artifact is `Not Run`, the row still appears with `Not Produced` path placeholder and explicit truth label.

## Validation section (required)

```md
## Validation
- <check name>: pass | fail | skip | <evidence>
- ...
```

Validation checks must be explicit (e.g., "render PNG dimensions match scene render output settings", "GLB validates with `gltf-validator`", "GLB triangle count ≤ budget").

## Top-line section (required)

```md
## Top-line
Status: Pass | Warn | Fail
Next: <handoff skill>
Limitations: <gaps or "none">
```

Status must be derived from the rows; a `Failed` artifact forces top-line `Fail`.

## Optional appendix

- Logs path
- Reference image path (for diff-based verification)
- Operator notes

## Why this schema

`glb-web-handoff` and `non-blender-user-response-writer` both consume this exact layout. Free-form prose breaks them.

## Related skill
`../SKILL.md`
