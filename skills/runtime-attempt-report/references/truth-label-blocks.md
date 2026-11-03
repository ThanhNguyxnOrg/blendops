# Truth label blocks

Use definitions from `laws/evidence-before-done.md`.

**Runtime status**

- `Not Run` — no attempt started.
- `Attempted` — tried; incomplete evidence or blocked mid-flight.
- `Produced` — observable runtime output exists but validation incomplete.
- `Verified` — output exists AND checks recorded (rare immediately after first connect).
- `Failed` — attempt concluded negatively with evidence.

A blocked environment (no attempt started) stays `Not Run`; an attempt that could not finish stays `Attempted`. Do not introduce a `Blocked` runtime state — it is not one of the 5 truth states.

**Artifact status** (renders, GLB, previews)

- Default stance remains conservative until paths cited.

Include a one-line educator note for stakeholders ("Verified requires proof, not confidence").
