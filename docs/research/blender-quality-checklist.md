# Blender Quality Checklist (BlendOps)

Status: Draft checklist for research phase
Date: 2026-04-29

How to use:
- Mark each item as ✅ Pass, ⚠ Warning, or ❌ Fail.
- Any ❌ in export/web readiness blocks “ready” status.
- Include caveat notes for any ⚠ items.

---

## 1) Subject clarity

- [ ] Primary subject is obvious at first glance.
- [ ] Visual hierarchy is clear (primary vs supporting elements).
- [ ] No accidental clutter competing with the subject.
- [ ] The intended user outcome is visually understandable.

Notes:

---

## 2) Composition

- [ ] Framing supports the subject intent.
- [ ] Negative space is deliberate, not accidental.
- [ ] Composition guides/safe area checks were considered.
- [ ] Foreground/midground/background relationships are coherent.

Notes:

---

## 3) Scale

- [ ] Scene units and scale assumptions are documented.
- [ ] Key dimensions were measured and validated.
- [ ] Relative proportions between major objects are plausible.
- [ ] Any intentional scale stylization is explicitly documented.

Notes:

---

## 4) Camera/framing

- [ ] Hero camera angle is intentional and stable.
- [ ] Lens choice supports desired perspective.
- [ ] Critical subject parts are not unintentionally cropped.
- [ ] Camera framing matches target usage (hero shot, catalog, etc.).

Notes:

---

## 5) Lighting

- [ ] Subject silhouette readability is strong.
- [ ] Key light direction and contrast are intentional.
- [ ] Lighting supports material readability.
- [ ] No unintentional overexposure/underexposure hotspots.

Notes:

---

## 6) Materials

- [ ] Material assignment is complete and coherent.
- [ ] PBR intent is plausible for the target style.
- [ ] Color vs non-color texture semantics are respected.
- [ ] Material setup is compatible with web handoff constraints.

Notes:

---

## 7) Background/environment

- [ ] Background/environment supports, not distracts from, subject.
- [ ] Horizon/grounding cues are coherent where required.
- [ ] Environment reflections/lighting are not contradictory.
- [ ] Background complexity is appropriate for final use case.

Notes:

---

## 8) Render readiness

- [ ] Preview/render checks were performed in appropriate shading mode.
- [ ] Sampling/denoise strategy is documented for final output.
- [ ] Major artifacts/noise issues are resolved or flagged.
- [ ] Render outputs match intended quality level.

Notes:

---

## 9) Export readiness

- [ ] Transforms are validated/applied as needed.
- [ ] Object naming and scene organization are handoff-ready.
- [ ] Export settings are aligned to target GLB/glTF pipeline.
- [ ] Required extension/runtime assumptions are documented.

Notes:

---

## 10) Web readiness

- [ ] GLB opens successfully in at least one independent validator/viewer.
- [ ] Three.js/R3F loader requirements are documented.
- [ ] Performance risk notes are included (draw calls/textures/complexity).
- [ ] Compression/texture strategy is stated when applicable.

Notes:

---

## 11) User-facing explanation quality

- [ ] Summary is understandable by non-Blender users.
- [ ] Technical jargon is minimized or explained.
- [ ] Recommendations are actionable and prioritized.
- [ ] External runtime assumptions are clearly stated.

Notes:

---

## 12) Failure/caveat reporting

- [ ] Blocking issues are explicitly called out.
- [ ] Warnings include impact and mitigation guidance.
- [ ] Unknown/unverified points are labeled transparently.
- [ ] Final status is honest (Ready / Conditionally Ready / Not Ready).

Notes:

---

## Final status

- Overall result: ✅ Ready / ⚠ Conditionally Ready / ❌ Not Ready
- Reviewer:
- Date:
- Blocking issues summary:
- Recommended next step:
