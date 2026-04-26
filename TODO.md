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

1. `undo.last`
2. `scene.clear --confirm`
3. Batch operations (safe multi-step orchestration)
4. Validation preset expansion
5. Packaging/release automation

---

## 🛡️ Safety / destructive operations

- [ ] Add explicit confirmation flow for destructive operations
- [ ] Add operation-level risk annotations
- [ ] Add dry-run semantics for eligible operations
- [ ] Expand audit-friendly operation receipts

---

## 🧠 AI-agent UX improvements

- [ ] Tighten eval prompts with pass/fail assertions per operation
- [ ] Add operation compatibility matrix by Blender version and mode
- [ ] Improve corrective `next_steps` consistency across operations

---

## 📚 Docs / research tasks

- [x] Prior-art research refresh and inheritance guidance
- [x] README landing-page polish and capability matrix
- [x] Manual testing and observability docs polish
- [x] Runtime smoke docs consistency formatting
- [ ] Add docs lint/check workflow in CI
