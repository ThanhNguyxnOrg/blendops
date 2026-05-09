# three-fiber-component-shape-planner

Purpose: plan the React Three Fiber component shape (props, refs, Suspense, useGLTF cache, animation hook contract) before delivering a GLB to a web team.

Use when the consumer is using React Three Fiber (R3F), before component code is written.

Do not use for vanilla Three.js / Babylon / model-viewer consumers (different stacks have different APIs). Do not generate component code — spec only.

Return the component spec: name + R3F version, props table (name + type + default + purpose), ref interface, Suspense placement, useGLTF caching policy, animation hook contract, cleanup contract, fallback contract, minimal usage example.

Hand off to glb-web-handoff with the spec attached.
