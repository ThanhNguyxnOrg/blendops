# preview-report-template-writer

Purpose: generate the structured preview-report Markdown that `glb-web-handoff` and `non-blender-user-response-writer` consume after a render or export run.

Use when render/export evidence has been produced (or explicitly absent) and a downstream skill needs a parseable summary.

Do not use for raw debug logs (use `blender-troubleshooting`) or for free-form prose summaries.

Return a Markdown report with header (date / operator / runtime path / tool versions), Artifacts section (per-row path + metric + truth label + validation), Validation section, and Top-line section (Pass / Warn / Fail + handoff target).

Hand off to glb-web-handoff (web target) or non-blender-user-response-writer (final user reply). Pair with `pre-handoff-verification` if any artifact is `Produced` but not `Verified`.
