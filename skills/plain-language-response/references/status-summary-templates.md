# Status Summary Templates

## Purpose
Ensure every final user update uses the exact status template matched to the actual execution mode (`Planning-only`, `Runtime Blocked`, `Runtime Produced-Unverified`, or `Verified`).

## When to use
- During the closing status block of `plain-language-response` or `blendops-help`.

## Templates by Mode

### 1. Planning-Only Mode (`Not Run` / `Not Produced`)
```txt
Summary: Blueprint ready; Blender has not run yet.
What is ready: <list of approved plans / checklists / budgets>
What is missing: Actual Blender build, render image, or .glb file on disk.
Runtime status: Not Run (planning-only pass)
Artifact status: Not Produced
Next single step: <choose runtime path via runtime-path-picker or run read-only setup check>
```

### 2. Runtime Blocked / Failed Mode (`Failed` / `Not Produced`)
```txt
Summary: Stopped cleanly before changing your scene because <plain reason>.
Blocker: <exact missing add-on / Blender version / port conflict / missing brief slot>
Runtime status: Failed (<short error reason>)
Artifact status: Not Produced
Next single step: <exact 1-action fix + re-check command>
```

### 3. File Written, Not Yet Validated (`Produced` — Intermediate)
```txt
Summary: Output file saved to <path> (<size>), awaiting quality & validator checks.
Created file: <path> (<size>)
Unverified: <gltf-validator / visual render inspection / mobile frame-rate check>
Runtime status: Produced
Artifact status: Produced (validation pending)
Next single step: Run `blendops glb-inspect <path>` or visual review via `pre-handoff-verification`.
```

### 4. Verified Delivery (`Verified` / `Verified`)
```txt
Summary: Ready for handoff — verified on disk with zero critical errors.
Verified file(s): <path> (<size>, <polycount>, <validator result>)
Runtime status: Verified (<Blender version + path used>)
Artifact status: Verified
Next single step: <plug into viewer / publish asset>
```

## Related skill
[../SKILL.md](../SKILL.md)
