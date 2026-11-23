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

## Red Flags & Rationalization Prevention

| Excuse | Reality |
|---|---|
| "Connecting to Blender failed, so let's call it `Blocked`." | `Blocked` is NOT a valid state. If no runtime session started, stamp `Not Run`; if mid-flight abort/crash, stamp `Attempted` or `Failed`. |
| "Path 2 community `mcp-for-blender` rendered fine, so mark release-ready." | Path 2 carries mandatory third-party caveats and **never** counts as official release certification. |
| "I'll paste the raw MCP JSON config to save time." | Secret hygiene violation. Redact all bearer tokens, API keys, and local usernames before saving logs. |
