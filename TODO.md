# 🧭 BlendOps Roadmap

_Last updated: 2026-04-26_

This roadmap reflects **current code + runtime evidence**.

---

## ✅ Completed and validated

| Slice | Status | Notes |
|---|---:|---|
| `scene.inspect` | ✅ | CLI + MCP + runtime evidence |
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

1. `scene.clear --confirm`
2. Batch operations (safe multi-step orchestration)
3. Validation preset expansion
4. Packaging/release automation

---

## 🛡️ Safety / destructive operations

- [ ] Add explicit confirmation flow for destructive operations
- [x] Add operation-level risk annotations (`bridge.operations` manifest with `destructive` flags)
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
