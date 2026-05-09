# glb-animation-handoff

Purpose: document the GLB animation contract (skeletal / morph, FPS, looping, root motion, blend transitions) with truthful caveats per consumer web stack.

Use whenever the GLB ships with at least one animation clip and the consumer is a web app (Three.js / R3F / Babylon / model-viewer).

Do not use for static GLBs or for game-engine pipelines that re-author animation downstream.

Output contract: per-clip rows (name, type, length, FPS, loop, trigger, blend, root motion, interpolation), consumer-stack caveats, animation channel + bone budget rows, evidence label.
