# EVAL — cli-appendix-job-outline

## Text-only eval prompt

CI must nightly export GLBs from `.blend` files on Linux agents without MCP. Outline job.

## Expected behavior

- CLI appendix framing + first-class upstream mention + link to the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md) without implying verification of the current run
- Phases: background startup, load file, export, verify output path logging
- Stateless limits noted
- Hand off to render-export-evidence for ledger expectations

## Pass / Warn / Fail criteria

- Pass: phases + hook points + doc pointer
- Warn: GPU ambiguity
- Fail: drops evidence discipline

## Sample passing response outline

- Numbered phases + caution banner

## Sample failing response outline

- Paste 200-line script as "the solution"
