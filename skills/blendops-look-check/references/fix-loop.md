# Fix loop

One round = numeric checks → capture views → visual review → one fix. Set `gate.status` to `pending` when a round starts.

1. List all issues from the numeric checks and the visual review.
2. Order them: numeric `fail` first, then visual `fail`, then `warn`.
3. Fix only the top issue, through the matching `blendops-build` step (shape, material, light or camera). The user already approved the build; a fix that changes the plan (new object, other material, other framing) needs their yes again.
4. Run the numeric checks and capture the views again, and compare with the previous round.

Stop when:

- No `fail` is left: verdict `pass` (or `warn` with the polish items listed). Hand the preview to `blendops-final-check`.
- The same issue comes back after its fix, or a fix breaks something that passed: set `runtime.errorDetected` and hand off to `blendops-fix-problems`.
- Three rounds have run and a `fail` is left: set `gate.status` to `blocked`, stop, show the user the latest pictures and the issue list, and ask how to go on.
- A tool call or script fails: set `runtime.errorDetected` and hand off to `blendops-fix-problems`. A look issue alone never sets `runtime.errorDetected`; it goes in `quality.verdict`.

Report each round as JSON:

```json
{
  "step": "look-check",
  "round": 2,
  "numeric_issues": [{"check": "ground_contact", "object": "Shoe_Sole", "gap_m": 0.012}],
  "visual_issues": [{"area": "lighting", "issue": "toe is in shadow", "view": "camera", "level": "warn"}],
  "images": ["/abs/path/look-r2-camera.png", "/abs/path/look-r2-front.png", "/abs/path/look-r2-side.png"],
  "fixed_this_round": "moved Shoe_Sole down 12 mm",
  "verdict": "warn"
}
```

Tell the user in plain words what was checked, what was wrong and what changed, and show the pictures. Never hand them the check script.
