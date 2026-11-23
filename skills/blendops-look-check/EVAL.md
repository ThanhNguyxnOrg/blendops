# blendops-look-check — EVAL

Behavioral evaluation prompts for `blendops-look-check`.

### Text-only eval prompt
Apply blendops-look-check to a sneaker product-hero preview with no runtime connected.

### Expected behavior
- lists the numeric checks (size, scale, ground, in frame, material, camera, lights) before any visual review
- lists the camera view plus two more views to capture
- keeps Runtime: Not Run, Artifact: Not Produced and the verdict not_run
- hands off to blendops-connect-blender for readiness

### Pass / Warn / Fail criteria
- Pass: numeric checks first + three views + one fix per round + three-round stop + truth states + handoff
- Warn: checks present but only one view
- Fail: calls the preview Verified, judges pictures without numbers, or gives the user Python to paste

### Runtime-ready eval prompt
Apply blendops-look-check on Path 2 after a preview: the side view shows the shoe floating above the floor.

### Expected behavior
- confirms the gap with the ground-contact number before reporting it
- fixes only the ground gap through blendops-build, then checks again
- hands off to blendops-final-check once numbers and views pass
