# blendops-brief — EVAL

Behavioral evaluation prompts for `blendops-brief`. Sections below come from the skills merged into it in v2.0.0.

## From former `blendops-brief`

### Text-only eval prompt

User wants a cinematic interior dining room hero for a furniture brand website (still image + optional GLB spin). Assess recipe/pack fit.

### Expected behavior

- Recognize overlap with interior architectural planner + product-adjacent hero patterns
- Recommend `product-hero-v0` only if product-centric; else interior-focused workflow entry
- Partial fit notes if GLB spin is optional
- Hand off to `blendops-brief`

### Pass / Warn / Fail criteria

- Pass: verdict + gaps + next skill + catalog citation
- Warn: vague deliverable type not clarified
- Fail: asserts a pack fits with contradictory constraints unstated

### Sample passing response outline

- Fit verdict
- Gap bullets
- Next skill

### Sample failing response outline

- "Use product hero" with no interior caveat

## From former `blendops-brief`

Status: 1.0.0 text-only baseline  
Scope: produces 8-slot structured brief; no runtime; no artifacts.

### Text-only eval prompt

Use blendops-brief to convert a confirmed intent into the 8-slot brief. Echo the brief to the user. Hand off to the relevant planner.

### Expected behavior

- fills all 8 slots (subject, mood, deliverables, constraints, evidence, acceptance, audience, owner)
- batches any missing-slot questions in one turn
- echoes the brief to the user for confirmation
- lists decisions explicitly deferred to planners
- runtime status remains `Not Run`; artifact status `Not Produced`
- hands off to the relevant planner after confirmation

### Eval cases

| Case | Input | Expected output | Required evidence |
|---|---|---|---|
| Fully specified intent | Confirmed intent paragraph covers all 8 slots | Brief written, echoed, handed off | 8-slot markdown, deferred-decisions list |
| Half-specified intent | 5 of 8 slots present | Batch 3 missing-slot questions; write brief; echo | 8-slot markdown with `Unknown` filled where needed, questions answered |
| 4+ slots missing | Intent is too vague | Route back to `blendops-brief` | explicit re-route message, no brief written yet |
| Conflicting deliverable + constraint | "GLB for web AND 50MB poly budget" | Flag conflict in slot 4; ask user to resolve | conflict flag, resolution prompt |
| Mixed audience | Audience: marketing team + tech artist | Two sections (technical + plain-language); user-facing always plain-language | both sections present |
| User edits brief | After echo, user changes mood | Update brief, re-echo, await second confirmation | versioned brief, second confirmation |
| Iteration loop request | User wants text-only plan first, runtime later | Brief deliverables = text-only plan; evidence expectations = `Not Run` | brief explicitly text-only |

### Expected evidence/status fields

| Field | Required content |
|---|---|
| Subject | Plain language; no Blender jargon |
| Mood / style | Tone, references, brand notes if any |
| Deliverables | Exhaustive list (image / GLB / preview / response / combinations) |
| Constraints | Performance, scope, time, brand |
| Evidence expectations | Truth labels acceptable + required evidence fields |
| Acceptance criteria | Observable, not subjective |
| Audience | Named (e.g. "marketing team — non-Blender") |
| Owner | Named (operator / agent / human) |
| Decisions deferred | Explicit list with target skill |
| Runtime status | `Not Run` |
| Artifact status | `Not Produced` |

### Pass / Warn / Fail criteria

- Pass: all 8 slots filled or marked `Unknown` explicitly, plain language, acceptance criteria observable, brief echoed and confirmed by user
- Warn: 1-2 slots `Unknown` without follow-up, OR partly subjective acceptance criteria, OR brief written but not echoed
- Fail: 3+ slots missing without acknowledgment, OR jargon-heavy, OR claimed runtime / artifact production, OR brief invented slots not confirmed

### Common failure modes

- writing the brief without echoing to user
- inventing mood / constraint values
- using Blender jargon ("subsurf scattering", "BSDF", "topology") in the brief
- letting planners re-negotiate after handoff
- skipping owner slot (breaks accountability later)

### Evidence expectations

- 8-slot markdown brief visible
- echo + confirm cycle visible
- deferred-decisions list explicit
- handoff target named with reason

### Sample passing response outline

- TL;DR: <one line>
- Brief (8 slots in markdown)
- Decisions deferred: <list with target skill>
- Confirm or edit prompt
- After confirmation, handoff: `blendops-product-shot`

### Sample failing response outline

- Brief written without echo
- Subject slot has jargon
- 4 slots missing, no acknowledgment
- Skipped owner slot
- Claimed "runtime ready" when status is Not Run

## From former `blendops-brief`

Status: 1.0.0 text-only baseline  
Scope: Socratic intent exploration; no runtime execution; no artifact claims.

### Text-only eval prompt

Use blendops-brief on a vague non-Blender-user 3D request. Ask 3-5 clarifying questions, propose 2-3 alternative scopings, and produce a confirmed intent summary in plain language. Do not run Blender, do not claim runtime artifacts.

### Expected behavior

- quotes the original user request verbatim
- asks 3-5 targeted clarifying questions in one batch
- proposes 2-3 distinct alternative scopings with trade-offs
- produces a one-paragraph confirmed intent summary in plain language
- lists decisions taken vs. deferred
- runtime status remains `Not Run`; artifact status `Not Produced`
- hands off to `blendops-brief` (recommended) or planner

### Eval cases

| Case | Input | Expected output | Required evidence |
|---|---|---|---|
| Vague creative request | "Make me a cool sneaker render" | 5 clarifying questions; 3 alternative scopings (mood, deliverable, audience); user-confirmed intent paragraph | quoted original request, 3-5 questions, 2-3 scopings, paragraph summary |
| Half-specified request | "I need a cyberpunk shoe hero for web, but I don't know what to do" | 1-3 targeted questions (audience, performance constraints, evidence expectations); 2 scopings; intent paragraph | quoted original, targeted questions, scopings, summary |
| User refuses clarification | "Just do whatever, I trust you" | Explicit assumption block listing what was assumed; 2 scoping options anyway; low-confidence handoff | assumption list, scoping options, low-confidence label |
| User keeps expanding scope | "Add this... and also that... and a music video version too" | Stop and ask "lock current scope or keep expanding?"; if locked, summarize | scope-lock prompt, summary of current scope |
| Already structured brief | User provides subject + mood + deliverable + audience + evidence | Skip brainstorming; route directly to `blendops-brief` | explicit "skipping brainstorming because brief is complete" message |

### Expected evidence/status fields

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
| Next-skill handoff | Named (typically `blendops-brief`) |

### Pass / Warn / Fail criteria

- Pass: all required evidence fields present, alternative scopings distinct (not minor variants), intent summary user-confirmed, no Blender jargon, no runtime claim
- Warn: clarification depth low (1-2 questions) but explicit assumption notes; OR alternative scopings only 1 with caveats; OR jargon present but brief
- Fail: zero clarifying questions; OR jumped straight to plan without intent confirmation; OR claimed runtime / artifact production; OR user-facing summary uses dense Blender terms

### Common failure modes

- drip-feeding questions (one at a time across multiple turns) instead of batching
- skipping alternative scopings
- using Blender jargon ("topology", "subsurf modifier", "BSDF shader") in the intent summary aimed at non-Blender users
- claiming "I'll now set up Blender" or "I'll install the Connector" — these are out of scope for this skill

### Evidence expectations

- conversation log includes verbatim user request
- batch of 3-5 questions visible in one turn
- alternative scopings clearly enumerated
- confirmed intent paragraph echoed back to user before handoff
- explicit `Not Run` / `Not Produced` status

### Sample passing response outline

- "What I heard you ask for: <quote>"
- "What I need to know: <3-5 questions>"
- "Three ways we could scope this: <option A / B / C with trade-offs>"
- "Confirmed intent (your scope: <X>): <one paragraph>"
- "Decisions taken: <list>. Deferred: <list>."
- "Next step: hand off to `blendops-brief`. Runtime status: Not Run."

### Sample failing response outline

- Skipped clarification, dove straight into a multi-paragraph scene plan
- No alternative scopings offered
- Used "topology", "BSDF", "subsurf" without explanation
- Claimed "I've set up the Blender connector" when no setup happened

## From former `blendops-brief`

### Text-only eval prompt
User intent: "I need a hero render of the shoe + 4 color variants + a 3-second orbit animation for the web". Apply blendops-brief.

### Expected behavior
- 3 recipes named (hero render / variants grid / orbit animation)
- Brief seed + stop condition per recipe
- Order + dependencies explicit (variants and animation depend on hero scene)
- Shared assets identified
- Start recipe recommended
- Each recipe hands off to blendops-brief

### Pass / Warn / Fail criteria
- Pass: 3 cohesive recipes + names + briefs + stops + order + dependencies + shared assets
- Warn: stop conditions soft or dependencies unclear
- Fail: one mega-recipe; over-split (5+ fragments); missing stops

### Common failure modes
- single mega-recipe
- recipe overlap in scope
- skipping dependency analysis
- naming recipes by process not deliverable

### Sample passing response outline
- User intent + deliverable enumeration
- 3-row recipe table
- Shared assets list
- Recommended start
- Handoff to blendops-brief

### Sample failing response outline
- "Do all in one go"
- No stop conditions
- No dependencies
