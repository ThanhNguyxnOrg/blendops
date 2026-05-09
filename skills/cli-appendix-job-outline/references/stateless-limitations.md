# Stateless limitations

- No interactive tweak loop inside one long session unless the script itself encodes iterations (still non-interactive).
- Viewport-only proofs need render/export output — CLI won't substitute human viewport confirmation by default.
- Add-on availability differs under factory startup profiles — operators must verify enabled extensions match batch assumptions (upstream docs).
- GPU device selection is environment-dependent — failure logs belong in evidence ledger.

Framing reminder: CLI remains a **first-class** upstream surface; BlendOps simply lacks an in-repo captured eval file today.
