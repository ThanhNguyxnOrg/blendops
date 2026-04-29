# Capability Profile Schema

Status: Draft v0

```yaml
target_name:
target_type:
confidence_label: verified-read | linked-only | assumed | unknown
native_skills_supported: true | false | unknown
project_instructions_supported: true | false | unknown
rules_directory_supported: true | false | unknown
agents_md_supported: true | false | unknown
connector_supported: true | false | unknown
mcp_supported: true | false | unknown
can_write_project_files: true | false | unknown
global_config_supported: true | false | unknown
recommended_install_scope:
fallback_install_scope:
requires_user_confirmation:
backup_required:
rollback_required:
notes:
```

## Example: Claude Code

```yaml
target_name: Claude Code
target_type: cli-agent
confidence_label: verified-read
native_skills_supported: true
project_instructions_supported: true
rules_directory_supported: unknown
agents_md_supported: true
connector_supported: unknown
mcp_supported: true
can_write_project_files: true
global_config_supported: unknown
recommended_install_scope: project-local
fallback_install_scope: generic-root
requires_user_confirmation: global install only
backup_required: true
rollback_required: true
notes: Distinguish from Claude app/Desktop.
```

## Example: Claude app/Desktop

```yaml
target_name: Claude app/Desktop
target_type: app
confidence_label: linked-only
native_skills_supported: unknown
project_instructions_supported: true
rules_directory_supported: false
agents_md_supported: true
connector_supported: true
mcp_supported: unknown
can_write_project_files: true
global_config_supported: unknown
recommended_install_scope: docs-only/reference
fallback_install_scope: generic-root
requires_user_confirmation: any config mutation
backup_required: true
rollback_required: true
notes: Not equivalent to Claude Code path assumptions.
```

## Example: OpenCode

```yaml
target_name: OpenCode
target_type: cli-agent
confidence_label: linked-only
native_skills_supported: unknown
project_instructions_supported: true
rules_directory_supported: unknown
agents_md_supported: true
connector_supported: unknown
mcp_supported: unknown
can_write_project_files: true
global_config_supported: unknown
recommended_install_scope: project-local
fallback_install_scope: generic-root
requires_user_confirmation: global install only
backup_required: true
rollback_required: true
notes: Verify tool-native path before writing.
```

## Example: Cursor

```yaml
target_name: Cursor
target_type: ide-agent
confidence_label: linked-only
native_skills_supported: unknown
project_instructions_supported: true
rules_directory_supported: true
agents_md_supported: true
connector_supported: unknown
mcp_supported: unknown
can_write_project_files: true
global_config_supported: unknown
recommended_install_scope: project-local
fallback_install_scope: generic-root
requires_user_confirmation: global install only
backup_required: true
rollback_required: true
notes: Prefer .cursor/rules only if verified.
```

## Example: Codex/generic

```yaml
target_name: Codex/generic
target_type: generic-agent
confidence_label: linked-only
native_skills_supported: unknown
project_instructions_supported: true
rules_directory_supported: unknown
agents_md_supported: true
connector_supported: unknown
mcp_supported: unknown
can_write_project_files: true
global_config_supported: unknown
recommended_install_scope: generic-root
fallback_install_scope: docs-only/reference
requires_user_confirmation: global install only
backup_required: true
rollback_required: true
notes: AGENTS.md and BLENDOPS.md are safest defaults.
```

## Example: Unknown future agent

```yaml
target_name: Unknown
target_type: unknown
confidence_label: unknown
native_skills_supported: unknown
project_instructions_supported: unknown
rules_directory_supported: unknown
agents_md_supported: unknown
connector_supported: unknown
mcp_supported: unknown
can_write_project_files: unknown
global_config_supported: unknown
recommended_install_scope: generic-root
fallback_install_scope: docs-only/reference
requires_user_confirmation: any non-project-local write
backup_required: true
rollback_required: true
notes: Use conservative fallback and explicit uncertainty.
```
