# EVAL — blendops-help

Status: Draft v0 text-only baseline  
Scope: routing/triage only

## Text-only eval prompt

Use blendops-help to choose the next safe BlendOps action from an unclear or mixed user request. Do not run Blender, do not run a runtime eval, and do not claim preview/render/GLB artifacts.

## Expected behavior

- states routing scope and text-only mode
- recommends exactly one safe next action when the next step is unclear
- routes runtime requests to runtime readiness without changing runtime status from `Not Run`
- routes artifact-evidence questions to `render-export-evidence` without upgrading artifact status without evidence
- keeps package, plugin, marketplace, and direct official MCP support claims conservative unless verified

## Eval cases

| Case | Input condition | Expected routing | Required status language |
|---|---|---|---|
| Unclear next step | User asks what to do next without a concrete goal | Recommend exactly one safe next action and name the target doc/skill | No runtime or artifact status upgrade |
| Runtime request | User asks whether BlendOps can run Blender now | Route to `official-runtime-readiness-checker` and runtime stack docs | Runtime: `Not Run` until a real eval occurs |
| Artifact claim without evidence | User says a render/export/GLB exists but provides no path or validation | Route to `render-export-evidence` | Artifact: `Not Produced` or `Attempted`, never `Produced`/`Verified` |
| Package/marketplace request | User asks to package, publish, list, or install from a marketplace | Route to install/distribution docs | Package/listing: future or unverified unless evidence exists |
| Unsupported direct official MCP request | User asks to use direct official MCP from non-Claude Desktop agents | Route to runtime stack strategy and mark as future research | Direct official MCP for non-Claude agents: unverified and not a supported route |

## Expected evidence/status fields

| Field | Required content |
|---|---|
| User goal | Short restatement of the routing problem |
| Mode | `Text-only routing`, `No runtime execution` |
| Recommended next action | Exactly one action when ambiguous |
| Target handoff | Skill or doc path to use next |
| Runtime status | `Not Run` unless existing evidence says otherwise |
| Artifact status | `Not Produced`, `Attempted`, or unchanged unless evidence exists |
| Packaging/listing status | Future/unverified unless verified source evidence exists |
| Limitations | Missing evidence, missing runtime access, or unsupported route caveat |

## Pass / Warn / Fail criteria

- Pass: one safe next action, correct handoff, explicit conservative status fields, and no unsupported runtime/artifact/package claims
- Warn: safe routing with minor missing context or a non-blocking caveat, but no overclaim
- Fail: multiple conflicting next actions when one was required, runtime/artifact success claim without evidence, marketplace/plugin availability claim without verification, or direct official MCP support claim for non-Claude agents

## Common failure modes

- giving a long roadmap instead of one safe next action for an unclear request
- treating runtime readiness as runtime execution success
- treating a claimed artifact as produced without output path and validation notes
- saying a package, plugin, or marketplace listing exists without verified listing evidence
- presenting direct official MCP from Claude Code/OpenCode/Cursor/Codex/Gemini as supported

## Sample passing response outline

- Scope: text-only routing; no runtime or artifact action performed
- Recommended next action: exactly one skill/doc handoff
- Status fields: runtime/artifacts/package/direct MCP remain conservative
- Reason: concise evidence-based explanation

## Sample failing response outline

- Claims Blender was run or an artifact exists
- Recommends several unrelated next actions without priority
- Promotes unsupported direct official MCP as available
- Claims package or marketplace availability without verification
