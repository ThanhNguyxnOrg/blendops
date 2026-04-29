# External Runtime Setup

## Why BlendOps uses external runtime tools today

BlendOps is currently a product/workflow layer, not a low-level runtime distribution.

That means BlendOps does **not** currently ship its own:

- custom CLI runtime
- custom MCP server runtime
- custom Blender addon runtime

Instead, BlendOps assumes:

- official Blender runtime/CLI
- `ahujasid/blender-mcp` as the current reference AI ↔ Blender MCP bridge

BlendOps then sits above that runtime setup and focuses on workflow guidance for non-Blender users.

---

## Step 1 — Install Blender

1. Install Blender from official sources:
   - Download/install: https://www.blender.org/download/
   - Install docs: https://docs.blender.org/manual/en/latest/getting_started/installing/index.html

2. Blender CLI is included with Blender.

3. Optionally verify CLI availability (if Blender is on your PATH):

```bash
blender --version
```

4. For full command-line behavior and options, use official docs:
   - https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

---

## Step 2 — Set up AI ↔ Blender MCP bridge

For AI-to-Blender connectivity today, use:

- https://github.com/ahujasid/blender-mcp

High-level setup flow (summary only):

1. Install required tooling such as `uv`.
2. Configure your AI client to run `uvx blender-mcp`.
3. Install/enable the Blender addon from that repo.
4. Start/connect the addon inside Blender so AI requests can reach Blender.

Important:
- Follow the upstream repository for exact/current setup commands and configuration.
- Do not treat this document as a replacement for upstream install instructions.

---

## Step 3 — Return to BlendOps

Once Blender + MCP bridge setup is working, return to BlendOps workflow docs:

- Product direction: `./product-direction.md`
- First user journey: `./first-user-journey.md`
- Architecture: `./architecture.md`
- Golden path example: `./golden-path-cyberpunk-shoe.md`
- Workflow contract: `./workflow-contract.md`
- Safety model: `./safety-model.md`

BlendOps role at that point:

`natural-language intent` → `scene/workflow plan` → `validation` → `render/export handoff` → `web-ready guidance`

---

## Safety boundary

`ahujasid/blender-mcp` may expose powerful tooling, including arbitrary Python execution capability.

BlendOps safety stance:

- Do **not** use arbitrary Python execution as the final BlendOps product interface.
- Keep user-facing behavior workflow-constrained and validation-driven.
- Prefer safe structured plans, explicit assumptions, and clear pass/partial/fail outcomes.
