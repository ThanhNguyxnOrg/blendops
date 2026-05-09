# EVAL — blender-brainstorming

Status: Draft v0 text-only baseline  
Scope: Socratic intent exploration; no runtime execution; no artifact claims.

## Text-only eval prompt

Use blender-brainstorming on a vague non-Blender-user 3D request. Ask 3-5 clarifying questions, propose 2-3 alternative scopings, and produce a confirmed intent summary in plain language. Do not run Blender, do not claim runtime artifacts.

## Expected behavior

- quotes the original user request verbatim
- asks 3-5 targeted clarifying questions in one batch
- proposes 2-3 distinct alternative scopings with trade-offs
- produces a one-paragraph confirmed intent summary in plain language
- lists decisions taken vs. deferred
- runtime status remains `Not Run`; artifact status `Not Produced`
- hands off to `intent-to-3d-brief-writer` (recommended) or planner

## Eval cases

| Case | Input | Expected output | Required evidence |
|---|---|---|---|
| Vague creative request | "Make me a cool sneaker render" | 5 clarifying questions; 3 alternative scopings (mood, deliverable, audience); user-confirmed intent paragraph | quoted original request, 3-5 questions, 2-3 scopings, paragraph summary |
| Half-specified request | "I need a cyberpunk shoe hero for web, but I don't know what to do" | 1-3 targeted questions (audience, performance constraints, evidence expectations); 2 scopings; intent paragraph | quoted original, targeted questions, scopings, summary |
| User refuses clarification | "Just do whatever, I trust you" | Explicit assumption block listing what was assumed; 2 scoping options anyway; low-confidence handoff | assumption list, scoping options, low-confidence label |
| User keeps expanding scope | "Add this... and also that... and a music video version too" | Stop and ask "lock current scope or keep expanding?"; if locked, summarize | scope-lock prompt, summary of current scope |
| Already structured brief | User provides subject + mood + deliverable + audience + evidence | Skip brainstorming; route directly to `intent-to-3d-brief-writer` | explicit "skipping brainstorming because brief is complete" message |

## Expected evidence/status fields

| Field | Required content |
|---|---|
| Original user request | Quoted verbatim |
| Clarifying questions asked | List of 3-5 |
| Alternative scopings | 2-3 distinct options with trade-offs |
| Confirmed intent | One paragraph, plain language |
| Decisions taken | Explicit list |
| Decisions deferred | Explicit list |
| Runtime status | `Not Run` |
| Artifact status | `Not Produced` |
| Next-skill handoff | Named (typically `intent-to-3d-brief-writer`) |

## Pass / Warn / Fail criteria

- Pass: all required evidence fields present, alternative scopings distinct (not minor variants), intent summary user-confirmed, no Blender jargon, no runtime claim
- Warn: clarification depth low (1-2 questions) but explicit assumption notes; OR alternative scopings only 1 with caveats; OR jargon present but brief
- Fail: zero clarifying questions; OR jumped straight to plan without intent confirmation; OR claimed runtime / artifact production; OR user-facing summary uses dense Blender terms

## Common failure modes

- drip-feeding questions (one at a time across multiple turns) instead of batching
- skipping alternative scopings
- using Blender jargon ("topology", "subsurf modifier", "BSDF shader") in the intent summary aimed at non-Blender users
- claiming "I'll now set up Blender" or "I'll install the Connector" — these are out of scope for this skill

## Evidence expectations

- conversation log includes verbatim user request
- batch of 3-5 questions visible in one turn
- alternative scopings clearly enumerated
- confirmed intent paragraph echoed back to user before handoff
- explicit `Not Run` / `Not Produced` status

## Sample passing response outline

- "What I heard you ask for: <quote>"
- "What I need to know: <3-5 questions>"
- "Three ways we could scope this: <option A / B / C with trade-offs>"
- "Confirmed intent (your scope: <X>): <one paragraph>"
- "Decisions taken: <list>. Deferred: <list>."
- "Next step: hand off to `intent-to-3d-brief-writer`. Runtime status: Not Run."

## Sample failing response outline

- Skipped clarification, dove straight into a multi-paragraph scene plan
- No alternative scopings offered
- Used "topology", "BSDF", "subsurf" without explanation
- Claimed "I've set up the Blender connector" when no setup happened
