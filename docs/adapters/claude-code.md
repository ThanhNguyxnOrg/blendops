# Adapter: Claude Code

Status: Draft v0
Confidence label: verified-read

## Supported install scopes
- project-local (default)
- tool-native (if path verified)
- user-global (opt-in only)

## Detection hints
- `CLAUDE.md`
- `.claude/` directory

## Capability profile summary
- project instructions: supported
- native skills path: verify before writing
- can write project files: yes

## Recommended install behavior
- attach core collection project-locally
- create/update `CLAUDE.md` index section
- use tool-native skill paths only when verified

## Allowed writes
- project-local docs/rules/skill attachments

## Forbidden actions
- global config mutation without explicit approval
- runtime install/run claims

## Verification checklist
- files created where expected
- no runtime commands run
- rollback steps documented

## Rollback
- remove created project-local files
- restore backups of modified files

## First-use prompt
“Use BlendOps product-hero-v0 pack to plan a cyberpunk shoe hero. Do not run Blender unless runtime is explicitly available.”

## Notes
Claude Code adapter is separate from Claude app/Desktop adapter.

Native path confidence unresolved snippet (use when needed):
- "Claude Code native install path is not fully verified in this environment. Using project-local fallback attachment and keeping runtime status Not Run."
