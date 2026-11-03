# Blender Version Compatibility Matrix (`3.6 LTS`, `4.2 LTS`, `5.1+`)

> [!IMPORTANT]
> **Runtime Floor Boundary:** The **Blender 5.1+** floor applies **exclusively to Path 1 — Official Blender Lab MCP** (`blender_version_min = "5.1.0"` in the Blender Lab add-on manifest), covering both **Host (a) Anthropic Blender Connector** (not standalone) and **Host (b) any other MCP client manually configured**. Do **not** apply the `5.1+` floor to **Path 2 — Community `mcp-for-blender`** (which supports **Blender 3.0+**, including `3.6 LTS` and `4.2 LTS`) or to the **CLI fallback appendix** (`blender --background --python`).

---

## 1. Purpose

Provide a single, authoritative version-compatibility reference across the three major Blender release lines encountered by BlendOps users and AI agents:

1. **Blender `3.6 LTS`** — Legacy long-term support release using Principled BSDF v1, legacy EEVEE (`BLENDER_EEVEE`), and `Filmic` as the default view transform. Supported via **Path 2 (`mcp-for-blender`)** and the **CLI fallback appendix**, never Path 1.
2. **Blender `4.2 LTS`** — Modern long-term support release introducing **Principled BSDF v2** (from 4.0), **EEVEE Next** (`BLENDER_EEVEE_NEXT`), **AgX** default color management, **Khronos PBR Neutral** view transform, and updated glTF 2.0 PBR extensions. Supported via **Path 2 (`mcp-for-blender`)** and the **CLI fallback appendix**, never Path 1.
3. **Blender `5.1+`** — Required floor for **Path 1 — Official Blender Lab MCP** (`bpype/blender_mcp` Lab add-on + Lab server). Also supported by **Path 2** and the **CLI fallback appendix**.

See [`runtime-stack-strategy.md`](./runtime-stack-strategy.md) and [`external-runtime-setup.md`](./external-runtime-setup.md) for runtime path selection.

---

## 2. Runtime Execution Path Compatibility Matrix

| Runtime Path | Blender `3.6 LTS` | Blender `4.2 LTS` | Blender `5.1+` | Governing Upstream Constraint |
| :--- | :---: | :---: | :---: | :--- |
| **Path 1 (Host a)** — Official Blender Lab MCP + Anthropic Connector | Unsupported | Unsupported | **Supported (`>= 5.1.0`)** | Blender Lab MCP add-on `blender_manifest.toml` declares `blender_version_min = "5.1.0"`. Anthropic Connector Step 2 requires installing this Lab add-on inside Blender (Connector is not standalone). |
| **Path 1 (Host b)** — Official Blender Lab MCP + Manual MCP Client | Unsupported | Unsupported | **Supported (`>= 5.1.0`)** | Same Blender Lab MCP add-on and server (`https://www.blender.org/lab/mcp-server/`). |
| **Path 2** — Community `mcp-for-blender` (`ahujasid/mcp-for-blender`) | **Supported (`>= 3.0`)** | **Supported (`>= 3.0`)** | **Supported (`>= 3.0`)** | Community socket add-on supports Blender `3.0+` (`bl_info["blender"] = (3, 0, 0)`). See [`unofficial-runtime-bridges.md`](./unofficial-runtime-bridges.md). |
| **CLI Fallback Appendix** — Direct `blender --background --python` | **Supported** | **Supported** | **Supported** | First-class upstream Blender CLI (`https://docs.blender.org/manual/en/latest/advanced/command_line/index.html`). |

---

## 3. Principled BSDF Shader Socket Matrix (`3.6 LTS` vs `4.2 LTS` vs `5.1+`)

Blender `4.0` overhauled the **Principled BSDF** node (`ShaderNodeBsdfPrincipled`), renaming several inputs and reorganizing coat, sheen, subsurface, specular, and emission layers. Skills that plan materials (`lighting-material-plan`, `material-quality-checker`) must distinguish `3.6 LTS` (Principled v1) from `4.2 LTS` and `5.1+` (Principled v2).

| Material Property | Blender `3.6 LTS` (Principled v1) | Blender `4.2 LTS` (Principled v2) | Blender `5.1+` (Principled v2) | Domain & glTF 2.0 Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Base Color** | `Base Color` (`RGBA`) | `Base Color` (`RGBA`) | `Base Color` (`RGBA`) | Maps to `pbrMetallicRoughness.baseColorFactor` / `baseColorTexture`. |
| **Metallic** | `Metallic` (`Float 0..1`) | `Metallic` (`Float 0..1`) | `Metallic` (`Float 0..1`) | Maps to `pbrMetallicRoughness.metallicFactor`. Keep binary (`0.0` dielectric or `1.0` raw metal) unless dirty/oxidized transition is mapped. |
| **Roughness** | `Roughness` (`Float 0..1`) | `Roughness` (`Float 0..1`) | `Roughness` (`Float 0..1`) | Maps to `pbrMetallicRoughness.roughnessFactor`. Avoid `0.00` mirror-flat or `1.00` chalk-dead extremes on hero surfaces. |
| **IOR** | `IOR` (`Float`, default `1.45`) | `IOR` (`Float`, default `1.50`) | `IOR` (`Float`, default `1.50`) | Default dielectric IOR shifted from `1.45` (`3.6 LTS`) to `1.50` (`4.0+`); exports via `KHR_materials_ior`. |
| **Specular Level** | `Specular` (`Float`, default `0.5`) | `Specular IOR Level` (`Float`, default `0.5`) | `Specular IOR Level` (`Float`, default `0.5`) | Socket renamed in `4.0+`; exports via `KHR_materials_specular`. |
| **Specular Tint** | `Specular Tint` (`Float 0..1`) | `Specular Tint` (`Color RGBA`) | `Specular Tint` (`Color RGBA`) | Changed from scalar float in `3.6 LTS` to RGB color in `4.0+` / `4.2 LTS` / `5.1+`. |
| **Subsurface Weight** | `Subsurface` (`Float 0..1`) | `Subsurface Weight` (`Float 0..1`) | `Subsurface Weight` (`Float 0..1`) | Renamed to `Subsurface Weight`; `Subsurface Scale` added as explicit distance multiplier in `4.0+`. |
| **Transmission** | `Transmission` (`Float 0..1`) + `Transmission Roughness` | `Transmission Weight` (`Float 0..1`) | `Transmission Weight` (`Float 0..1`) | Renamed to `Transmission Weight`; separate `Transmission Roughness` socket removed in `4.0+` (governed by primary `Roughness`). Exports via `KHR_materials_transmission`. |
| **Clearcoat / Coat** | `Clearcoat` + `Clearcoat Roughness` + `Clearcoat Normal` | `Coat Weight` + `Coat Roughness` + `Coat IOR` + `Coat Tint` + `Coat Normal` | `Coat Weight` + `Coat Roughness` + `Coat IOR` + `Coat Tint` + `Coat Normal` | Prefix changed from `Clearcoat` to `Coat` in `4.0+`; exports via `KHR_materials_clearcoat`. |
| **Sheen** | `Sheen` + `Sheen Tint` (`Float`) | `Sheen Weight` + `Sheen Roughness` + `Sheen Tint` (`Color`) | `Sheen Weight` + `Sheen Roughness` + `Sheen Tint` (`Color`) | Reworked into microfibers model in `4.0+`; exports via `KHR_materials_sheen`. |
| **Emission** | `Emission` (`Color`) + `Emission Strength` (`Float`) | `Emission Color` (`Color`) + `Emission Strength` (`Float`) | `Emission Color` (`Color`) + `Emission Strength` (`Float`) | Socket renamed from `Emission` to `Emission Color` in `4.0+`; exports to core `emissiveFactor` and `KHR_materials_emissive_strength`. |

---

## 4. Render Engine & Lighting Compatibility Matrix (`3.6 LTS` vs `4.2 LTS` vs `5.1+`)

Skills that plan rendering and lighting (`cycles-vs-eevee-decision`, `lighting-material-plan`, `lighting-quality-checker`) must account for the EEVEE Next transition in `4.2 LTS` and unified identifier handling in `5.0+` / `5.1+`.

| Capability / Identifier | Blender `3.6 LTS` | Blender `4.2 LTS` | Blender `5.1+` | Planning Guidance |
| :--- | :--- | :--- | :--- | :--- |
| **Cycles Engine ID** | `CYCLES` | `CYCLES` | `CYCLES` | Unchanged across all versions. Path-traced reference for hero stills and refractive glass. |
| **EEVEE Engine ID** | `BLENDER_EEVEE` (Legacy EEVEE) | `BLENDER_EEVEE_NEXT` (EEVEE Next) | `BLENDER_EEVEE` (EEVEE Next unified ID) | `4.2 LTS` replaced legacy EEVEE with EEVEE Next under `BLENDER_EEVEE_NEXT`; `5.0+` / `5.1+` retains the EEVEE Next architecture under `BLENDER_EEVEE`. |
| **Screen-Space Reflections / Raytracing** | Legacy `use_ssr` + `use_ssr_refraction` toggles | Unified **Raytracing** pipeline (`use_raytracing`) | Unified **Raytracing** pipeline (`use_raytracing`) | Do not instruct `4.2 LTS` or `5.1+` users to enable legacy "Screen Space Reflections" checkboxes; specify EEVEE Raytracing instead. |
| **Irradiance / Reflection Probes** | `Irradiance Volume` + `Reflection Cubemap` + `Reflection Plane` | `Light Probe Volume` + `Light Probe Sphere` + `Light Probe Plane` | `Light Probe Volume` + `Light Probe Sphere` + `Light Probe Plane` | Probe object types were renamed in `4.2 LTS`. |
| **Shadow System (EEVEE)** | Cascade + Cube shadow maps with manual resolution | Virtual Shadow Maps (VSM) with shadow pool memory budget | Virtual Shadow Maps (VSM) with shadow pool memory budget | High light counts in `4.2 LTS` / `5.1+` can exhaust the EEVEE shadow pool if non-key lights are not budget-capped. |

---

## 5. Color Management & View Transform Matrix (`3.6 LTS` vs `4.2 LTS` vs `5.1+`)

Skills that govern color management (`color-management-decision`, `product-hero-scene-planner`, `glb-web-handoff`) must align view transform recommendations with the user's Blender version and target delivery surface.

| View Transform | Blender `3.6 LTS` | Blender `4.2 LTS` | Blender `5.1+` | Recommended Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **`AgX`** | Not built-in | **Default view transform** | **Default view transform** | Default for photographic/cinematic hero renders (`product-hero-scene-planner`, `character-portrait`) with graceful highlight desaturation. |
| **`Khronos PBR Neutral`** | Not built-in | **Built-in (`4.2+`)** | **Built-in (`5.1+`)** | Best match for e-commerce product shots and web GLB parity where brand-accurate sRGB base colors must not hue-shift under studio white light. |
| **`Filmic`** | **Default view transform** | Built-in (legacy compatibility) | Built-in (legacy compatibility) | Use on `3.6 LTS` or when matching existing `3.x` studio look-LUT pipelines. |
| **`Standard`** | Built-in | Built-in | Built-in | Uncompressed linear-to-sRGB transfer; use only for UI flat graphics or strict unlit color matching. |

---

## 6. glTF 2.0 / GLB Exporter (`io_scene_gltf2`) Matrix & Container Verification (`scripts/inspect-glb.mjs`)

| Feature / Verification Check | Blender `3.6 LTS` | Blender `4.2 LTS` | Blender `5.1+` | Deterministic Verification via `scripts/inspect-glb.mjs` |
| :--- | :--- | :--- | :--- | :--- |
| **Core Binary Framing (`GLB 2.0`)** | Magic `0x46546C67` (`glTF`), version `2`, Chunk 0 `JSON`, Chunk 1 `BIN\0` | Magic `0x46546C67` (`glTF`), version `2`, Chunk 0 `JSON`, Chunk 1 `BIN\0` | Magic `0x46546C67` (`glTF`), version `2`, Chunk 0 `JSON`, Chunk 1 `BIN\0` | `node scripts/inspect-glb.mjs <file.glb>` validates 12-byte header, 4-byte chunk alignment, space (`0x20`) JSON padding, and exact byte length. |
| **PBR Extensions Exported** | `KHR_materials_ior`, `KHR_materials_specular`, `KHR_materials_transmission`, `KHR_materials_clearcoat`, `KHR_materials_sheen`, `KHR_materials_emissive_strength`, `KHR_materials_unlit` | Adds Principled v2 socket mapping + `KHR_materials_anisotropy` & `KHR_materials_dispersion` | Full Principled v2 glTF 2.0 extension set + pointer animation support | `inspect-glb.mjs` extracts `extensionsUsed` and `extensionsRequired` and verifies every required extension is declared in `extensionsUsed`. |
| **Draco Mesh Compression** | `KHR_draco_mesh_compression` | `KHR_draco_mesh_compression` | `KHR_draco_mesh_compression` | `inspect-glb.mjs` reports extension presence and bufferView/accessor structure. |
| **Accessor `POSITION` Bounds** | Required by glTF 2.0 spec (`min` / `max` 3-element arrays) | Required by glTF 2.0 spec (`min` / `max` 3-element arrays) | Required by glTF 2.0 spec (`min` / `max` 3-element arrays) | `inspect-glb.mjs --strict-bounds` verifies all mesh `POSITION` accessors define finite 3D `min`/`max` bounds and computes scene bounding-box dimensions. |
| **Khronos `gltf-validator` Hook** | Optional via `--khronos` | Optional via `--khronos` | Optional via `--khronos` | `node scripts/inspect-glb.mjs <file.glb> --khronos` runs `gltf-validator` when installed or reports `"status": "unavailable"` honestly when absent. |

> [!WARNING]
> **Container Integrity vs. Visual & Runtime Truth:** Passing `scripts/inspect-glb.mjs` (and optional Khronos `gltf-validator`) proves **container-level binary and JSON structural validity only** (`provesContainerIntegrity: true`). It does **not** prove visual framing, lighting quality, or that a live Blender session executed (`provesVisualCorrectness: false`, `provesBlenderRuntimeExecution: false`). Under [`../laws/evidence-before-done.md`](../laws/evidence-before-done.md), an artifact cannot be marked `Verified` without both runtime/file evidence and passed visual/domain validation checks.

---

## 7. Authoritative Upstream Citations

1. **Blender Lab MCP Server (`5.1+` Path 1 Floor):** `https://www.blender.org/lab/mcp-server/`
2. **Anthropic Blender Connector Tutorial (Step 2 Lab Add-on Requirement):** `https://claude.com/resources/tutorials/using-the-blender-connector-in-claude`
3. **Blender Command Line Arguments (CLI Fallback Appendix):** `https://docs.blender.org/manual/en/latest/advanced/command_line/index.html`
4. **Blender 4.0 Release Notes — Principled BSDF v2 & AgX Color Management:** `https://developer.blender.org/docs/release_notes/4.0/shading/` and `https://developer.blender.org/docs/release_notes/4.0/color_management/`
5. **Blender 4.2 LTS Release Notes — EEVEE Next, Khronos PBR Neutral & glTF 2.0:** `https://developer.blender.org/docs/release_notes/4.2/eevee/` and `https://developer.blender.org/docs/release_notes/4.2/pipeline_assets_io/`
6. **Blender Manual — Principled BSDF Node:** `https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html`
7. **Blender Manual — glTF 2.0 Add-on (`io_scene_gltf2`):** `https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html`
8. **Khronos glTF 2.0 Binary Container Specification (Section 4.4 GLB File Format):** `https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification`
