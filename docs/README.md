# 📚 BlendOps Documentation

Lightweight documentation hub for BlendOps.

## 🚀 Start here

| Need | Read |
|---|---|
| 📦 Install and start BlendOps | [Install guide](./install.md) |
| 🧠 Use BlendOps from AI/MCP | [AI agent usage](./ai-agent-usage.md) |
| 🧪 Run manual runtime checks | [Manual test guide](./manual-test.md) |
| 🎛️ Debug bridge/logs/request IDs | [Observability guide](./observability.md) |
| ✅ Evaluate agent behavior | [Eval prompts](./evals.md) |
| 🧪 Review runtime evidence | [Runtime evidence](#-runtime-evidence) |
| 🔍 Understand research/prior art | [Prior art](./prior-art.md) |

## 🧰 Setup and usage

- [Install and bridge bootstrap](./install.md)
- [Manual runtime testing](./manual-test.md)

## 🧠 AI and MCP

- [AI-agent usage guide](./ai-agent-usage.md)
- [Eval prompts](./evals.md)

## 🧪 Runtime evidence

| Evidence | Focus |
|---|---|
| [runtime-smoke-test.md](./runtime-smoke-test.md) | End-to-end baseline smoke run |
| [runtime-smoke-test-object-transform.md](./runtime-smoke-test-object-transform.md) | `object.transform` runtime validation |
| [runtime-smoke-test-material.md](./runtime-smoke-test-material.md) | Material create/apply validation |
| [runtime-smoke-test-lighting.md](./runtime-smoke-test-lighting.md) | `lighting.setup` runtime validation |
| [runtime-smoke-test-camera.md](./runtime-smoke-test-camera.md) | `camera.set` runtime validation |
| [runtime-smoke-test-render.md](./runtime-smoke-test-render.md) | `render.preview` runtime validation |
| [runtime-smoke-test-validate.md](./runtime-smoke-test-validate.md) | `validate.scene` runtime validation |
| [runtime-smoke-test-export.md](./runtime-smoke-test-export.md) | `export.asset` runtime validation |
| [runtime-smoke-test-observability.md](./runtime-smoke-test-observability.md) | stdout/stderr/bridge-log checks |
| [runtime-smoke-test-request-correlation.md](./runtime-smoke-test-request-correlation.md) | request_id + receipt correlation |
| [runtime-smoke-test-undo.md](./runtime-smoke-test-undo.md) | `undo.last` safe-failure runtime evidence |
| [runtime-smoke-test-scene-clear.md](./runtime-smoke-test-scene-clear.md) | `scene.clear` guarded destructive runtime validation |
| [runtime-smoke-test-batch-plan.md](./runtime-smoke-test-batch-plan.md) | `batch.plan` plan-only validation smoke evidence |
| [runtime-smoke-test-batch-execute-dry-run.md](./runtime-smoke-test-batch-execute-dry-run.md) | `batch.execute` dry-run only validation |

## 🔍 Research and architecture

- [Implementation mining](./implementation-mining.md)
- [Bridge lifecycle prior art](./bridge-lifecycle-prior-art.md)

## 🧭 Roadmap

- [TODO](../TODO.md)

## Compatibility

[docs/INDEX.md](./INDEX.md) remains available as a compatibility redirect.
