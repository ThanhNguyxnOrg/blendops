# Source Confidence Labels

## Purpose
Standardize provenance confidence labels whenever `runtime-setup` or install skills cite upstream Blender, Anthropic Connector, `mcp-for-blender`, or IDE skill-path documentation.

## When to use
- Whenever citing external setup guides, MCP client configuration schemas, or target native skill paths (`docs/install/*.md`, `docs/adapter-registry.md`).

## Canonical Confidence Tiers

| Label | Exact Meaning | Allowed Action in BlendOps | Required Reason Format |
|---|---|---|---|
| `verified-read` | Source documentation or target config behavior was **directly inspected and verified** in this repository (`claude-code`, `generic-project`, Path 1 Lab MCP docs) | Safe to describe behavior directly; native fallback or verified target path allowed | Cite exact verified doc/path read (`verified-read: inspected docs/install/claude-code.md and verified CLAUDE.md + BLENDOPS.md behavior`) |
| `linked-only` | Official URL or community doc link is cataloged and reachable-by-reference, **but live target skill autoloader or client build was not empirically tested in this run** (`cursor`, `windsurf`, `zed`, etc.) | Default to safe project-local `BLENDOPS.md` unless user explicitly passes `--confirm-target-path` or `--with-skills-dir` | State URL + explicit unverified native caveat (`linked-only: official Cursor MCP docs cited; native .cursor/rules/ loader not empirically executed here`) |
| `mixed` | Base repo docs are `verified-read`, while a specific client plugin flag or OS binary version remains `linked-only` | Clearly split verified core steps from unverified host-specific steps | Bullet verified part separately from unverified host part |
| `unknown` | No authoritative doc, URL, or observed local command exists for the requested client or runtime bridge | **Fail closed** — stop setup instructions and ask user or point to `generic-project` fallback | State missing evidence explicitly (`unknown: no verified MCP config spec found for target X`) |

## Good vs. Bad Usage
- **Good**: `"linked-only: official Zed MCP context_servers URL cited in docs/install/zed.md; Zed native skill loader unverified, so BLENDOPS.md fallback is active."`
- **Bad**: `"Probably supported in all IDEs"` (omits confidence tier and blurs verified facts with assumptions).

## Related skill
[../SKILL.md](../SKILL.md)
