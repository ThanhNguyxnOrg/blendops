# Security Policy

## Supported Scope

BlendOps is in MVP stage. Security-sensitive areas include:

- command validation and dispatch
- bridge transport (`localhost` addon endpoint)
- MCP tool exposure
- prevention of arbitrary code execution

## Reporting a Vulnerability

Please **do not** open public issues for sensitive vulnerabilities.

Instead, report privately with:

- description of the issue
- impact/risk level
- reproduction steps
- suggested mitigation (if available)

Until a dedicated security mailbox is configured, open a GitHub issue with minimal details and request private coordination.

## Security Principles for this repo

- No arbitrary Python execution exposed by default
- Explicit allowlist of bridge operations
- Destructive actions should require explicit confirmation flags
- Structured error messages should guide corrective action

## Hard No

Contributions that add hidden execution paths or bypass schema validation will be rejected.
