# Do-Not Reminders

Every resolution proposal must include explicit "do-not" reminders so the operator does not re-introduce the same conflict next session. This file is the canonical list.

## Permanent do-nots (always include in every resolution)

1. **Do not enable both `Blender Lab MCP add-on` AND `ahujasid/blender-mcp` `addon.py` in the same Blender instance** simultaneously. Even with separate ports, port management is fragile.

2. **Do not point two MCP clients at the same Blender session.** The second connection silently fails per the Single-bridge constraint.

3. **Do not enable Anthropic Connector toggle AND a manual `mcpServers.blender` Lab entry** in Claude Desktop simultaneously. They are both Path 1 host options targeting the same Lab stack.

4. **Do not assume `localhost:9876` is yours** without checking. Both Lab MCP and `ahujasid/blender-mcp` default to ports in this range.

5. **Do not execute the resolution from this skill.** This skill diagnoses; the operator (or another skill) executes. Anything else violates `evidence-before-done` law.

6. **Do not claim the conflict is resolved without re-running the readiness checker.** A clean matrix is necessary but not sufficient. Re-run smoke.

## Conditional do-nots (include when relevant)

7. **If Path 2 is intended** — do-not also enable Anthropic Connector. Connector is for Path 1 only; enabling both would create a Path 1 + Path 2 conflict on Path 1 host (a) terms.

8. **If Path 1 is intended** — do-not run `uvx blender-mcp` for that Blender. The community server uses different tool names and a different add-on.

9. **If the user wants both paths on different Blender instances** — do-not share ports. Each Blender process needs explicit port isolation in BOTH the Blender add-on settings AND the MCP client config.

10. **If running on Blender 4.x** — do-not attempt Path 1. Lab add-on requires Blender 5.1+. Use Path 2 instead.

## Reminder format in the resolution

In the user-facing response template:

```md
## Do-not reminders

- Do not <permanent do-not 1>.
- Do not <permanent do-not 2>.
- Do not <permanent do-not 3>.
- (plus any conditional do-nots that apply to this specific conflict)
```

The reminders are part of the resolution proposal, not a footer. Operators should re-read them before executing.
