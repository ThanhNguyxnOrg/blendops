# Security Policy

## Scope

BlendOps is currently a product/workflow layer with external runtime dependencies.

Security-sensitive areas include:

- user-facing workflow constraints
- prevention of arbitrary execution exposure in final product interface
- safe validation/handoff messaging
- dependency on external runtime tooling configuration

## Reporting a vulnerability

Please **do not** open public issues for sensitive vulnerabilities.

Report with:

- issue description
- impact/risk level
- reproduction details
- suggested mitigation (if available)

Until a dedicated security mailbox is configured, open a GitHub issue with minimal details and request private coordination.

## Security principles

- no arbitrary Python execution as default user-facing interface
- no hidden execution paths
- explicit safety boundaries in workflow docs
- clear user-facing failure/limitation communication

## Hard no

Contributions that reintroduce hidden runtime execution paths or bypass documented safety constraints will be rejected.
