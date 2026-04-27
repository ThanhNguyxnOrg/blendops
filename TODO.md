# 🧭 BlendOps Roadmap

_Last updated: 2026-04-26_

This roadmap reflects **current code + runtime evidence**.

---

## ✅ Completed and validated

| Slice | Status | Notes |
|---|---:|---|
| `scene.inspect` | ✅ | CLI + MCP + runtime evidence |
| `scene.clear` | ✅ | CLI + MCP + runtime evidence with explicit `CLEAR_SCENE` confirmation |
| `object.create` | ✅ | CLI + MCP + runtime evidence |
| `object.transform` | ✅ | CLI + MCP + runtime evidence |
| `material.create` | ✅ | CLI + MCP + runtime evidence |
| `material.apply` | ✅ | CLI + MCP + runtime evidence |
| `lighting.setup` | ✅ | CLI + MCP + runtime evidence |
| `camera.set` | ✅ | CLI + MCP + runtime evidence |
| `render.preview` | ✅ | CLI + MCP + runtime evidence |
| `validate.scene` | ✅ | CLI + MCP + runtime evidence |
| `export.asset` | ✅ | GUI bridge GLB runtime evidence recorded |
| `undo.last` | ✅ | Typed slice implemented; safe failure path runtime-verified (successful undo path pending verification) |
| `batch.plan` | ✅ | Plan-only + strict per-operation validation; does not execute steps |
| Observability split (stdout/stderr/bridge console) | ✅ | Implemented and smoke-tested |

---

## 🧪 Needs periodic runtime revalidation

| Area | Why revalidate |
|---|---|
| Export (GLB/GLTF/FBX) | Blender version/context behavior can change |
| Render pipeline | Output path + camera assumptions can regress |
| Validate presets | Rule updates can drift from expectations |
| Bridge startup UX | Blender launch/runtime environments vary across machines |

---

## ⚠️ Known limitations (current)

- Blender 4.2 background mode (`-b`) GLB/GLTF export can fail due to window-context constraints.
- BlendOps currently documents and guards this path for GLB/GLTF.
- GUI bridge mode is the validated runtime path for GLB evidence.

---

## 🚧 Next candidates

1. Batch execute (follow-up to plan-only orchestration)
2. Validation preset expansion
3. Packaging/release automation

---

## 🛡️ Safety / destructive operations

- [x] Add explicit confirmation flow for destructive operations (`scene.clear` requires `CLEAR_SCENE`)
- [x] Add operation-level risk annotations (`bridge.operations` manifest with `destructive` flags)
- [x] Tighten `batch.plan` per-operation validation (`validation_errors`) while keeping plan-only execution semantics
- [ ] Add dry-run semantics for eligible operations
- [x] Expand audit-friendly operation receipts
- [x] Add operation manifest parity check between CLI manifest and MCP `ListTools`

---

## 🧠 AI-agent UX improvements

- [ ] Tighten eval prompts with pass/fail assertions per operation
- [x] Add operation compatibility matrix by Blender version and mode (bridge.status compatibility fields)
- [ ] Improve corrective `next_steps` consistency across operations

---

## 📚 Docs / research tasks

- [x] README / TODO / prior-art polish
- [x] Manual testing and observability docs polish
- [x] Evals and runtime smoke docs consistency formatting
- [x] Add docs lint/check workflow in CI
