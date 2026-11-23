# Asset source gate

Runtime tools can fetch or generate assets on their own: Path 2 (`mcp-for-blender`) exposes `search_assets` / `import_asset` (Poly Haven, Sketchfab) and `generate_3d` (Hyper3D Rodin, Hunyuan3D). An agent that calls them unasked can spend the user's credits, pull in assets with unknown licenses, and send the user's prompt or images to a third-party service.

## Rule

Fetch, import, or generate an asset only when all three hold:

1. **In the plan.** The locked asset plan names this asset, this source (for example "HDRI from Poly Haven", "hero shoe from Hyper3D"), and its license or `TBD`.
2. **Asked this session.** The user said yes to this call in plain words: what will be fetched or generated, from which service, whether it costs credits or sends their prompt or images out, and the license.
3. **Turned on for this call only.** On Path 2, only the integration for the approved source is switched on in the add-on panel; the others stay off.

Anything else is a stop: build the part from primitives or procedural materials as the plan's fallback, or ask the user. A file the user supplied is not gated.

## Record

For every fetched or generated asset, write into the run evidence: source and asset id or generation prompt, license as read from the source, the user's approval in their words, and the file path it landed at. An asset without this record is not used in a final render or GLB.

## Plain-language ask

```txt
To make the shoe, I can ask Hyper3D (an online AI model maker) to generate it from your description.
It uses your Hyper3D credits and sends the description to their servers. The license is Hyper3D's terms (not yet checked).
Shall I go ahead? If not, I will build a simpler shoe from basic shapes.
```
