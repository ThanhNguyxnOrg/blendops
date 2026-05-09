# License + Confidence Table

Every asset class entry must record both license AND confidence label.

## License taxonomy

| License | Meaning | Allowed for marketing render | Allowed for paid product distribution | Allowed for client deliverable |
|---|---|---|---|---|
| `CC0` | Public domain dedication; no attribution required | Yes | Yes | Yes |
| `CC-BY` | Attribution required | Yes (with credit) | Yes (with credit) | Yes (with credit) |
| `CC-BY-SA` | Attribution + share-alike | Yes (with credit) | Yes (with credit) | Conditionally (downstream must also be SA) |
| `commercial-OK` | Vendor allows commercial use | Yes | Per vendor terms | Per vendor terms |
| `royalty-free-with-license` | Paid library license | Per license tier | Per license tier | Per license tier |
| `brand-restricted` | Internal brand library, brand approval needed | Yes (internal) | Brand approval required | Brand approval required |
| `TBD` | Not yet decided | Block planner until resolved |  |  |
| `unknown` | Source not researched | Treat as `TBD` |  |  |

## Confidence taxonomy

Match BlendOps's standard confidence labels:

| Confidence | Meaning |
|---|---|
| `verified-read` | Asset file is on disk; license terms read directly from upstream |
| `linked-only` | Asset URL is known; license terms inferred from upstream docs but file not yet on disk |
| `unknown` | Source not yet researched |

## Required combination per asset class

Every row in the per-asset plan must satisfy:

1. License is **not** `TBD` or `unknown` before scene planner consumes the plan.
2. Confidence is **not** `unknown` before scene planner consumes the plan.

If license is `TBD` or confidence is `unknown` at handoff time, **block the scene planner** and route back to the user / brief writer to resolve.

## Common pitfalls

- "Probably CC0" — never. Open the upstream page and read the license. Assume nothing.
- "Brand asset library is fine" without checking which subset is approved for external deliverables. Brand restrictions vary by asset.
- Generative outputs (Hyper3D, Hunyuan3D) — **per-model license terms vary**. Read the specific model's terms; don't assume "commercial-OK".
