# AGENTS.md

> AI agents working **inside this repository** (modifying BlendOps itself, not consuming BlendOps) should follow this file. AI agents being asked to **install/use BlendOps in another project** should follow [`docs/ai-agent-quickstart.md`](./docs/ai-agent-quickstart.md) instead.

---

## What this repo is

BlendOps is a **portable AI-agent Skills pack for Blender**, designed for users who don't know Blender. It is a **content layer** (`SKILL.md`-based docs + skills + laws + packs + bundles), not a runtime, not an installer, and not an MCP server.

Read [`docs/README.md`](./docs/README.md) for the full hub. Read [`docs/runtime-stack-strategy.md`](./docs/runtime-stack-strategy.md) before saying anything about runtime.

---

## Hard rules when editing this repo

**These are enforced by `scripts/check-docs.mjs` (CI runs it on every PR).**

1. **Runtime model = 2 MCP execution paths + CLI fallback appendix.**
   - Path 1 — Official Blender Lab MCP (Lab add-on + Lab server in Blender 5.1+; host = (a) Anthropic Connector OR (b) any other MCP client manually configured).
   - Path 2 — Community `ahujasid/blender-mcp` (Blender 3.0+).
   - CLI fallback (appendix) — direct `blender --background --python`. **Documented upstream** as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.
   - **Do not** describe Anthropic Connector as standalone. Anthropic's tutorial step 2 explicitly tells the user to install the Blender Lab MCP add-on inside Blender.
   - **Do not** apply the Blender 5.1+ floor to Path 2 or to the CLI appendix. It is bound to the Lab add-on manifest, which only governs Path 1.

2. **Anthropic Skills frontmatter spec compliance.**
   - Every `SKILL.md` (other than `skills/_template/SKILL.md`) ships with only `name` and `description` keys — no `version`, `status`, or `tags`.
   - `name` ≤ 64 chars, lowercase letters/numbers/hyphens only.
   - `description` ≤ 200 chars (Claude.ai upload limit).

3. **Evidence before done.**
   - No claim of runtime success, mutation, render, export, GLB, preview, or "Verified" without an evidence file under `docs/evals/`.
   - The 4 truth states are `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`.
   - `Not Produced` is the default for artifacts.

4. **No BlendOps-owned runtime.**
   - Don't add a CLI, MCP server, or Blender add-on under any path that BlendOps "owns".
   - Reference upstream (Anthropic, Blender Lab, `ahujasid/blender-mcp`) only.

5. **No arbitrary Python as the user-facing surface.**
   - The runtime paths internally use LLM-generated Python (that's how `bpy` works) — that's fine.
   - The BlendOps **product surface** stays workflow + validation + evidence. Never recommend "paste this Python" as the final user output.

6. **Plain language for non-Blender users.**
   - Final user-facing outputs explain status without Blender jargon. Add brief explanations for unavoidable terms.

---

## Where to look

| Need | Doc |
|---|---|
| Hub (the everything index) | [`docs/README.md`](./docs/README.md) |
| Friendly first-read | [`docs/start-here.md`](./docs/start-here.md) |
| Runtime path model + history of corrections | [`docs/runtime-stack-strategy.md`](./docs/runtime-stack-strategy.md) |
| Per-path setup walkthrough | [`docs/external-runtime-setup.md`](./docs/external-runtime-setup.md) |
| 2-path runtime summary | [`docs/reference-runtime.md`](./docs/reference-runtime.md) |
| Path 2 caveats (community `ahujasid/blender-mcp`) | [`docs/unofficial-runtime-bridges.md`](./docs/unofficial-runtime-bridges.md) |
| Universal install flow (Mode A/B/C) | [`docs/ai-agent-install-flow.md`](./docs/ai-agent-install-flow.md) |
| Per-target install index (9 targets) | [`docs/install/README.md`](./docs/install/README.md) |
| Adapter index + registry | [`docs/adapters/README.md`](./docs/adapters/README.md), [`docs/adapter-registry.md`](./docs/adapter-registry.md) |
| Skill system architecture | [`docs/skill-system.md`](./docs/skill-system.md) |
| Skills (16 total) | [`skills/README.md`](./skills/README.md) |
| Laws | [`laws/README.md`](./laws/README.md) |
| Packs | [`packs/README.md`](./packs/README.md) |
| Evals + readiness | [`docs/evals/README.md`](./docs/evals/README.md), [`docs/release-readiness.md`](./docs/release-readiness.md) |
| Roadmap + honest "Is BlendOps running yet?" | [`TODO.md`](./TODO.md) |

---

## Required pre-PR checks

```bash
npm run docs:check     # ~342 active markdown files (see script footer count)
npm run skills:export  # 10 ZIPs + 10 Claude Code folders
```

Or both at once:

```bash
npm run ci
```

---

## Adding new content

| Adding | See |
|---|---|
| A new skill | [`skills/README.md`](./skills/README.md) "How to add a new skill" + [`skills/_template/SKILL.md`](./skills/_template/SKILL.md) |
| A new law | [`laws/README.md`](./laws/README.md) |
| A new install target | [`docs/install/README.md`](./docs/install/README.md) (start as install doc → graduate to adapter via [`docs/adapter-registry.md`](./docs/adapter-registry.md) promotion ladder) |
| A new adapter | [`docs/adapters/adapter-template.md`](./docs/adapters/adapter-template.md) |
| Runtime evidence | Template in [`docs/evals/blender-connector-read-only-smoke-test.md`](./docs/evals/blender-connector-read-only-smoke-test.md) section "What a clean re-verification would record" |

---

## What this repo does NOT do

- Does not install Blender.
- Does not configure the Anthropic Blender Connector for the user.
- Does not configure the Blender Lab MCP add-on for the user.
- Does not configure the community `ahujasid/blender-mcp` for the user.
- Does not run Blender, render, export, or produce preview/render/GLB artifacts.
- Does not ship a published `npm` package or `npx` installer.
- Does not have a marketplace listing.

If you find a doc claiming any of these, that's a bug — fix the doc honestly to mark it `Not Run` / `Not Produced` / `Not Published`.

---

## License

MIT. See [`LICENSE`](./LICENSE).
